"use client";

import { useEffect, useState } from "react";
import type { AnalyticsOverview } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChartBig } from "@/components/sparkline-chart";
import { formatNumber } from "@/lib/utils";

type Overview = AnalyticsOverview & { last7Days: Array<{ date: string; clicks: number }> };

export function AnalyticsPanel({ linkId, workspaceId }: { linkId?: string; workspaceId?: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = linkId ? `/api/links/${linkId}/analytics?days=${days}` : `/api/analytics/workspace?days=${days}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [linkId, workspaceId, days]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
        <Skeleton className="h-64 lg:col-span-4" />
      </div>
    );
  }

  if (!data) return <div className="text-sm text-[color:var(--muted-foreground)]">Data tidak tersedia.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Periode</h2>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${
                days === d
                  ? "bg-[color:var(--primary)] text-white"
                  : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              }`}
            >
              {d} hari
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total klik" value={formatNumber(data.totalClicks)} />
        <Stat label="Pengunjung unik" value={formatNumber(data.uniqueVisitors)} />
        <Stat label="Top negara" value={data.topCountries[0]?.country ?? "—"} />
        <Stat label="Top referrer" value={data.topReferrers[0]?.referrer ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Klik per hari</CardTitle>
          <CardDescription>Grafik klik dalam {days} hari terakhir</CardDescription>
        </CardHeader>
        <CardContent>
          <LineChartBig data={data.last7Days} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownCard title="Negara" rows={data.topCountries.map((r) => ({ label: r.country, value: r.clicks }))} />
        <BreakdownCard title="Referrer" rows={data.topReferrers.map((r) => ({ label: r.referrer, value: r.clicks }))} />
        <BreakdownCard title="Device" rows={data.topDevices.map((r) => ({ label: r.device, value: r.clicks }))} />
        <BreakdownCard title="Browser" rows={data.topBrowsers.map((r) => ({ label: r.browser, value: r.clicks }))} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function BreakdownCard({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-[color:var(--muted-foreground)]">Belum ada data.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={`${r.label}-${i}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{r.label}</span>
                  <span className="tabular-nums text-[color:var(--muted-foreground)]">{r.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[color:var(--muted)] overflow-hidden">
                  <div
                    className="h-full bg-[color:var(--primary)]"
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
