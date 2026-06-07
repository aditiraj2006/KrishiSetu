import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  copyText?: string;
  ariaLabel?: string;
  className?: string;
  textClassName?: string;
}

const CopyableText = ({
  text,
  copyText = text,
  ariaLabel = "Copy text",
  className,
  textClassName,
}: Props) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(copyText);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = copyText;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard();

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <span className={cn("truncate", textClassName)}>{text}</span>

      <button
        type="button"
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>

      {copied && <span className="text-xs text-green-500">Copied!</span>}
    </div>
  );
};

export default CopyableText;
