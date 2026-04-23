"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Check, Search, Trash2 } from "lucide-react";
import type { Folder, Link as DbLink, Tag } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkListItem } from "@/components/link-list-item";
import { useToast } from "@/components/ui/toast";

export function LinksBrowser({
  initialLinks,
  folders,
  tags,
  appUrl,
}: {
  initialLinks: DbLink[];
  folders: Folder[];
  tags: Tag[];
  appUrl: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<DbLink[]>(initialLinks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (folderId) params.set("folder", folderId);
      if (selectedTagIds.size > 0) params.set("tags", [...selectedTagIds].join(","));
      const res = await fetch(`/api/links?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setRows(data.links);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(refetch, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, folderId, selectedTagIds]);

  const toggleTag = (id: string) => {
    const next = new Set(selectedTagIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTagIds(next);
  };

  const toggleSel = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const clearSel = () => setSelected(new Set());
  const selectAll = () => setSelected(new Set(rows.map((r) => r.id)));

  const bulk = async (action: "archive" | "delete" | "move_folder", opts?: { folderId?: string }) => {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm(`Hapus ${selected.size} link secara permanen?`)) return;
    const res = await fetch("/api/links/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action, folderId: opts?.folderId }),
    });
    if (res.ok) {
      push({ title: `${selected.size} link diproses`, variant: "success" });
      clearSel();
      await refetch();
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <Input
              placeholder="Cari slug, URL, atau judul..."
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari link"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="h-9 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm"
              aria-label="Filter folder"
            >
              <option value="">Semua folder</option>
              <option value="_null">Tanpa folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border transition-colors"
                style={{
                  background: selectedTagIds.has(t.id) ? t.color : "transparent",
                  borderColor: t.color,
                  color: selectedTagIds.has(t.id) ? "#fff" : t.color,
                }}
              >
                {t.name}
              </button>
            ))}
            {(q || folderId || selectedTagIds.size > 0) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQ("");
                  setFolderId("");
                  setSelectedTagIds(new Set());
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selected.size > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{selected.size} dipilih</span>
              <Button size="sm" variant="outline" onClick={() => bulk("archive")}>
                <Archive className="h-3 w-3" /> Arsipkan
              </Button>
              <select
                onChange={(e) => e.target.value && bulk("move_folder", { folderId: e.target.value })}
                defaultValue=""
                className="h-8 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-2 text-xs"
              >
                <option value="" disabled>Pindah ke folder...</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <Button size="sm" variant="danger" onClick={() => bulk("delete")}>
                <Trash2 className="h-3 w-3" /> Hapus
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSel}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-[color:var(--muted-foreground)]">
              {loading ? "Memuat..." : "Tidak ada link yang cocok."}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs text-[color:var(--muted-foreground)]">
                <button onClick={selected.size === rows.length ? clearSel : selectAll} className="hover:underline">
                  {selected.size === rows.length ? "Batalkan semua" : "Pilih semua"}
                </button>
                <span>{rows.length} link</span>
              </div>
              <ul className="flex flex-col divide-y divide-[color:var(--border)]">
                {rows.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 py-1">
                    <button
                      onClick={() => toggleSel(l.id)}
                      className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selected.has(l.id)
                          ? "bg-[color:var(--primary)] border-[color:var(--primary)]"
                          : "border-[color:var(--border)]"
                      }`}
                      aria-label={`Pilih ${l.slug}`}
                    >
                      {selected.has(l.id) && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <LinkListItem link={l} appUrl={appUrl} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
