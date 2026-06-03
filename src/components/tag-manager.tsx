"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import type { Tag } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#64748B"];

export function TagManager({ initial }: { initial: Tag[] }) {
  const { push } = useToast();
  const [list, setList] = useState<Tag[]>(initial);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4F46E5");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; color: string } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      setList((prev) => [...prev, data.tag]);
      setName("");
      push({ title: "Tag dibuat", variant: "success" });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus tag ini? Akan dilepas dari semua link.")) return;
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) => prev.filter((t) => t.id !== id));
      push({ title: "Tag dihapus", variant: "success" });
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || savingEdit || !editing.name.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/tags/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editing.name.trim(), color: editing.color }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      setList((prev) => prev.map((t) => (t.id === data.tag.id ? data.tag : t)));
      setEditing(null);
      push({ title: "Tag diperbarui", variant: "success" });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tname">Nama tag</Label>
              <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="ramadan" />
            </div>
            <div className="space-y-1.5">
              <Label>Warna</Label>
              <div className="flex gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 ${color === c ? "border-[color:var(--foreground)]" : "border-transparent"}`}
                    style={{ background: c }}
                    aria-label={`Pilih warna ${c}`}
                  />
                ))}
              </div>
            </div>
            <Button type="submit" disabled={loading || !name.trim()}>
              <Plus className="h-4 w-4" /> Buat tag
            </Button>
          </form>
        </CardContent>
      </Card>

      {editing && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={saveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tedit">Ubah tag</Label>
                <Input
                  id="tedit"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  maxLength={40}
                  placeholder="nama tag"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Warna</Label>
                <div className="flex gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditing({ ...editing, color: c })}
                      className={`h-8 w-8 rounded-full border-2 ${editing.color === c ? "border-[color:var(--foreground)]" : "border-transparent"}`}
                      style={{ background: c }}
                      aria-label={`Pilih warna ${c}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={savingEdit || !editing.name.trim()}>
                  Simpan
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--muted-foreground)]">
            Belum ada tag.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {list.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{ background: t.color }}
                >
                  {t.name}
                  <button
                    onClick={() => setEditing({ id: t.id, name: t.name, color: t.color })}
                    aria-label={`Edit ${t.name}`}
                    className="ml-1 hover:opacity-75"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove(t.id)} aria-label={`Hapus ${t.name}`} className="hover:opacity-75">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
