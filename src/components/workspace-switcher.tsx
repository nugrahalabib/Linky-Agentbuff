"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";

type Workspace = { id: string; name: string; slug: string; role: string };

export function WorkspaceSwitcher({ activeId, activeName }: { activeId: string; activeName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (open && !workspaces) {
      fetch("/api/workspace")
        .then((r) => r.json())
        .then((d) => setWorkspaces(d.workspaces ?? []))
        .catch(() => setWorkspaces([]));
    }
  }, [open, workspaces]);

  const switchTo = async (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    const res = await fetch("/api/workspace/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    });
    if (res.ok) {
      setOpen(false);
      router.refresh();
      router.push("/dashboard");
    }
  };

  const createNew = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setOpen(false);
        setNewName("");
        router.refresh();
        router.push("/dashboard");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 rounded-[8px] border border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[color:var(--muted)]"
        aria-haspopup="listbox"
      >
        <Building2 className="h-4 w-4 text-[color:var(--muted-foreground)] shrink-0" />
        <span className="flex-1 text-left truncate font-medium">{activeName}</span>
        <ChevronsUpDown className="h-4 w-4 text-[color:var(--muted-foreground)] shrink-0" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute z-40 mt-1 w-full max-w-xs rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl overflow-hidden">
            <ul className="max-h-60 overflow-y-auto py-1">
              {workspaces === null ? (
                <li className="px-3 py-2 text-xs text-[color:var(--muted-foreground)]">Memuat...</li>
              ) : (
                workspaces.map((w) => (
                  <li key={w.id}>
                    <button
                      onClick={() => switchTo(w.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[color:var(--muted)] text-left"
                    >
                      <span className="flex-1 truncate">{w.name}</span>
                      <span className="text-[10px] text-[color:var(--muted-foreground)] uppercase">{w.role}</span>
                      {w.id === activeId && <Check className="h-3 w-3 text-[color:var(--primary)]" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-[color:var(--border)] p-2">
              <div className="flex gap-1">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama workspace baru"
                  maxLength={80}
                  className="flex-1 h-8 rounded-[6px] border border-[color:var(--border)] bg-[color:var(--background)] px-2 text-xs"
                />
                <button
                  onClick={createNew}
                  disabled={creating || !newName.trim()}
                  className="h-8 px-2 rounded-[6px] bg-[color:var(--primary)] text-white text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" /> Buat
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
