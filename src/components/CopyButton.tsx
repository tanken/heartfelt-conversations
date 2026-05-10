import { useState } from "react";

export function CopyButton({
  value,
  children = "Copy",
  className = "",
}: {
  value: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={className}
    >
      {copied ? "Copied ✓" : children}
    </button>
  );
}
