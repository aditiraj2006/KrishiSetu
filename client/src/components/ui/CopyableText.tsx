import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  text: string;
}

const CopyableText = ({ text }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="truncate">{text}</span>

      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        aria-label="Copy ID"
      >
        {copied ? (
          <Check size={16} className="text-green-500" />
        ) : (
          <Copy size={16} />
        )}
      </button>

      {copied && (
        <span className="text-xs text-green-500">
          Copied!
        </span>
      )}
    </div>
  );
};

export default CopyableText;