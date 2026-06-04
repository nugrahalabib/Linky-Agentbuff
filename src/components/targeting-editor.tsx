"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Globe, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Variant {
  url: string;
  weight: number;
  label?: string;
}
interface GeoRule {
  country: string;
  url: string;
}
interface AbStat {
  label: string;
  url: string;
  weight: number;
  clicks: number;
  share: number;
}

export function TargetingEditor({
  linkId,
  destinationUrl,
  initialVariants,
  initialGeoRules,
}: {
  linkId: string;
  destinationUrl: string;
  initialVariants: Variant[];
  initialGeoRules: GeoRule[];
}) {
  const { push } = useToast();

  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [savingAb, setSavingAb] = useState(false);
  const [stats, setStats] = useState<{ variants: AbStat[]; total: number } | null>(null);

  const [rules, setRules] = useState<GeoRule[]>(initialGeoRules);
  const [savingGeo, setSavingGeo] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/links/${linkId}/ab-stats`);
      if (res.ok) setStats(await res.json());
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- A/B ----------
  const addVariant = () => {
    if (variants.length >= 4) return;
    setVariants([...variants, { url: destinationUrl, weight: 50, label: "" }]);
  };
  const updateVariant = (i: number, patch: Partial<Variant>) => {
    setVariants(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));

  const saveAb = async () => {
    if (variants.length === 0) return;
    setSavingAb(true);
    try {
      const res = await fetch(`/api/links/${linkId}/targeting`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "ab",
          variants: variants.map((v) => ({
            url: v.url.trim(),
            weight: Number(v.weight) || 1,
            label: v.label?.trim() || undefined,
          })),
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        push({ title: "Gagal simpan A/B", description: d.error, variant: "danger" });
        return;
      }
      push({ title: "A/B test disimpan", description: "Trafik dibagi sesuai bobot.", variant: "success" });
      loadStats();
    } finally {
      setSavingAb(false);
    }
  };

  const clearAb = async () => {
    if (!window.confirm("Matikan A/B test untuk link ini? Semua trafik kembali ke URL utama.")) return;
    const res = await fetch(`/api/links/${linkId}/targeting`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "clear", type: "ab" }),
    });
    if (res.ok) {
      setVariants([]);
      setStats({ variants: [], total: 0 });
      push({ title: "A/B test dimatikan", variant: "success" });
    }
  };

  const totalWeight = variants.reduce((s, v) => s + (Number(v.weight) || 0), 0);

  // ---------- Geo ----------
  const addRule = () => {
    if (rules.length >= 20) return;
    setRules([...rules, { country: "", url: destinationUrl }]);
  };
  const updateRule = (i: number, patch: Partial<GeoRule>) => {
    setRules(rules.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));

  const saveGeo = async () => {
    const cleaned = rules
      .map((r) => ({ country: r.country.trim().toUpperCase(), url: r.url.trim() }))
      .filter((r) => r.country.length === 2 && r.url);
    if (cleaned.length !== rules.length) {
      push({ title: "Periksa lagi", description: "Tiap aturan butuh kode negara 2 huruf + URL valid.", variant: "danger" });
      return;
    }
    setSavingGeo(true);
    try {
      const res = await fetch(`/api/links/${linkId}/targeting`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "geo", rules: cleaned }),
      });
      const d = await res.json();
      if (!res.ok) {
        push({ title: "Gagal simpan geo", description: d.error, variant: "danger" });
        return;
      }
      push({ title: "Aturan geo disimpan", variant: "success" });
    } finally {
      setSavingGeo(false);
    }
  };

  const clearGeo = async () => {
    if (!window.confirm("Hapus semua aturan geo untuk link ini?")) return;
    const res = await fetch(`/api/links/${linkId}/targeting`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "clear", type: "geo" }),
    });
    if (res.ok) {
      setRules([]);
      push({ title: "Aturan geo dihapus", variant: "success" });
    }
  };

  return (
    <div className="space-y-6">
      {/* A/B testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-[color:var(--primary)]" /> A/B Testing (Linky Split)
          </CardTitle>
          <CardDescription>
            Bagi trafik ke beberapa URL berdasarkan bobot. Pengunjung yang sama selalu dapat varian yang sama
            (sticky per-IP). Maks 4 varian. Catatan: kalau A/B aktif, aturan geo & deep-link diabaikan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.length === 0 ? (
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Belum ada varian. Tambah minimal 2 untuk mulai membagi trafik.
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="rounded-[10px] border border-[color:var(--border)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[color:var(--muted-foreground)]">
                      {v.label?.trim() || `variant-${i + 1}`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeVariant(i)} aria-label="Hapus varian">
                      <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_90px_140px]">
                    <Input
                      value={v.url}
                      onChange={(e) => updateVariant(i, { url: e.target.value })}
                      placeholder="https://tujuan-varian.com"
                    />
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={v.weight}
                      onChange={(e) => updateVariant(i, { weight: Number(e.target.value) })}
                      placeholder="bobot"
                      aria-label="Bobot"
                    />
                    <Input
                      value={v.label ?? ""}
                      onChange={(e) => updateVariant(i, { label: e.target.value })}
                      placeholder="label (opsional)"
                      maxLength={40}
                    />
                  </div>
                  {totalWeight > 0 && (
                    <p className="text-[11px] text-[color:var(--muted-foreground)]">
                      ≈ {Math.round(((Number(v.weight) || 0) / totalWeight) * 100)}% trafik
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={addVariant} disabled={variants.length >= 4}>
              <Plus className="h-4 w-4" /> Tambah varian
            </Button>
            <Button size="sm" onClick={saveAb} disabled={savingAb || variants.length === 0}>
              {savingAb ? "Menyimpan..." : "Simpan A/B"}
            </Button>
            {variants.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAb}>
                Matikan A/B
              </Button>
            )}
          </div>

          {stats && stats.variants.length > 0 && (
            <div className="mt-2 rounded-[10px] border border-[color:var(--border)] overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] bg-[color:var(--muted)]/40">
                Hasil ({stats.total.toLocaleString("id-ID")} klik non-bot)
              </div>
              <div className="divide-y divide-[color:var(--border)]/60">
                {stats.variants.map((s) => (
                  <div key={s.label} className="flex items-center gap-3 p-3 text-sm">
                    <span className="font-mono text-xs w-24 shrink-0">{s.label}</span>
                    <div className="flex-1 min-w-0">
                      <div className="h-2 rounded-full bg-[color:var(--muted)] overflow-hidden">
                        <div className="h-full bg-[color:var(--primary)]" style={{ width: `${s.share}%` }} />
                      </div>
                    </div>
                    <span className="tabular-nums text-xs w-28 text-right shrink-0">
                      {s.clicks.toLocaleString("id-ID")} · {s.share}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geo targeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[color:var(--primary)]" /> Geo Targeting
          </CardTitle>
          <CardDescription>
            Arahkan pengunjung ke URL berbeda berdasarkan negara (kode ISO 2 huruf, mis. ID, US, SG). Negara yang
            tidak cocok dapat URL utama. Maks 20 aturan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.length === 0 ? (
            <p className="text-sm text-[color:var(--muted-foreground)]">Belum ada aturan geo.</p>
          ) : (
            <div className="space-y-2">
              {rules.map((r, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[90px_1fr_40px] items-center">
                  <Input
                    value={r.country}
                    onChange={(e) => updateRule(i, { country: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="ID"
                    maxLength={2}
                    aria-label="Kode negara"
                    className="uppercase"
                  />
                  <Input
                    value={r.url}
                    onChange={(e) => updateRule(i, { url: e.target.value })}
                    placeholder="https://tujuan-untuk-negara-ini.com"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeRule(i)} aria-label="Hapus aturan">
                    <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={addRule} disabled={rules.length >= 20}>
              <Plus className="h-4 w-4" /> Tambah aturan
            </Button>
            <Button size="sm" onClick={saveGeo} disabled={savingGeo || rules.length === 0}>
              {savingGeo ? "Menyimpan..." : "Simpan geo"}
            </Button>
            {rules.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearGeo}>
                Hapus semua
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
