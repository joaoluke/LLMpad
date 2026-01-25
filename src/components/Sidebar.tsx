import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Pencil, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Conversation } from "../types";

interface SidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: number) => void;
  onUpdateConversationTitle: (id: number, title: string) => Promise<void>;
}

export function Sidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onUpdateConversationTitle,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingId]);

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setDraftTitle(conv.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftTitle("");
  };

  const commitEditing = async () => {
    if (editingId === null) return;
    const title = draftTitle.trim();
    if (!title) return;
    await onUpdateConversationTitle(editingId, title);
    setEditingId(null);
    setDraftTitle("");
  };

  return (
    <div className="w-64 bg-gray-900 flex flex-col">
      <div className="p-4">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nova Conversa
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors group ${
              currentConversation?.id === conv.id ? "bg-gray-800" : ""
            }`}
          >
            <MessageSquare size={18} className="text-gray-400 flex-shrink-0" />
            {editingId === conv.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitEditing();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      cancelEditing();
                    }
                  }}
                  onBlur={() => {
                    commitEditing();
                  }}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    commitEditing();
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Salvar"
                >
                  <Check size={14} className="text-gray-300" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEditing();
                  }}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Cancelar"
                >
                  <X size={14} className="text-gray-300" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 truncate text-sm">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(conv);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                  title="Editar título"
                >
                  <Pencil size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                  title="Excluir"
                >
                  <Trash2 size={14} className="text-gray-400" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
