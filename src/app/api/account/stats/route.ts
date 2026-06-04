import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys, clicks, links, linkyPages, webhooks } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);

  const linksRow = (await db
    .select({ n: sql<number>`count(*)` })
    .from(links)
    .where(eq(links.workspaceId, ws.id)))[0];
  const clicksRow = (await db
    .select({ n: sql<number>`count(*)` })
    .from(clicks)
    .innerJoin(links, eq(links.id, clicks.linkId))
    .where(eq(links.workspaceId, ws.id)))[0];
  const pagesRow = (await db
    .select({ n: sql<number>`count(*)` })
    .from(linkyPages)
    .where(eq(linkyPages.workspaceId, ws.id)))[0];
  const keysRow = (await db
    .select({ n: sql<number>`count(*)` })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, ws.id)))[0];
  const hooksRow = (await db
    .select({ n: sql<number>`count(*)` })
    .from(webhooks)
    .where(eq(webhooks.workspaceId, ws.id)))[0];

  return NextResponse.json({
    member_since: ctx.user.createdAt,
    totals: {
      links: linksRow?.n ?? 0,
      clicks: clicksRow?.n ?? 0,
      linky_pages: pagesRow?.n ?? 0,
      api_keys: keysRow?.n ?? 0,
      webhooks: hooksRow?.n ?? 0,
    },
  });
}
