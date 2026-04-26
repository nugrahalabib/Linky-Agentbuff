"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronsUpDown,
  Clock,
  Globe,
  Link2,
  Monitor,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChartBig } from "@/components/sparkline-chart";
import { formatNumber, hostOf, relativeTime, truncate } from "@/lib/utils";
import type { AnalyticsOverview, RecentClickRow, TopLinkRow } from "@/lib/analytics";

type Period = 7 | 30 | 90;
type LinkOption = { id: string; slug: string; title: string | null };

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 90, label: "90 hari" },
];

export function AnalyticsDashboard({
  workspaceName,
  appUrl,
  linkOptions,
}: {
  workspaceName: string;
  appUrl: string;
  linkOptions: LinkOption[];
}) {
  const [days, setDays] = useState<Period>(7);
  const [linkId, setLinkId] = useState<string | "">("");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topLinks, setTopLinks] = useState<TopLinkRow[] | null>(null);
  const [recent, setRecent] = useState<RecentClickRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (linkId) params.set("linkId", linkId);
    Promise.all([
      fetch(`/api/analytics/workspace?${params.toString()}`).then((r) => r.json()),
      fetch(`/api/analytics/workspace/top-links?days=${days}&limit=10`).then((r) => r.json()),
      fetch(`/api/analytics/workspace/recent?limit=15`).then((r) => r.json()),
    ])
      .then(([ov, tl, rc]) => {
        if (!alive) return;
        setOverview(ov);
        setTopLinks(tl.links ?? []);
        setRecent(rc.recent ?? []);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days, linkId]);

  const filteredLinks = useMemo(
    () =>
      linkOptions.filter(
        (l) =>
          l.slug.toLowerCase().includes(pickerQuery.toLowerCase()) ||
          (l.title?.toLowerCase().includes(pickerQuery.toLowerCase()) ?? false),
      ),
    [linkOptions, pickerQuery],
  );

  const activeLinkLabel = linkId
    ? linkOptions.find((l) => l.id === linkId)?.slug ?? "Link"
    : "Semua link";

  const topCountry = overview?.topCountries[0];
  const topReferrer = overview?.topReferrers[0];
  const isEmpty = (overview?.totalClicks ?? 0) === 0;

  return (
    <div className="space-y-6">
      {/* ── HEADER ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analitik</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Performa workspace <strong>{workspaceName}</strong>
          {linkId ? (
            <>
              {" · "}link <code className="font-mono text-xs">/{activeLinkLabel}</code>
            </>
          ) : null}
        </p>
      </div>

      {/* ── FILTER BAR ────────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">
            {/* Link picker */}
            <div className="relative w-full sm:w-72">
              <button
                onClick={() => setPickerOpen((o) => !o)}
                className="w-full flex items-center gap-2 rounded-[8px] border border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[color:var(--muted)]"
              >
                <Link2 className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                <span className="flex-1 text-left truncate">
                  {linkId ? `/${activeLinkLabel}` : "Semua link"}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              </button>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPickerOpen(false)} />
                  <div className="absolute z-40 mt-1 w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl overflow-hidden">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Cari link..."
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-transparent border-b border-[color:var(--border)] focus:outline-none"
                    />
                    <ul className="max-h-64 overflow-y-auto py-1">
                      <li>
                        <button
                          onClick={() => {
                            setLinkId("");
                            setPickerOpen(false);
                            setPickerQuery("");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[color:var(--muted)] text-left"
                        >
                          <Globe className="h-3.5 w-3.5 text-[color:var(--muted-foreground)]" />
                          Semua link
                        </button>
                      </li>
                      {filteredLinks.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-[color:var(--muted-foreground)]">
                          Tidak ada link cocok.
                        </li>
                      ) : (
                        filteredLinks.map((l) => (
                          <li key={l.id}>
                            <button
                              onClick={() => {
                                setLinkId(l.id);
                                setPickerOpen(false);
                                setPickerQuery("");
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[color:var(--muted)] text-left"
                            >
                              <code className="font-mono text-xs">/{l.slug}</code>
                              {l.title && (
                                <span className="text-xs text-[color:var(--muted-foreground)] truncate">
                                  · {truncate(l.title, 30)}
                                </span>
                              )}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Period switcher */}
            <div className="inline-flex rounded-[8px] border border-[color:var(--border)] p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDays(p.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                    days === p.value
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                      : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {linkId && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/links/${linkId}`}>Buka detail link →</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── KPI CARDS ─────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total klik"
          value={loading ? null : formatNumber(overview?.totalClicks ?? 0)}
          icon={BarChart3}
          tone="primary"
        />
        <KpiCard
          label="Pengunjung unik"
          value={loading ? null : formatNumber(overview?.uniqueVisitors ?? 0)}
          icon={Users}
        />
        <KpiCard
          label={`Rata-rata / hari`}
          value={loading ? null : formatNumber(overview?.avgPerDay ?? 0)}
          icon={TrendingUp}
        />
        <KpiCard
          label={linkId ? "Top negara" : "Total link aktif"}
          value={
            loading
              ? null
              : linkId
                ? topCountry?.country ?? "—"
                : formatNumber(overview?.totalLinks ?? 0)
          }
          icon={linkId ? Globe : Link2}
        />
      </div>

      {/* ── CHART ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Klik per hari</CardTitle>
          <CardDescription>
            Tren {days} hari terakhir{linkId ? ` untuk /${activeLinkLabel}` : " dari semua link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : isEmpty ? (
            <EmptyState message="Belum ada klik di periode ini." appUrl={appUrl} />
          ) : (
            <LineChartBig data={overview!.last7Days} />
          )}
        </CardContent>
      </Card>

      {/* ── TOP LINKS TABLE (only when no link filter) ─────────────── */}
      {!linkId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top 10 link berperforma terbaik</CardTitle>
                <CardDescription>Ranking berdasarkan jumlah klik {days} hari terakhir</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/links">Lihat semua link →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topLinks && topLinks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-[color:var(--muted-foreground)] border-b border-[color:var(--border)]">
                      <th className="py-2 pr-3 font-semibold">#</th>
                      <th className="py-2 pr-3 font-semibold">Link</th>
                      <th className="py-2 pr-3 font-semibold hidden md:table-cell">Tujuan</th>
                      <th className="py-2 pr-3 font-semibold text-right">Klik</th>
                      <th className="py-2 pr-3 font-semibold text-right">Tren</th>
                      <th className="py-2 pr-3 font-semibold hidden sm:table-cell">7 hari</th>
                      <th className="py-2 pl-3 font-semibold text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLinks.map((l, i) => (
                      <tr
                        key={l.id}
                        className="border-b border-[color:var(--border)]/60 hover:bg-[color:var(--muted)]/40"
                      >
                        <td className="py-3 pr-3 text-[color:var(--muted-foreground)] tabular-nums w-6">
                          {i + 1}
                        </td>
                        <td className="py-3 pr-3 min-w-0">
                          <Link
                            href={`/dashboard/links/${l.id}`}
                            className="font-mono text-xs hover:text-[color:var(--primary)]"
                          >
                            /{l.slug}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 hidden md:table-cell text-[color:var(--muted-foreground)] truncate max-w-[200px]">
                          {l.title || hostOf(l.destinationUrl) || l.destinationUrl}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums font-semibold">
                          {formatNumber(l.clicks)}
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <DeltaPill delta={l.delta} prev={l.prevClicks} />
                        </td>
                        <td className="py-3 pr-3 hidden sm:table-cell">
                          <MiniSparkline data={l.sparkline} />
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <Link
                            href={`/dashboard/links/${l.id}`}
                            className="text-xs text-[color:var(--primary)] hover:underline"
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Belum ada link yang punya klik di periode ini." appUrl={appUrl} />
            )}
          </CardContent>
        </Card>
      )}

      {/* ── BREAKDOWN LISTS ───────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownCard
          title="Negara"
          icon={Globe}
          items={overview?.topCountries.map((c) => ({ label: c.country, value: c.clicks })) ?? []}
          loading={loading}
        />
        <BreakdownCard
          title="Sumber traffic (referrer)"
          icon={Link2}
          items={
            overview?.topReferrers.map((r) => ({
              label: r.referrer === "Langsung" ? "Direct / langsung" : hostOf(r.referrer) || r.referrer,
              value: r.clicks,
            })) ?? []
          }
          loading={loading}
        />
        <BreakdownCard
          title="Device"
          icon={Smartphone}
          items={overview?.topDevices.map((d) => ({ label: d.device || "Desktop", value: d.clicks })) ?? []}
          loading={loading}
        />
        <BreakdownCard
          title="Browser"
          icon={Monitor}
          items={overview?.topBrowsers.map((b) => ({ label: b.browser, value: b.clicks })) ?? []}
          loading={loading}
        />
      </div>

      {/* ── RECENT ACTIVITY ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Aktivitas terbaru
          </CardTitle>
          <CardDescription>15 klik paling baru di workspace</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent && recent.length > 0 ? (
            <ul className="divide-y divide-[color:var(--border)]/60">
              {recent.map((r, i) => (
                <li key={i} className="py-2.5 flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-[color:var(--success)] shrink-0" />
                  <Link
                    href={`/dashboard/links/${r.linkId}`}
                    className="font-mono text-xs text-[color:var(--primary)] hover:underline shrink-0"
                  >
                    /{r.slug}
                  </Link>
                  <span className="text-xs text-[color:var(--muted-foreground)] flex-1 truncate">
                    {r.country ?? "Unknown"} · {r.device || "desktop"} · {r.browser || "?"}
                    {r.referrer ? ` · ${hostOf(r.referrer) || "ref"}` : ""}
                  </span>
                  <span className="text-xs text-[color:var(--muted-foreground)] tabular-nums shrink-0">
                    {relativeTime(r.ts)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-center py-6 text-[color:var(--muted-foreground)]">
              Belum ada klik. Bagikan link kamu untuk mulai mengumpulkan data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | null;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary";
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
            {label}
          </div>
          <Icon
            className={`h-4 w-4 ${
              tone === "primary" ? "text-[color:var(--primary)]" : "text-[color:var(--muted-foreground)]"
            }`}
          />
        </div>
        <div className="mt-2 text-3xl font-bold tabular-nums">
          {value === null ? <Skeleton className="h-8 w-20" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}

function DeltaPill({ delta, prev }: { delta: number; prev: number }) {
  if (prev === 0 && delta === 0) return <span className="text-xs text-[color:var(--muted-foreground)]">—</span>;
  const positive = delta >= 0;
  return (
    <Badge variant={positive ? "success" : "danger"} className="gap-0.5">
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(delta)}%
    </Badge>
  );
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-0.5 h-6 w-20">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-gradient-to-t from-brand-600 to-accent-400"
          style={{ height: `${Math.max(8, (v / max) * 100)}%`, opacity: 0.3 + (v / max) * 0.7 }}
        />
      ))}
    </div>
  );
}

function BreakdownCard({
  title,
  icon: Icon,
  items,
  loading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{ label: string; value: number }>;
  loading: boolean;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-[color:var(--muted-foreground)]">Belum ada data.</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 8).map((item) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <li key={item.label} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="truncate pr-2">{item.label || "—"}</span>
                    <span className="tabular-nums text-[color:var(--muted-foreground)] shrink-0">
                      {formatNumber(item.value)}{" "}
                      <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[color:var(--muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, appUrl }: { message: string; appUrl: string }) {
  return (
    <div className="text-center py-10 space-y-3">
      <div className="inline-flex h-12 w-12 rounded-full bg-[color:var(--muted)] items-center justify-center">
        <BarChart3 className="h-5 w-5 text-[color:var(--muted-foreground)]" />
      </div>
      <p className="text-sm text-[color:var(--muted-foreground)]">{message}</p>
      <Button asChild size="sm">
        <Link href="/dashboard/links/new">Bikin link baru</Link>
      </Button>
      <p className="text-xs text-[color:var(--muted-foreground)]">
        Atau bagikan link existing dari{" "}
        <Link href="/dashboard/links" className="text-[color:var(--primary)] hover:underline">
          {new URL(appUrl).host}
        </Link>
      </p>
    </div>
  );
}
