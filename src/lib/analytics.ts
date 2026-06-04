import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";

export interface AnalyticsOverview {
  totalClicks: number;
  uniqueVisitors: number;
  avgPerDay: number;
  totalLinks: number;
  last7Days: Array<{ date: string; clicks: number }>;
  topCountries: Array<{ country: string; clicks: number }>;
  topReferrers: Array<{ referrer: string; clicks: number }>;
  topDevices: Array<{ device: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
}

export interface TopLinkRow {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  faviconUrl: string | null;
  clicks: number;
  prevClicks: number;
  delta: number;
  sparkline: number[];
}

export interface RecentClickRow {
  ts: number;
  slug: string;
  linkId: string;
  country: string | null;
  device: string | null;
  browser: string | null;
  referrer: string | null;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function safeRows<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [] as T[];
  }
}

export async function getLinkAnalytics(linkId: string, days = 30): Promise<AnalyticsOverview> {
  const since = daysAgo(days);
  const baseConds = [eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)];
  const totalRow = (await db.select({ n: sql<number>`count(*)` }).from(clicks).where(and(...baseConds)))[0];
  const uniqueRow = (await db
    .select({ n: sql<number>`count(distinct ${clicks.ipHash})` })
    .from(clicks)
    .where(and(...baseConds)))[0];
  const trend = await safeRows(async () =>
    await db
      .select({
        date: sql<string>`to_char(${clicks.ts} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        clicks: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(sql`to_char(${clicks.ts} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),
  );
  const countries = await safeRows(async () =>
    await db
      .select({ country: clicks.country, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(...baseConds))
      .groupBy(clicks.country)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );
  const referrers = await safeRows(async () =>
    await db
      .select({ referrer: clicks.referrer, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(...baseConds))
      .groupBy(clicks.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );
  const devices = await safeRows(async () =>
    await db
      .select({ device: clicks.device, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(...baseConds))
      .groupBy(clicks.device)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );
  const browsers = await safeRows(async () =>
    await db
      .select({ browser: clicks.browser, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(...baseConds))
      .groupBy(clicks.browser)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );
  const totalClicks = totalRow?.n ?? 0;

  return {
    totalClicks,
    uniqueVisitors: uniqueRow?.n ?? 0,
    avgPerDay: days > 0 ? Math.round(totalClicks / days) : 0,
    totalLinks: 1,
    last7Days: trend.map((r) => ({ date: r.date, clicks: Number(r.clicks) })),
    topCountries: countries.map((r) => ({ country: r.country ?? "Unknown", clicks: Number(r.clicks) })),
    topReferrers: referrers.map((r) => ({ referrer: r.referrer ?? "Langsung", clicks: Number(r.clicks) })),
    topDevices: devices.map((r) => ({ device: r.device ?? "unknown", clicks: Number(r.clicks) })),
    topBrowsers: browsers.map((r) => ({ browser: r.browser ?? "unknown", clicks: Number(r.clicks) })),
  };
}

/**
 * Workspace-wide analytics with optional `linkId` filter.
 * When `linkId` is set, behaves like getLinkAnalytics but verifies the link belongs
 * to the workspace (caller should already check ownership).
 */
export async function getWorkspaceAnalytics(workspaceId: string, days = 30, linkId?: string | null): Promise<AnalyticsOverview> {
  const since = daysAgo(days);
  const conds = [eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, since)];
  if (linkId) conds.push(eq(clicks.linkId, linkId));

  const totalRow = (await db
    .select({ n: sql<number>`count(*)` })
    .from(clicks)
    .innerJoin(links, eq(links.id, clicks.linkId))
    .where(and(...conds)))[0];
  const uniqueRow = (await db
    .select({ n: sql<number>`count(distinct ${clicks.ipHash})` })
    .from(clicks)
    .innerJoin(links, eq(links.id, clicks.linkId))
    .where(and(...conds)))[0];
  const trend = await safeRows(async () =>
    await db
      .select({
        date: sql<string>`to_char(${clicks.ts} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
        clicks: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(...conds))
      .groupBy(sql`to_char(${clicks.ts} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),
  );
  const countries = await safeRows(async () =>
    await db
      .select({ country: clicks.country, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(...conds))
      .groupBy(clicks.country)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );
  const referrers = await safeRows(async () =>
    await db
      .select({ referrer: clicks.referrer, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(...conds))
      .groupBy(clicks.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );
  const devices = await safeRows(async () =>
    await db
      .select({ device: clicks.device, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(...conds))
      .groupBy(clicks.device)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );
  const browsers = await safeRows(async () =>
    await db
      .select({ browser: clicks.browser, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(...conds))
      .groupBy(clicks.browser)
      .orderBy(sql`count(*) desc`)
      .limit(10),
  );

  // Total active links (not archived) — useful for KPI
  const linkCountRow = (await db
    .select({ n: sql<number>`count(*)` })
    .from(links)
    .where(and(eq(links.workspaceId, workspaceId), eq(links.archived, false))))[0];

  const totalClicks = totalRow?.n ?? 0;

  return {
    totalClicks,
    uniqueVisitors: uniqueRow?.n ?? 0,
    avgPerDay: days > 0 ? Math.round(totalClicks / days) : 0,
    totalLinks: linkCountRow?.n ?? 0,
    last7Days: trend.map((r) => ({ date: r.date, clicks: Number(r.clicks) })),
    topCountries: countries.map((r) => ({ country: r.country ?? "Unknown", clicks: Number(r.clicks) })),
    topReferrers: referrers.map((r) => ({ referrer: r.referrer ?? "Langsung", clicks: Number(r.clicks) })),
    topDevices: devices.map((r) => ({ device: r.device ?? "unknown", clicks: Number(r.clicks) })),
    topBrowsers: browsers.map((r) => ({ browser: r.browser ?? "unknown", clicks: Number(r.clicks) })),
  };
}

/**
 * Top links by clicks within `days`, with previous-period delta and 7-day sparkline.
 */
export async function getTopLinks(workspaceId: string, days = 30, limit = 10): Promise<TopLinkRow[]> {
  const since = daysAgo(days);
  const prevSince = daysAgo(days * 2);

  const rows = await safeRows(async () =>
    await db
      .select({
        id: links.id,
        slug: links.slug,
        destinationUrl: links.destinationUrl,
        title: links.title,
        faviconUrl: links.faviconUrl,
        clicks: sql<number>`count(${clicks.id})`,
      })
      .from(links)
      .leftJoin(
        clicks,
        and(eq(clicks.linkId, links.id), eq(clicks.isBot, false), gte(clicks.ts, since)),
      )
      .where(and(eq(links.workspaceId, workspaceId), eq(links.archived, false)))
      .groupBy(links.id)
      .orderBy(desc(sql`count(${clicks.id})`), desc(links.createdAt))
      .limit(limit),
  );

  return Promise.all(rows.map(async (r) => {
    const prev = (await db
      .select({ n: sql<number>`count(*)` })
      .from(clicks)
      .where(
        and(
          eq(clicks.linkId, r.id),
          eq(clicks.isBot, false),
          gte(clicks.ts, prevSince),
          lt(clicks.ts, since),
        ),
      ))[0];
    const sparkRows = await safeRows(async () =>
      await db
        .select({
          date: sql<string>`to_char(${clicks.ts} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
          clicks: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(and(eq(clicks.linkId, r.id), eq(clicks.isBot, false), gte(clicks.ts, daysAgo(7))))
        .groupBy(sql`to_char(${clicks.ts} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`),
    );
    const sparkMap = new Map(sparkRows.map((s) => [s.date, Number(s.clicks)]));
    const sparkline: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      sparkline.push(sparkMap.get(key) ?? 0);
    }
    const cur = Number(r.clicks);
    const prevN = Number(prev?.n ?? 0);
    return {
      id: r.id,
      slug: r.slug,
      destinationUrl: r.destinationUrl,
      title: r.title,
      faviconUrl: r.faviconUrl,
      clicks: cur,
      prevClicks: prevN,
      delta: prevN > 0 ? Math.round(((cur - prevN) / prevN) * 100) : cur > 0 ? 100 : 0,
      sparkline,
    };
  }));
}

export async function getRecentClicks(workspaceId: string, limit = 20): Promise<RecentClickRow[]> {
  const rows = await safeRows(async () =>
    await db
      .select({
        ts: clicks.ts,
        slug: links.slug,
        linkId: clicks.linkId,
        country: clicks.country,
        device: clicks.device,
        browser: clicks.browser,
        referrer: clicks.referrer,
      })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false)))
      .orderBy(desc(clicks.ts))
      .limit(limit),
  );
  return rows.map((r) => ({
    ts: (r.ts as Date).getTime(),
    slug: r.slug,
    linkId: r.linkId,
    country: r.country,
    device: r.device,
    browser: r.browser,
    referrer: r.referrer,
  }));
}

export function fillMissingDays(rows: Array<{ date: string; clicks: number }>, days = 7): Array<{ date: string; clicks: number }> {
  const map = new Map(rows.map((r) => [r.date, r.clicks]));
  const out: Array<{ date: string; clicks: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, clicks: map.get(key) ?? 0 });
  }
  return out;
}
