"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  member_since: number | string | Date;
  totals: {
    links: number;
    clicks: number;
    linky_pages: number;
    api_keys: number;
    webhooks: number;
  };
}

function formatDate(ts: number | string | Date): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { dateStyle: "long" });
}

export function DataSection() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/account/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => undefined);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data & statistik</CardTitle>
        <CardDescription>Ringkasan akunmu dan ekspor lengkap.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Link", value: stats?.totals.links },
            { label: "Total klik", value: stats?.totals.clicks },
            { label: "Linky Pages", value: stats?.totals.linky_pages },
            { label: "API key", value: stats?.totals.api_keys },
            { label: "Webhook", value: stats?.totals.webhooks },
          ].map((s) => (
            <div key={s.label} className="rounded-[10px] border border-[color:var(--border)] p-3">
              <div className="text-[11px] text-[color:var(--muted-foreground)]">{s.label}</div>
              <div className="mt-0.5 text-xl font-semibold">{s.value ?? "—"}</div>
            </div>
          ))}
        </div>

        {stats?.member_since && (
          <div className="text-xs text-[color:var(--muted-foreground)]">
            Bergabung sejak <strong>{formatDate(stats.member_since)}</strong>
          </div>
        )}

        <div className="border-t border-[color:var(--border)] pt-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Ekspor data
          </div>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            Unduh seluruh data kamu (link, klik, folder, tag, Linky Pages) sebagai file JSON.
            Berguna untuk backup atau pindah ke layanan lain (data portability).
          </p>
          <Button asChild variant="outline">
            <a href="/api/account/export" download>
              <Download className="h-4 w-4" />
              Unduh ekspor JSON
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
