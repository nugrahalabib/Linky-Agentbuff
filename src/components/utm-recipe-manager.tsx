"use client";

import { useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import type { UtmRecipe } from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const PRESETS = [
  { name: "Facebook Ads", utm_source: "facebook", utm_medium: "cpc" },
  { name: "Google Ads", utm_source: "google", utm_medium: "cpc" },
  { name: "TikTok Ads", utm_source: "tiktok", utm_medium: "cpc" },
  { name: "Instagram Story", utm_source: "instagram", utm_medium: "social" },
  { name: "Newsletter", utm_source: "newsletter", utm_medium: "email" },
  { name: "Twitter", utm_source: "twitter", utm_medium: "social" },
];

export function UtmRecipeManager({ initial }: { initial: UtmRecipe[] }) {
  const { push } = useToast();
  const [list, setList] = useState<UtmRecipe[]>(initial);
  const [form, setForm] = useState({
    name: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
  });
  const [loading, setLoading] = useState(false);

  const fill = (p: (typeof PRESETS)[number]) => {
    setForm((f) => ({ ...f, name: p.name, utmSource: p.utm_source, utmMedium: p.utm_medium }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/utm-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      setList((prev) => [...prev, data.recipe]);
      setForm({ name: "", utmSource: "", utmMedium: "", utmCampaign: "", utmTerm: "", utmContent: "" });
      push({ title: "Recipe disimpan", variant: "success" });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus recipe ini?")) return;
    const res = await fetch(`/api/utm-recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) => prev.filter((r) => r.id !== id));
      push({ title: "Recipe dihapus", variant: "success" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recipe baru</CardTitle>
          <CardDescription>Klik preset untuk isi otomatis, atau buat kustom.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESETS.map((p) => (
              <Button key={p.name} type="button" variant="outline" size="sm" onClick={() => fill(p)}>
                <Zap className="h-3 w-3" /> {p.name}
              </Button>
            ))}
          </div>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rname">Nama recipe <span className="text-red-500">*</span></Label>
              <Input id="rname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rsource">Source</Label>
                <Input id="rsource" value={form.utmSource} onChange={(e) => setForm({ ...form, utmSource: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rmedium">Medium</Label>
                <Input id="rmedium" value={form.utmMedium} onChange={(e) => setForm({ ...form, utmMedium: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rcamp">Campaign</Label>
                <Input id="rcamp" value={form.utmCampaign} onChange={(e) => setForm({ ...form, utmCampaign: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rterm">Term</Label>
                <Input id="rterm" value={form.utmTerm} onChange={(e) => setForm({ ...form, utmTerm: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rcontent">Content</Label>
                <Input id="rcontent" value={form.utmContent} onChange={(e) => setForm({ ...form, utmContent: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={loading || !form.name.trim()}>
              <Plus className="h-4 w-4" /> Simpan recipe
            </Button>
          </form>
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--muted-foreground)]">
            Belum ada recipe.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold">{r.name}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted-foreground)] font-mono truncate">
                      {[r.utmSource && `src=${r.utmSource}`, r.utmMedium && `med=${r.utmMedium}`, r.utmCampaign && `cmp=${r.utmCampaign}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
