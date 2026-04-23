"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function NewLinkyPageButton() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/linky-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      push({ title: "Page dibuat!", variant: "success" });
      router.push(`/dashboard/pages/${data.page.id}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="gradient">
        <Plus className="h-4 w-4" /> Page baru
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-[16px] bg-[color:var(--card)] border border-[color:var(--border)] p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Buat Linky Page baru</h2>
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label>Username (slug)</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="nugra"
              maxLength={30}
            />
          </div>
          <div className="space-y-1">
            <Label>Judul</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nugraha Labib Mujaddid" maxLength={80} />
          </div>
          <div className="space-y-1">
            <Label>Bio (opsional)</Label>
            <Input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} placeholder="Creator · Developer · Founder" />
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={create} disabled={loading || !slug || !title}>
            {loading ? "Membuat..." : "Buat"}
          </Button>
        </div>
      </div>
    </div>
  );
}
