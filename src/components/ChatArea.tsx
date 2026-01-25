import { useRef, useEffect } from "react";
import { Bot, User, Send, Loader2, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message, Conversation } from "../types";

interface ChatAreaProps {
  messages: Message[];
  currentConversation: Conversation | null;
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onOpenSettings: () => void;
}

export function ChatArea({
  messages,
  currentConversation,
  input,
  isLoading,
  onInputChange,
  onSendMessage,
  onOpenSettings,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
        <h1 className="font-semibold">
          {currentConversation?.title || "Nova Conversa"}
        </h1>
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Bot size={48} className="mb-4 opacity-50" />
            <p>Comece uma conversa!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600"
                    : "bg-gray-700"
                }`}
              >
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <User size={18} />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="bg-gray-700 rounded-2xl px-4 py-2">
              <Loader2 className="animate-spin" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-700 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
          />
          <button
            onClick={onSendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
