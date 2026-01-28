import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        inline-flex items-center justify-center
        p-1 rounded-md transition-all duration-200
        hover:bg-gray-600 active:scale-95
        text-gray-300 hover:text-white
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${className}
      `}
      title={copied ? "Copiado!" : "Copiar mensagem"}
      aria-label="Copiar mensagem"
    >
      {copied ? (
        <Check size={18} className="animate-pulse" />
      ) : (
        <Copy size={18} />
      )}
    </button>
  );
};
