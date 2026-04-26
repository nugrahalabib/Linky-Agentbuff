import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { getWorkspaceAnalytics, fillMissingDays } from "@/lib/analytics";

export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const workspace = await ensureWorkspace(ctx.user.id);
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "30"), 1), 365);
  const linkId = url.searchParams.get("linkId");

  let validLinkId: string | null = null;
  if (linkId) {
    const owned = db
      .select({ id: links.id })
      .from(links)
      .where(and(eq(links.id, linkId), eq(links.workspaceId, workspace.id)))
      .get();
    if (owned) validLinkId = linkId;
  }

  const data = getWorkspaceAnalytics(workspace.id, days, validLinkId);
  return NextResponse.json({
    ...data,
    last7Days: fillMissingDays(data.last7Days, days <= 7 ? 7 : days <= 30 ? 30 : 90),
    days,
    linkId: validLinkId,
  });
}
