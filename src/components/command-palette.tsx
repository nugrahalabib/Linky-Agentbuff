"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Home, Link as LinkIcon, Plus, QrCode, Search, Settings, Tag as TagIcon, Folder, Upload, Download, Zap } from "lucide-react";

type Cmd = { label: string; icon: React.ComponentType<{ className?: string }>; action: () => void; keywords?: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const go = (path: string) => () => {
    setOpen(false);
    router.push(path);
  };

  const commands: Cmd[] = [
    { label: "Beranda dashboard", icon: Home, action: go("/dashboard") },
    { label: "Buat link baru", icon: Plus, action: go("/dashboard/links/new"), keywords: "create new add tambah baru" },
    { label: "Lihat semua link", icon: LinkIcon, action: go("/dashboard/links") },
    { label: "Analitik keseluruhan", icon: BarChart3, action: go("/dashboard/analytics") },
    { label: "Studio QR", icon: QrCode, action: go("/dashboard/qr") },
    { label: "Folder", icon: Folder, action: go("/dashboard/folders") },
    { label: "Tag", icon: TagIcon, action: go("/dashboard/tags") },
    { label: "UTM Recipes", icon: Zap, action: go("/dashboard/utm-recipes"), keywords: "utm templates" },
    { label: "Import CSV", icon: Upload, action: go("/dashboard/import") },
    { label: "Export CSV", icon: Download, action: () => { setOpen(false); window.location.href = "/api/links/export"; } },
    { label: "Pengaturan", icon: Settings, action: go("/dashboard/settings") },
  ];

  const filtered = q
    ? commands.filter(
        (c) => c.label.toLowerCase().includes(q.toLowerCase()) || (c.keywords ?? "").toLowerCase().includes(q.toLowerCase()),
      )
    : commands;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-[color:var(--background)]/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-[16px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[color:var(--border)]">
          <Search className="h-4 w-4 text-[color:var(--muted-foreground)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ketik untuk mencari... (Esc untuk tutup)"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[color:var(--muted-foreground)]"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-[color:var(--border)] px-2 py-0.5 text-xs text-[color:var(--muted-foreground)]">
            ⌘K
          </kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-sm text-center text-[color:var(--muted-foreground)]">
              Tidak ada hasil untuk "{q}"
            </li>
          ) : (
            filtered.map((c) => (
              <li key={c.label}>
                <button
                  onClick={c.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-[color:var(--muted)] transition-colors"
                >
                  <c.icon className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                  <span>{c.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
