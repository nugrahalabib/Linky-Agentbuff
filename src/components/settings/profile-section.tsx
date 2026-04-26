"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Props {
  email: string;
  name: string | null;
  locale: string;
}

export function ProfileSection({ email, name: initialName, locale: initialLocale }: Props) {
  const { push } = useToast();
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [locale, setLocale] = useState(initialLocale);
  const [saving, setSaving] = useState(false);
  const dirty = (name ?? "") !== (initialName ?? "") || locale !== initialLocale;

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      push({ title: "Profil tersimpan", variant: "success" });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Informasi dasar yang muncul di akunmu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} readOnly className="bg-[color:var(--muted)]/40" />
          <p className="text-[11px] text-[color:var(--muted-foreground)]">
            Email login kamu — tidak bisa diubah dari sini.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nama</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Misal: Budi Santoso"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="locale">Bahasa</Label>
          <select
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full h-10 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? "Menyimpan..." : "Simpan perubahan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
