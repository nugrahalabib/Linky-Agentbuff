"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Download, FileUp, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { FIELD_LABELS, type FieldKey } from "@/lib/csv-mapping";

type Conflict = "fail" | "skip" | "rename";

interface PreviewResp {
  preview: true;
  provider: string;
  delimiter: string;
  headers: string[];
  mapping: Record<FieldKey, number | null>;
  totalRows: number;
  valid: number;
  invalid: number;
  tags_to_create: string[];
  tags_to_create_count: number;
  issues: Array<{ row: number; error: string; original?: string }>;
  sample: Array<{
    slug: string;
    destination_url: string;
    title: string;
    tags: string[];
    has_password: boolean;
    expires_at: string | null;
  }>;
}

interface Folder { id: string; name: string }
interface Tag { id: string; name: string }

const FIELD_ORDER: FieldKey[] = [
  "destination_url",
  "slug",
  "title",
  "description",
  "tags",
  "expires_at",
  "click_limit",
  "password",
  "ios_url",
  "android_url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

const PROVIDER_LABELS: Record<string, string> = {
  bitly: "Bit.ly",
  rebrandly: "Rebrandly",
  tinyurl: "TinyURL",
  dubco: "Dub.co",
  shortio: "Short.io",
  linky: "Linky template",
  unknown: "Custom",
};

export function CsvImporter() {
  const router = useRouter();
  const { push } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<PreviewResp | null>(null);
  const [overrides, setOverrides] = useState<Partial<Record<FieldKey, number | null>>>({});
  const [conflict, setConflict] = useState<Conflict>("skip");
  const [defaultFolderId, setDefaultFolderId] = useState<string>("");
  const [defaultTagIds, setDefaultTagIds] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; total: number; issues: PreviewResp["issues"]; tags_created: number } | null>(null);

  useEffect(() => {
    fetch("/api/folders").then((r) => r.json()).then((d) => setFolders(d.folders ?? [])).catch(() => undefined);
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags ?? [])).catch(() => undefined);
  }, []);

  const reset = () => {
    setStep(1);
    setCsv("");
    setFileName(null);
    setPreview(null);
    setOverrides({});
    setResult(null);
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    setCsv(text);
  };

  const detect = async () => {
    if (!csv.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/links/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, commit: false, conflict }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && data.headers) {
          // Mapping needs override
          setPreview({
            preview: true,
            provider: data.provider ?? "unknown",
            delimiter: ",",
            headers: data.headers,
            mapping: data.suggested_mapping,
            totalRows: 0,
            valid: 0,
            invalid: 0,
            tags_to_create: [],
            tags_to_create_count: 0,
            issues: [],
            sample: [],
          });
          push({
            title: "Map kolom URL tujuan",
            description: data.error,
            variant: "danger",
          });
          setStep(2);
          return;
        }
        push({ title: "Gagal baca CSV", description: data.error, variant: "danger" });
        return;
      }
      setPreview(data);
      setStep(2);
    } finally {
      setParsing(false);
    }
  };

  const refreshPreview = async () => {
    if (!csv.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/links/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv,
          commit: false,
          mapping: overrides,
          conflict,
          defaultFolderId: defaultFolderId || null,
          defaultTagIds: Array.from(defaultTagIds),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Preview gagal", description: data.error, variant: "danger" });
        return;
      }
      setPreview(data);
      setStep(3);
    } finally {
      setParsing(false);
    }
  };

  const commit = async () => {
    setCommitting(true);
    try {
      const res = await fetch("/api/links/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv,
          commit: true,
          mapping: overrides,
          conflict,
          defaultFolderId: defaultFolderId || null,
          defaultTagIds: Array.from(defaultTagIds),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Import gagal", description: data.error, variant: "danger" });
        return;
      }
      setResult(data);
      push({ title: `${data.created} link diimport`, variant: "success" });
      setStep(4);
      router.refresh();
    } finally {
      setCommitting(false);
    }
  };

  const downloadErrors = async () => {
    if (!result?.issues || result.issues.length === 0) return;
    const res = await fetch("/api/links/import/error-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issues: result.issues }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linky-import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 4 && result) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
          <div>
            <h2 className="text-xl font-semibold">Import selesai</h2>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              <strong>{result.created}</strong> link dibuat dari <strong>{result.total}</strong> baris.{" "}
              {result.skipped > 0 && (
                <>
                  <strong>{result.skipped}</strong> dilewati karena error.
                </>
              )}
              {result.tags_created > 0 && (
                <>
                  {" "}
                  <strong>{result.tags_created}</strong> tag baru dibuat.
                </>
              )}
            </p>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <Button asChild variant="gradient">
              <Link href="/dashboard/links">Lihat semua link</Link>
            </Button>
            {result.issues.length > 0 && (
              <Button variant="outline" onClick={downloadErrors}>
                <Download className="h-4 w-4" />
                Unduh laporan error
              </Button>
            )}
            <Button variant="ghost" onClick={reset}>
              Import lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)] mb-2">
          <Step n={1} active={step === 1} done={step > 1} label="Upload" />
          <ArrowRight className="h-3 w-3" />
          <Step n={2} active={step === 2} done={step > 2} label="Map kolom" />
          <ArrowRight className="h-3 w-3" />
          <Step n={3} active={step === 3} done={false} label="Review & import" />
        </div>
        <CardTitle>
          {step === 1 && "Unggah file CSV"}
          {step === 2 && "Map kolom CSV ke field Linky"}
          {step === 3 && "Review hasil dan jalankan import"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Drag-drop file dari Bit.ly / Rebrandly / TinyURL / Dub.co / Short.io / template Linky."}
          {step === 2 && (
            <>
              Provider: <strong>{PROVIDER_LABELS[preview?.provider ?? "unknown"]}</strong> · Delimiter:{" "}
              <code>{preview?.delimiter === "\t" ? "TAB" : preview?.delimiter}</code> · {preview?.headers.length} kolom terdeteksi.
            </>
          )}
          {step === 3 && (
            <>
              <strong>{preview?.valid}</strong> baris valid, <strong>{preview?.invalid}</strong> ada masalah dari total{" "}
              <strong>{preview?.totalRows}</strong>.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <label className="flex flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-[color:var(--border)] px-6 py-10 cursor-pointer hover:bg-[color:var(--muted)]/50 transition-colors">
              <UploadCloud className="h-10 w-10 text-[color:var(--muted-foreground)]" />
              {fileName ? (
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  <FileUp className="inline h-4 w-4 mr-1" /> {fileName}
                </span>
              ) : (
                <>
                  <span className="text-sm font-medium">Klik untuk pilih file .csv / .tsv</span>
                  <span className="text-xs text-[color:var(--muted-foreground)]">atau drag-drop ke sini</span>
                </>
              )}
              <input
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <details className="text-sm">
              <summary className="cursor-pointer text-[color:var(--muted-foreground)]">Atau paste CSV langsung</summary>
              <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="long_url,title,tags&#10;https://example.com,Promo,marketing|launch"
                rows={6}
                className="mt-2 w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--background)] p-3 font-mono text-xs"
              />
            </details>
            <Button onClick={detect} disabled={!csv.trim() || parsing}>
              {parsing && <Loader2 className="h-4 w-4 animate-spin" />}
              Lanjut <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {step === 2 && preview && (
          <>
            <div className="rounded-[10px] border border-[color:var(--border)] overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr] text-[10px] uppercase tracking-wider font-semibold text-[color:var(--muted-foreground)] px-3 py-1.5 bg-[color:var(--muted)]/50 border-b border-[color:var(--border)]/60">
                <span>Field Linky</span>
                <span>Kolom CSV</span>
              </div>
              <div className="divide-y divide-[color:var(--border)]/60">
                {FIELD_ORDER.map((field) => {
                  const current = overrides[field] ?? preview.mapping[field] ?? null;
                  const required = field === "destination_url";
                  return (
                    <div key={field} className="grid grid-cols-[1fr_1fr] items-center px-3 py-2 gap-3">
                      <div className="text-sm">
                        {FIELD_LABELS[field]}
                        {required && <span className="text-rose-500 ml-1">*</span>}
                      </div>
                      <select
                        value={current == null ? "" : String(current)}
                        onChange={(e) =>
                          setOverrides((s) => ({
                            ...s,
                            [field]: e.target.value === "" ? null : Number(e.target.value),
                          }))
                        }
                        className="h-9 rounded-[6px] border border-[color:var(--border)] bg-[color:var(--background)] px-2 text-xs"
                      >
                        <option value="">— tidak dipakai —</option>
                        {preview.headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Slug duplikat → tindakan</Label>
                <select
                  value={conflict}
                  onChange={(e) => setConflict(e.target.value as Conflict)}
                  className="w-full h-10 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm"
                >
                  <option value="skip">Lewati (skip)</option>
                  <option value="rename">Rename otomatis (-1, -2, ...)</option>
                  <option value="fail">Gagal baris itu</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Folder default (opsional)</Label>
                <select
                  value={defaultFolderId}
                  onChange={(e) => setDefaultFolderId(e.target.value)}
                  className="w-full h-10 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm"
                >
                  <option value="">— tanpa folder —</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Tag default (opsional)</Label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {tags.length === 0 && (
                    <span className="text-xs text-[color:var(--muted-foreground)] py-2">
                      Belum ada tag.
                    </span>
                  )}
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setDefaultTagIds((s) => {
                          const next = new Set(s);
                          if (next.has(t.id)) next.delete(t.id);
                          else next.add(t.id);
                          return next;
                        });
                      }}
                      className={`text-xs rounded-full border px-2.5 py-1 ${
                        defaultTagIds.has(t.id)
                          ? "bg-[color:var(--primary)] text-white border-[color:var(--primary)]"
                          : "border-[color:var(--border)]"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button onClick={refreshPreview} disabled={parsing}>
                {parsing && <Loader2 className="h-4 w-4 animate-spin" />}
                Preview hasil <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && preview && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Total baris" value={preview.totalRows} />
              <Stat label="Siap import" value={preview.valid} tone="ok" />
              <Stat label="Bermasalah" value={preview.invalid} tone={preview.invalid > 0 ? "warn" : "neutral"} />
            </div>

            {preview.tags_to_create_count > 0 && (
              <div className="rounded-[10px] border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-3 text-xs">
                <strong>{preview.tags_to_create_count} tag baru</strong> akan dibuat:{" "}
                {preview.tags_to_create.slice(0, 10).join(", ")}
                {preview.tags_to_create_count > 10 && ` +${preview.tags_to_create_count - 10} lainnya`}
              </div>
            )}

            {preview.sample.length > 0 && (
              <div className="rounded-[10px] border border-[color:var(--border)] overflow-hidden">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-[color:var(--muted-foreground)] px-3 py-1.5 bg-[color:var(--muted)]/50 border-b border-[color:var(--border)]/60">
                  Sample 10 baris pertama
                </div>
                <div className="divide-y divide-[color:var(--border)]/60 text-xs max-h-60 overflow-y-auto">
                  {preview.sample.map((s, i) => (
                    <div key={i} className="px-3 py-2 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-[color:var(--primary)]">/{s.slug}</code>
                        <span className="text-[color:var(--muted-foreground)]">→</span>
                        <span className="truncate flex-1">{s.destination_url}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[color:var(--muted-foreground)]">
                        {s.title && <span>"{s.title}"</span>}
                        {s.tags.length > 0 && <span>tags: {s.tags.join(", ")}</span>}
                        {s.has_password && <span>🔒</span>}
                        {s.expires_at && <span>exp: {new Date(s.expires_at).toLocaleDateString("id-ID")}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview.issues.length > 0 && (
              <details className="rounded-[10px] border border-amber-500/30 bg-amber-500/5 p-3">
                <summary className="cursor-pointer text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">{preview.invalid} baris bermasalah</span>
                  <span className="text-[color:var(--muted-foreground)]">(lihat detail)</span>
                </summary>
                <ul className="mt-2 space-y-1 text-xs text-[color:var(--muted-foreground)] max-h-48 overflow-y-auto">
                  {preview.issues.map((s, i) => (
                    <li key={i}>
                      <strong>Baris {s.row}:</strong> {s.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Button>
              <Button variant="gradient" onClick={commit} disabled={committing || preview.valid === 0}>
                {committing && <Loader2 className="h-4 w-4 animate-spin" />}
                Import {preview.valid} link sekarang
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Step({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${active ? "text-[color:var(--foreground)] font-medium" : ""}`}>
      <span
        className={`h-5 w-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
          done
            ? "bg-emerald-500 text-white"
            : active
            ? "bg-[color:var(--primary)] text-white"
            : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]"
        }`}
      >
        {done ? "✓" : n}
      </span>
      {label}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" | "neutral" }) {
  const color =
    tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "";
  return (
    <div className="rounded-[10px] border border-[color:var(--border)] p-3">
      <div className="text-[11px] text-[color:var(--muted-foreground)]">{label}</div>
      <div className={`mt-0.5 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
