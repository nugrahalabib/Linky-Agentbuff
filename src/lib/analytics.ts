import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";

export interface AnalyticsOverview {
  totalClicks: number;
  uniqueVisitors: number;
  last7Days: Array<{ date: string; clicks: number }>;
  topCountries: Array<{ country: string; clicks: number }>;
  topReferrers: Array<{ referrer: string; clicks: number }>;
  topDevices: Array<{ device: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function safeRows<T>(fn: () => T[]): T[] {
  try {
    return fn();
  } catch {
    return [] as T[];
  }
}

export function getLinkAnalytics(linkId: string, days = 30): AnalyticsOverview {
  const since = daysAgo(days);
  const totalRow = db
    .select({ n: sql<number>`count(*)` })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)))
    .get();
  const uniqueRow = db
    .select({ n: sql<number>`count(distinct ${clicks.ipHash})` })
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)))
    .get();
  const last7 = safeRows(() =>
    db
      .select({
        date: sql<string>`date(${clicks.ts} / 1000, 'unixepoch')`,
        clicks: sql<number>`count(*)`,
      })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, daysAgo(7))))
      .groupBy(sql`date(${clicks.ts} / 1000, 'unixepoch')`)
      .all(),
  );
  const countries = safeRows(() =>
    db
      .select({ country: clicks.country, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.country)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );
  const referrers = safeRows(() =>
    db
      .select({ referrer: clicks.referrer, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );
  const devices = safeRows(() =>
    db
      .select({ device: clicks.device, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.device)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );
  const browsers = safeRows(() =>
    db
      .select({ browser: clicks.browser, clicks: sql<number>`count(*)` })
      .from(clicks)
      .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.browser)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );

  return {
    totalClicks: totalRow?.n ?? 0,
    uniqueVisitors: uniqueRow?.n ?? 0,
    last7Days: last7.map((r) => ({ date: r.date, clicks: Number(r.clicks) })),
    topCountries: countries.map((r) => ({ country: r.country ?? "Unknown", clicks: Number(r.clicks) })),
    topReferrers: referrers.map((r) => ({ referrer: r.referrer ?? "Langsung", clicks: Number(r.clicks) })),
    topDevices: devices.map((r) => ({ device: r.device ?? "unknown", clicks: Number(r.clicks) })),
    topBrowsers: browsers.map((r) => ({ browser: r.browser ?? "unknown", clicks: Number(r.clicks) })),
  };
}

export function getWorkspaceAnalytics(workspaceId: string, days = 30): AnalyticsOverview {
  const since = daysAgo(days);
  const totalRow = db
    .select({ n: sql<number>`count(*)` })
    .from(clicks)
    .innerJoin(links, eq(links.id, clicks.linkId))
    .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, since)))
    .get();
  const uniqueRow = db
    .select({ n: sql<number>`count(distinct ${clicks.ipHash})` })
    .from(clicks)
    .innerJoin(links, eq(links.id, clicks.linkId))
    .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, since)))
    .get();
  const last7 = safeRows(() =>
    db
      .select({
        date: sql<string>`date(${clicks.ts} / 1000, 'unixepoch')`,
        clicks: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, daysAgo(7))))
      .groupBy(sql`date(${clicks.ts} / 1000, 'unixepoch')`)
      .all(),
  );
  const countries = safeRows(() =>
    db
      .select({ country: clicks.country, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.country)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );
  const referrers = safeRows(() =>
    db
      .select({ referrer: clicks.referrer, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );
  const devices = safeRows(() =>
    db
      .select({ device: clicks.device, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.device)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );
  const browsers = safeRows(() =>
    db
      .select({ browser: clicks.browser, clicks: sql<number>`count(*)` })
      .from(clicks)
      .innerJoin(links, eq(links.id, clicks.linkId))
      .where(and(eq(links.workspaceId, workspaceId), eq(clicks.isBot, false), gte(clicks.ts, since)))
      .groupBy(clicks.browser)
      .orderBy(sql`count(*) desc`)
      .limit(10)
      .all(),
  );

  return {
    totalClicks: totalRow?.n ?? 0,
    uniqueVisitors: uniqueRow?.n ?? 0,
    last7Days: last7.map((r) => ({ date: r.date, clicks: Number(r.clicks) })),
    topCountries: countries.map((r) => ({ country: r.country ?? "Unknown", clicks: Number(r.clicks) })),
    topReferrers: referrers.map((r) => ({ referrer: r.referrer ?? "Langsung", clicks: Number(r.clicks) })),
    topDevices: devices.map((r) => ({ device: r.device ?? "unknown", clicks: Number(r.clicks) })),
    topBrowsers: browsers.map((r) => ({ browser: r.browser ?? "unknown", clicks: Number(r.clicks) })),
  };
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
