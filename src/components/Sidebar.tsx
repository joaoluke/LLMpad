import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Conversation } from "../types";

interface SidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: number) => void;
}

export function Sidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
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
            <span className="flex-1 truncate text-sm">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
            >
              <Trash2 size={14} className="text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
