"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Copy, QrCode, Check, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function ShortenForm({ appUrl }: { appUrl: string }) {
  const [destination, setDestination] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ shortUrl: string; slug: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { push } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationUrl: destination, customSlug: customSlug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error ?? "Coba lagi.", variant: "danger" });
        return;
      }
      setResult({ shortUrl: `${appUrl}/${data.slug}`, slug: data.slug, id: data.id });
      push({ title: "Link siap!", description: "Sudah bisa langsung disalin.", variant: "success" });
    } catch {
      push({ title: "Kesalahan jaringan", description: "Periksa koneksi internetmu.", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      push({ title: "Tersalin!", variant: "success" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      push({ title: "Tidak bisa menyalin otomatis", description: "Salin manual dari kotak link.", variant: "danger" });
    }
  };

  const reset = () => {
    setResult(null);
    setDestination("");
    setCustomSlug("");
    setCopied(false);
  };

  if (result) {
    return (
      <div className="w-full animate-in">
        <div className="rounded-[16px] border-2 border-[color:var(--primary)]/30 bg-[color:var(--card)] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--primary)] mb-3">
            <Sparkles className="h-4 w-4" />
            Link siap — tinggal salin!
          </div>
          <div className="flex items-center gap-2 rounded-[12px] bg-[color:var(--muted)] px-4 py-3">
            <code className="flex-1 font-mono text-sm text-[color:var(--foreground)] truncate">{result.shortUrl}</code>
            <Button type="button" onClick={copyLink} size="sm" variant={copied ? "secondary" : "primary"}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Tersalin" : "Salin"}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/qr?slug=${result.slug}`}>
                <QrCode className="h-4 w-4" />
                Buat QR
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/signup">
                Simpan di akun
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button onClick={reset} variant="ghost" size="sm" type="button">
              Bikin lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="url"
          required
          autoFocus
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Tempel URL panjangmu di sini — contoh: https://tokopedia.com/produk/..."
          className="h-12 text-base flex-1"
          aria-label="URL tujuan"
        />
        <Button type="submit" size="lg" disabled={loading || !destination} className="sm:w-auto w-full h-12">
          {loading ? "Memproses..." : "Pendekkan"}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-[color:var(--primary)] hover:underline"
        >
          {showAdvanced ? "Sembunyikan" : "Slug custom"}
        </button>
        <span className="text-[color:var(--muted-foreground)]">Gratis, tanpa daftar.</span>
      </div>
      {showAdvanced && (
        <div className="flex items-center gap-2 rounded-[12px] bg-[color:var(--muted)] px-4 py-3 animate-in">
          <span className="font-mono text-sm text-[color:var(--muted-foreground)]">
            {new URL(appUrl).host}/
          </span>
          <Input
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
            placeholder="slug-kustom"
            className="h-9 bg-transparent border-0 focus-visible:ring-0 px-0 font-mono"
            maxLength={50}
            aria-label="Custom slug"
          />
        </div>
      )}
    </form>
  );
}
