"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Preview = {
  preview: boolean;
  totalRows: number;
  valid: number;
  invalid: number;
  issues: Array<{ row: number; error: string }>;
  sample: Array<{ slug: string; destination_url: string; title: string }>;
};

export function CsvImporter() {
  const router = useRouter();
  const { push } = useToast();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [committed, setCommitted] = useState<{ created: number; skipped: number } | null>(null);

  const onFile = async (f: File | null) => {
    if (!f) return;
    const text = await f.text();
    setCsv(text);
    setPreview(null);
    setCommitted(null);
  };

  const doPreview = async () => {
    if (!csv.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/links/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, commit: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Preview gagal", description: data.error, variant: "danger" });
        return;
      }
      setPreview(data);
    } finally {
      setLoading(false);
    }
  };

  const doCommit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/links/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, commit: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Import gagal", description: data.error, variant: "danger" });
        return;
      }
      setCommitted({ created: data.created, skipped: data.skipped });
      push({ title: `Berhasil import ${data.created} link`, variant: "success" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (committed) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 mx-auto text-[color:var(--success)]" />
          <div>
            <h2 className="text-xl font-semibold">Import selesai</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              {committed.created} link dibuat, {committed.skipped} dilewati.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/links">Lihat semua link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unggah file CSV</CardTitle>
        <CardDescription>Pilih file dari komputermu, atau paste CSV langsung di bawah.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[color:var(--border)] px-6 py-12 cursor-pointer hover:bg-[color:var(--muted)]/50 transition-colors">
          <UploadCloud className="h-10 w-10 text-[color:var(--muted-foreground)]" />
          <span className="text-sm font-medium">Klik untuk pilih file .csv</span>
          <span className="text-xs text-[color:var(--muted-foreground)]">atau drag-drop file ke sini</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="destination_url,slug,title&#10;https://example.com,promo,Promo spesial"
          rows={8}
          className="w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--background)] p-3 font-mono text-xs"
        />

        {preview && (
          <div className="rounded-[10px] border border-[color:var(--border)] p-4 space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--success)]" />
                {preview.valid} valid
              </span>
              {preview.invalid > 0 && (
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-[color:var(--warning)]" />
                  {preview.invalid} ada masalah
                </span>
              )}
              <span className="text-[color:var(--muted-foreground)]">dari {preview.totalRows} baris</span>
            </div>
            {preview.sample.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-[color:var(--muted-foreground)]">Preview 10 baris pertama</summary>
                <ul className="mt-2 space-y-1">
                  {preview.sample.map((s, i) => (
                    <li key={i} className="truncate">
                      <code className="font-mono">/{s.slug}</code> → {s.destination_url}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            {preview.issues.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-[color:var(--warning)]">Lihat masalah ({preview.issues.length})</summary>
                <ul className="mt-2 space-y-1 text-xs text-[color:var(--muted-foreground)]">
                  {preview.issues.map((s, i) => (
                    <li key={i}>Baris {s.row}: {s.error}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={doPreview} disabled={loading || !csv.trim()}>
            Preview dulu
          </Button>
          <Button variant="gradient" onClick={doCommit} disabled={loading || !preview || preview.valid === 0}>
            Import {preview?.valid ?? 0} link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
