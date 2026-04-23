import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Plus, QrCode, BarChart3, Link as LinkIcon, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { getWorkspaceAnalytics, fillMissingDays } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkListItem } from "@/components/link-list-item";
import { SparklineChart } from "@/components/sparkline-chart";
import { formatNumber } from "@/lib/utils";

export default async function DashboardHome() {
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);

  const allLinks = db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, workspace.id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .all();

  const recent = allLinks.slice(0, 5);
  const totalLinks = allLinks.length;

  const analytics = getWorkspaceAnalytics(workspace.id, 7);
  const sparkline = fillMissingDays(analytics.last7Days, 7);
  const totalClicks = analytics.totalClicks;
  const todayClicks = sparkline.at(-1)?.clicks ?? 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
  const firstName = (user.name || user.email.split("@")[0]).split(" ")[0];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Halo, <span className="text-[color:var(--primary)]">{firstName}</span> 👋
          </h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Berikut ringkasan link dan performamu minggu ini.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/links/new">
            <Plus className="h-4 w-4" />
            Link baru
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Klik hari ini</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(todayClicks)}</CardTitle>
          </CardHeader>
          <CardContent>
            <SparklineChart data={sparkline} height={60} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total klik (30 hari)</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(getWorkspaceAnalytics(workspace.id, 30).totalClicks)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-[color:var(--muted-foreground)] flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Klik dari pengunjung nyata (bot difilter)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total link</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(totalLinks)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-[color:var(--muted-foreground)]">
              {totalLinks === 0 ? "Belum ada — mulai sekarang!" : "Link aktif di workspace"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Klik 7 hari</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(totalClicks)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-[color:var(--muted-foreground)]">Pengunjung unik: {analytics.uniqueVisitors}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Link terbaru</CardTitle>
                <CardDescription>5 link yang paling baru kamu buat.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/links">Lihat semua</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={<LinkIcon className="h-6 w-6" />}
                title="Belum ada link."
                description="Tempel URL pertamamu — butuh 2 detik."
                action={
                  <Button asChild>
                    <Link href="/dashboard/links/new">
                      <Plus className="h-4 w-4" />
                      Buat link pertama
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col divide-y divide-[color:var(--border)]">
                {recent.map((l) => (
                  <LinkListItem key={l.id} link={l} appUrl={appUrl} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bikin cepat</CardTitle>
            <CardDescription>Shortcut untuk aksi populer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/links/new">
                <LinkIcon className="h-4 w-4" />
                Link baru
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/qr">
                <QrCode className="h-4 w-4" />
                QR code baru
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/dashboard/analytics">
                <BarChart3 className="h-4 w-4" />
                Analitik lengkap
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
