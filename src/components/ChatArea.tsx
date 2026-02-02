import { useRef, useEffect } from "react";
import { Bot, User, Send, Loader2, Moon, Sun } from "lucide-react";

import { Message } from "./Message";
import { useAppContext } from "../contexts/store";

export function ChatArea() {
  const {
    input,
    theme,
    setTheme,
    setInput,
    messages,
    isLoading,
    sendMessage,
    currentConversation,
  } = useAppContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="h-14 border-b d ark:border-gray-700 border-gray-300 flex items-center justify-between px-4">
        <h1 className="font-semibold dark:text-gray-400 text-gray-600">
          {currentConversation?.title || "Nova Conversa"}
        </h1>

        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? (
            <Sun className="text-gray-400" size={20} />
          ) : (
            <Moon className="text-gray-600" size={20} />
          )}
        </button>
      </div>

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
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} />
                </div>
              )}

              <Message role={message.role} content={message.content} />

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

      <div className="p-4 border-t dark:border-gray-700 border-gray-300">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1 dark:bg-gray-700 bg-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
          />
          <button
            onClick={sendMessage}
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
