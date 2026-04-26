"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="relative group rounded-[10px] border border-[color:var(--border)] bg-[color:var(--muted)]/40 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[color:var(--border)]/60 bg-[color:var(--muted)]/60">
        <span className="text-[10px] uppercase tracking-wider font-mono text-[color:var(--muted-foreground)]">{lang}</span>
        <button
          onClick={copy}
          aria-label="Salin kode"
          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--background)]/60"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? "Tersalin" : "Salin"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed">{code}</pre>
    </div>
  );
}

export function CodeTabs({
  samples,
}: {
  samples: Array<{ label: string; lang: string; code: string }>;
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="rounded-[10px] border border-[color:var(--border)] bg-[color:var(--muted)]/40 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[color:var(--border)]/60 bg-[color:var(--muted)]/60">
        <div className="flex gap-1">
          {samples.map((s, i) => (
            <button
              key={s.label}
              onClick={() => setActive(i)}
              className={`text-xs font-medium px-2.5 py-1 rounded ${
                active === i
                  ? "bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm"
                  : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <CopyInline code={samples[active]?.code ?? ""} />
      </div>
      <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed">{samples[active]?.code}</pre>
    </div>
  );
}

function CopyInline({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={copy}
      aria-label="Salin kode"
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--background)]/60"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span>{copied ? "Tersalin" : "Salin"}</span>
    </button>
  );
}
