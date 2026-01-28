import React from "react";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { IMessage } from "../types";

interface MessagesProps {
  messages: IMessage[];
}

export function Messages({ messages }: MessagesProps) {
  return (
    <>
      {messages.map((message) => (
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
      ))}
    </>
  );
}
