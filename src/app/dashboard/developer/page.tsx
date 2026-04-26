import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys, webhooks, webhookDeliveries } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { ApiKeyManager } from "@/components/api-key-manager";
import { WebhookManager } from "@/components/webhook-manager";
import { DeveloperQuickstart } from "@/components/developer-quickstart";
import { ApiTestConsole } from "@/components/api-test-console";
import { DeveloperTabs } from "@/components/developer-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, BookOpen, KeyRound, Webhook as WebhookIcon } from "lucide-react";

export default async function DeveloperPage() {
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);

  const keys = db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, ws.id))
    .orderBy(desc(apiKeys.createdAt))
    .all();

  const hooks = db
    .select()
    .from(webhooks)
    .where(eq(webhooks.workspaceId, ws.id))
    .orderBy(desc(webhooks.createdAt))
    .all();

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const usageRow = db
    .select({ n: sql<number>`count(*)` })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, ws.id))
    .all();
  const recentlyUsedRow = db
    .select({ n: sql<number>`count(*)` })
    .from(apiKeys)
    .where(sql`${apiKeys.workspaceId} = ${ws.id} AND ${apiKeys.lastUsedAt} >= ${sevenDaysAgo.getTime()}`)
    .get();
  const deliveriesRow = db
    .select({ n: sql<number>`count(*)` })
    .from(webhookDeliveries)
    .innerJoin(webhooks, eq(webhooks.id, webhookDeliveries.webhookId))
    .where(sql`${webhooks.workspaceId} = ${ws.id} AND ${webhookDeliveries.ts} >= ${sevenDaysAgo.getTime()}`)
    .get();
  const failedRow = db
    .select({ n: sql<number>`count(*)` })
    .from(webhookDeliveries)
    .innerJoin(webhooks, eq(webhooks.id, webhookDeliveries.webhookId))
    .where(
      sql`${webhooks.workspaceId} = ${ws.id} AND ${webhookDeliveries.ts} >= ${sevenDaysAgo.getTime()} AND ${webhookDeliveries.success} = 0`,
    )
    .get();

  const stats = {
    totalKeys: usageRow.length,
    activeKeys: recentlyUsedRow?.n ?? 0,
    totalWebhooks: hooks.length,
    deliveries7d: deliveriesRow?.n ?? 0,
    failed7d: failedRow?.n ?? 0,
  };

  const activeWebhooks = hooks.filter((h) => h.active).length;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Developer</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            REST API + Webhooks. Lihat docs publik di{" "}
            <Link href="/docs/api" className="text-[color:var(--primary)] hover:underline">
              /docs/api
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/docs/api"
            className="inline-flex items-center gap-2 rounded-[10px] border border-[color:var(--border)] px-3 h-9 text-sm font-medium hover:bg-[color:var(--muted)]"
          >
            <BookOpen className="h-4 w-4" /> API Docs
          </Link>
          <Link
            href="/docs/openapi.json"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-[10px] border border-[color:var(--border)] px-3 h-9 text-sm font-medium hover:bg-[color:var(--muted)]"
          >
            OpenAPI
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<KeyRound className="h-4 w-4" />} label="API keys" value={stats.totalKeys} hint={`${stats.activeKeys} aktif (7 hari)`} />
        <StatCard icon={<WebhookIcon className="h-4 w-4" />} label="Webhooks" value={stats.totalWebhooks} hint={`${activeWebhooks} aktif`} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Deliveries (7h)" value={stats.deliveries7d} hint={`${stats.failed7d} gagal`} tone={stats.failed7d > 0 ? "warn" : "ok"} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Base URL" value="/api/v1" hint={appUrl} mono />
      </div>

      <DeveloperTabs
        baseUrl={appUrl}
        keysSlot={<ApiKeyManager initial={keys} />}
        webhooksSlot={<WebhookManager initial={hooks} />}
        quickstartSlot={<DeveloperQuickstart baseUrl={appUrl} />}
        consoleSlot={<ApiTestConsole baseUrl={appUrl} />}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "ok" | "warn";
  mono?: boolean;
}) {
  const toneColor =
    tone === "warn"
      ? "text-amber-600 dark:text-amber-400"
      : "text-[color:var(--foreground)]";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[color:var(--muted-foreground)] text-xs font-medium">
          {icon}
          <span>{label}</span>
        </div>
        <div className={`mt-1 text-2xl font-semibold ${toneColor} ${mono ? "font-mono text-base" : ""}`}>{value}</div>
        {hint && <div className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5 truncate">{hint}</div>}
      </CardContent>
    </Card>
  );
}
