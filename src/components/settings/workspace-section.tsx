"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Props {
  initialName: string;
  initialSlug: string;
  domain: string;
  createdAt: number | string | Date;
}

function formatDate(ts: number | string | Date): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { dateStyle: "medium" });
}

export function WorkspaceSection({ initialName, initialSlug, domain, createdAt }: Props) {
  const { push } = useToast();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [saving, setSaving] = useState(false);
  const dirty = name !== initialName || slug !== initialSlug;

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (name !== initialName) body.name = name;
      if (slug !== initialSlug) body.slug = slug;
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      push({ title: "Workspace tersimpan", variant: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>Ruang kerja untuk semua link kamu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="wsname">Nama workspace</Label>
          <Input id="wsname" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wsslug">Slug workspace</Label>
          <Input
            id="wsslug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            maxLength={40}
          />
          <p className="text-[11px] text-[color:var(--muted-foreground)]">
            Identifier internal — huruf kecil, angka, tanda minus.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Domain produksi</Label>
            <Input value={domain} readOnly className="bg-[color:var(--muted)]/40" />
          </div>
          <div className="space-y-1.5">
            <Label>Dibuat</Label>
            <Input value={formatDate(createdAt)} readOnly className="bg-[color:var(--muted)]/40" />
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={!dirty || saving || !name.trim() || slug.length < 3}>
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
