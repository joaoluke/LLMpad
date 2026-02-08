import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

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
        <ReactMarkdown
          className="prose prose-invert prose-sm max-w-none"
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {role === "assistant" && (
        <CopyButton text={content} className="message-copy-btn" />
      )}
    </div>
  );
};
