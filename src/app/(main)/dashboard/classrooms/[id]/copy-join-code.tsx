"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyJoinCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 px-4 py-2.5 rounded-lg bg-surface-2 border border-white/[0.08] font-mono text-sm text-text-primary tracking-wide select-all">
        {code}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1.5 text-emerald-400" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1.5" />
            Copy Code
          </>
        )}
      </Button>
    </div>
  );
}
