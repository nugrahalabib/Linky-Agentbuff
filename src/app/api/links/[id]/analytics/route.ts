import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { getLinkAnalytics, fillMissingDays } from "@/lib/analytics";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const workspace = await ensureWorkspace(ctx.user.id);
  const owned = db.select().from(links).where(and(eq(links.id, id), eq(links.workspaceId, workspace.id))).get();
  if (!owned) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "30"), 1), 365);
  const data = getLinkAnalytics(id, days);
  return NextResponse.json({ ...data, last7Days: fillMissingDays(data.last7Days, 7) });
}
