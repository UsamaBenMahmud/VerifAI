import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopyPromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Prompt copied to clipboard");
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-cyan/40 px-2.5 py-1 text-xs text-cyan hover:bg-cyan/10 transition"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy Prompt"}
    </button>
  );
}
