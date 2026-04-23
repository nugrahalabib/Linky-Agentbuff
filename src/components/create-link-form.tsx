"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function CreateLinkForm({
  appUrl,
  initial,
  editId,
}: {
  appUrl: string;
  initial?: Record<string, unknown>;
  editId?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(editId);
  const [destinationUrl, setDestinationUrl] = useState<string>(String(initial?.destinationUrl ?? ""));
  const [customSlug, setCustomSlug] = useState<string>(String(initial?.slug ?? ""));
  const [title, setTitle] = useState<string>(String(initial?.title ?? ""));
  const [description, setDescription] = useState<string>(String(initial?.description ?? ""));
  const [password, setPassword] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>(
    initial?.expiresAt ? new Date(initial.expiresAt as number).toISOString().slice(0, 16) : "",
  );
  const [clickLimit, setClickLimit] = useState<string>(
    initial?.clickLimit != null ? String(initial.clickLimit) : "",
  );
  const [iosUrl, setIosUrl] = useState<string>(String(initial?.iosUrl ?? ""));
  const [androidUrl, setAndroidUrl] = useState<string>(String(initial?.androidUrl ?? ""));
  const utm = (initial?.utmParams ?? {}) as Record<string, string>;
  const [utmSource, setUtmSource] = useState(utm.utm_source ?? "");
  const [utmMedium, setUtmMedium] = useState(utm.utm_medium ?? "");
  const [utmCampaign, setUtmCampaign] = useState(utm.utm_campaign ?? "");

  const [openAdvanced, setOpenAdvanced] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setOpenAdvanced((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        destinationUrl,
        customSlug: customSlug || undefined,
        title: title || undefined,
        description: description || undefined,
        password: password || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "",
        clickLimit: clickLimit ? Number(clickLimit) : "",
        iosUrl: iosUrl || "",
        androidUrl: androidUrl || "",
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
      };
      const url = isEdit ? `/api/links/${editId}` : "/api/links";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal menyimpan", description: data.error ?? "Coba lagi.", variant: "danger" });
        return;
      }
      push({ title: isEdit ? "Tersimpan!" : "Link dibuat!", variant: "success" });
      const id = data.link?.id ?? editId;
      if (id) router.replace(`/dashboard/links/${id}`);
      router.refresh();
    } catch {
      push({ title: "Kesalahan jaringan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="destination">URL tujuan <span className="text-red-500">*</span></Label>
            <Input
              id="destination"
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://contoh.com/halaman-panjang"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug custom (opsional)</Label>
            <div className="flex items-center gap-2 rounded-[10px] border border-[color:var(--border)] px-3 bg-[color:var(--background)]">
              <span className="text-sm text-[color:var(--muted-foreground)] font-mono">
                {new URL(appUrl).host}/
              </span>
              <Input
                id="slug"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="slug-kustom"
                maxLength={50}
                disabled={isEdit}
                className="border-0 bg-transparent focus-visible:ring-0 px-0 font-mono"
              />
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Kosongkan untuk slug acak. {isEdit && "Slug tidak bisa diubah setelah dibuat."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul (opsional)</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
          </div>
        </CardContent>
      </Card>

      <AdvancedSection
        label="Keamanan & batas"
        open={openAdvanced.has("security")}
        onToggle={() => toggle("security")}
      >
        <div className="space-y-1.5">
          <Label htmlFor="password">Kata sandi (opsional)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "Biarkan kosong = tidak diubah" : "Minimal 4 karakter"}
            minLength={isEdit ? 0 : 4}
          />
          <p className="text-xs text-[color:var(--muted-foreground)]">
            Pengunjung harus mengetik kata sandi sebelum redirect.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">Kedaluwarsa (opsional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clickLimit">Batas klik (opsional)</Label>
            <Input
              id="clickLimit"
              type="number"
              min={1}
              value={clickLimit}
              onChange={(e) => setClickLimit(e.target.value)}
              placeholder="misal: 1000"
            />
          </div>
        </div>
      </AdvancedSection>

      <AdvancedSection
        label="Deep link aplikasi"
        open={openAdvanced.has("deep")}
        onToggle={() => toggle("deep")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="iosUrl">iOS URL</Label>
            <Input
              id="iosUrl"
              type="url"
              value={iosUrl}
              onChange={(e) => setIosUrl(e.target.value)}
              placeholder="https://apps.apple.com/..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="androidUrl">Android URL</Label>
            <Input
              id="androidUrl"
              type="url"
              value={androidUrl}
              onChange={(e) => setAndroidUrl(e.target.value)}
              placeholder="https://play.google.com/..."
            />
          </div>
        </div>
        <p className="text-xs text-[color:var(--muted-foreground)]">
          Pengunjung iOS/Android akan diarahkan ke URL ini; lainnya ke URL tujuan utama.
        </p>
      </AdvancedSection>

      <AdvancedSection
        label="UTM parameters"
        open={openAdvanced.has("utm")}
        onToggle={() => toggle("utm")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="utmSource">Source</Label>
            <Input id="utmSource" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="facebook" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utmMedium">Medium</Label>
            <Input id="utmMedium" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="cpc" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utmCampaign">Campaign</Label>
            <Input id="utmCampaign" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="ramadan2026" />
          </div>
        </div>
      </AdvancedSection>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading || !destinationUrl}>
          <Save className="h-4 w-4" />
          {loading ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Buat link"}
        </Button>
      </div>
    </form>
  );
}

function AdvancedSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left font-medium text-sm hover:bg-[color:var(--muted)]/50 rounded-t-[16px]"
      >
        <span>{label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-[color:var(--border)] pt-4">{children}</div>}
    </Card>
  );
}
