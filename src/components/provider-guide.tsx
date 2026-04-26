"use client";

import { useState } from "react";
import { ChevronDown, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROVIDERS: Array<{
  id: string;
  name: string;
  steps: string[];
  sampleHeader: string;
  sampleRow: string;
  externalDocs?: string;
}> = [
  {
    id: "bitly",
    name: "Bit.ly",
    steps: [
      "Buka bit.ly/links → klik tombol Export di kanan atas (perlu akun Free+).",
      "Pilih period dan klik Export. Bit.ly kirim email link download CSV.",
      "Unduh file → upload di sini. Linky auto-detect kolom long_url, title, dan tags.",
    ],
    sampleHeader: "id,title,long_url,created_at,link,archived,tags,custom_bitlinks,deeplinks",
    sampleRow: "1abc,Promo April,https://example.com/landing,2026-04-01T10:00:00+0000,https://bit.ly/promo-april,false,marketing|launch,,",
    externalDocs: "https://support.bitly.com/hc/en-us/articles/360054925152-Exporting-data",
  },
  {
    id: "rebrandly",
    name: "Rebrandly",
    steps: [
      "Buka app.rebrandly.com → Workspace settings → Export data.",
      "Pilih Links → Export CSV.",
      "Upload di sini. Linky map slashtag → slug, destination → URL tujuan, tags otomatis.",
    ],
    sampleHeader: "title,destination,short_url,slashtag,domain,created,clicks,tags",
    sampleRow: "Promo April,https://example.com/landing,rebrand.ly/promo,promo,rebrand.ly,2026-04-01,42,marketing",
  },
  {
    id: "tinyurl",
    name: "TinyURL",
    steps: [
      "Login → Dashboard → My TinyURLs.",
      "Pilih semua → Export to CSV.",
      "Upload di sini. Map originalurl → URL tujuan, path → slug.",
    ],
    sampleHeader: "OriginalURL,ShortURL,Path,Title,Created,Clicks",
    sampleRow: "https://example.com/landing,https://tinyurl.com/promo-x,promo-x,Promo April,2026-04-01,42",
  },
  {
    id: "dubco",
    name: "Dub.co",
    steps: [
      "Buka app.dub.co/<workspace>/links → menu titik tiga → Export.",
      "Pilih CSV format.",
      "Upload di sini. Map url → URL tujuan, key → slug, dan field Dub lainnya.",
    ],
    sampleHeader: "Link ID,Domain,Key,URL,Title,Description,Archived,Expires At,Password,Clicks,Created At",
    sampleRow: "lnk_xxx,dub.sh,promo,https://example.com/landing,Promo April,,false,,,42,2026-04-01",
  },
  {
    id: "shortio",
    name: "Short.io",
    steps: [
      "Buka app.short.io → Domain → Links → Export → CSV.",
      "Pilih All time atau date range.",
      "Upload di sini. Map originalurl → URL tujuan, path → slug.",
    ],
    sampleHeader: "OriginalURL,ShortURL,Path,Title,Tags,CreatedAt",
    sampleRow: "https://example.com/landing,https://short.io/promo,promo,Promo April,marketing|launch,2026-04-01",
  },
  {
    id: "linky",
    name: "Template Linky",
    steps: [
      "Format paling lengkap — semua field Linky tersedia.",
      "Cocok kalau kamu generate CSV sendiri dari spreadsheet / script.",
      "Klik Unduh template di bawah untuk mulai.",
    ],
    sampleHeader:
      "destination_url,slug,title,description,tags,password,expires_at,click_limit,ios_url,android_url,utm_source,utm_medium,utm_campaign",
    sampleRow:
      "https://example.com/landing,promo,Promo April,Diskon 50% akhir bulan,marketing|launch,,2026-12-31,1000,,,newsletter,email,april",
  },
];

function downloadSample(name: string, header: string, row: string) {
  const csv = header + "\n" + row + "\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `linky-sample-${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProviderGuide() {
  const [open, setOpen] = useState<string | null>("bitly");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cara export dari platform lain</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 px-2 pb-2">
        {PROVIDERS.map((p) => {
          const isOpen = open === p.id;
          return (
            <div key={p.id} className="rounded-[8px] border border-[color:var(--border)] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : p.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-[color:var(--muted)]/40"
              >
                <span className="flex-1 text-left">{p.name}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 space-y-2 bg-[color:var(--muted)]/20 border-t border-[color:var(--border)]/60">
                  <ol className="list-decimal pl-5 text-xs text-[color:var(--muted-foreground)] space-y-1">
                    {p.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  <div className="rounded-[6px] bg-[color:var(--background)] border border-[color:var(--border)]/60 p-2 overflow-x-auto">
                    <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">
                      Format kolom
                    </div>
                    <pre className="text-[10px] font-mono whitespace-pre">{p.sampleHeader}</pre>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => downloadSample(p.id, p.sampleHeader, p.sampleRow)}
                      className="inline-flex items-center gap-1 text-[11px] text-[color:var(--primary)] hover:underline"
                    >
                      <Download className="h-3 w-3" /> Unduh sample CSV
                    </button>
                    {p.externalDocs && (
                      <a
                        href={p.externalDocs}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[color:var(--muted-foreground)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Docs official
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
