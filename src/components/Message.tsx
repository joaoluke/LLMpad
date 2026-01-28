import ReactMarkdown from "react-markdown";

import { CopyButton } from "./CopyButton";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
}

export const Message: React.FC<MessageProps> = ({ role, content }) => {
  return (
    <div>
      <div
        className={`max-w-[100%] rounded-2xl px-4 py-2 ${
          role === "user" ? "bg-blue-600" : "bg-gray-700"
        }`}
      >
        <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
          {content}
        </ReactMarkdown>
      </div>
      {role === "assistant" && (
        <CopyButton text={content} className="message-copy-btn" />
      )}
    </div>
  );
};
