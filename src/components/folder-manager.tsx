"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Plus, Trash2 } from "lucide-react";
import type { Folder as DbFolder } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#94A3B8"];

export function FolderManager({ initial }: { initial: DbFolder[] }) {
  const router = useRouter();
  const { push } = useToast();
  const [folders, setFolders] = useState<DbFolder[]>(initial);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [color, setColor] = useState("#4F46E5");
  const [loading, setLoading] = useState(false);

  const topLevel = useMemo(() => folders.filter((f) => !f.parentId), [folders]);
  const childrenOf = (id: string) => folders.filter((f) => f.parentId === id);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: parentId || null, color }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      setFolders((f) => [...f, data.folder]);
      setName("");
      push({ title: "Folder dibuat", variant: "success" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus folder ini? Link di dalamnya akan dipindah ke root.")) return;
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFolders((f) => f.filter((x) => x.id !== id && x.parentId !== id));
      push({ title: "Folder dihapus", variant: "success" });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={create} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="fname">Nama folder</Label>
                <Input id="fname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Kampanye Ramadan" />
              </div>
              <div className="space-y-1.5">
                <Label>Warna</Label>
                <div className="flex gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Pilih warna ${c}`}
                      className={`h-8 w-8 rounded-md border-2 ${color === c ? "border-[color:var(--foreground)]" : "border-transparent"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parent">Di dalam folder (opsional)</Label>
              <select
                id="parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="h-10 w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm"
              >
                <option value="">— Root —</option>
                {topLevel.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={loading || !name.trim()}>
              <Plus className="h-4 w-4" /> Buat folder
            </Button>
          </form>
        </CardContent>
      </Card>

      {topLevel.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-[color:var(--muted-foreground)]">
            Belum ada folder.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topLevel.map((f) => (
            <FolderRow key={f.id} f={f} onDelete={remove} kids={childrenOf(f.id)} level={0} />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderRow({
  f,
  onDelete,
  kids,
  level,
}: {
  f: DbFolder;
  onDelete: (id: string) => void;
  kids: DbFolder[];
  level: number;
}) {
  return (
    <div style={{ marginLeft: level * 24 }}>
      <Card className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Folder className="h-5 w-5" style={{ color: f.color }} />
          <span className="font-medium">{f.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(f.id)} aria-label="Hapus folder">
          <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
        </Button>
      </Card>
      {kids.map((c) => (
        <FolderRow key={c.id} f={c} onDelete={onDelete} kids={[]} level={level + 1} />
      ))}
    </div>
  );
}
