"use client";

import { Search } from "lucide-react";

export function SearchTrigger() {
  const open = () => {
    const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true });
    window.dispatchEvent(event);
  };
  return (
    <button
      onClick={open}
      className="w-full flex items-center gap-2 rounded-[8px] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"
      aria-label="Buka pencarian cepat"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Cari...</span>
      <kbd className="text-xs">⌘K</kbd>
    </button>
  );
}
