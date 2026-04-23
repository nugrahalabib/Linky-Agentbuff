import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const link = db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.workspaceId, ws.id)))
    .get();
  if (!link) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!link.abVariants || link.abVariants.length === 0) {
    return NextResponse.json({ variants: [], total: 0 });
  }
  const rows = db
    .select({ variant: clicks.abVariant, n: sql<number>`count(*)` })
    .from(clicks)
    .where(and(eq(clicks.linkId, id), eq(clicks.isBot, false)))
    .groupBy(clicks.abVariant)
    .all();
  const counts = new Map<string, number>(rows.map((r) => [r.variant ?? "", Number(r.n)]));
  const total = rows.reduce((s, r) => s + Number(r.n), 0);
  const variants = link.abVariants.map((v, i) => {
    const label = v.label || `variant-${i + 1}`;
    const n = counts.get(label) ?? 0;
    return {
      label,
      url: v.url,
      weight: v.weight,
      clicks: n,
      share: total > 0 ? Math.round((n / total) * 1000) / 10 : 0,
    };
  });
  return NextResponse.json({ variants, total });
}
