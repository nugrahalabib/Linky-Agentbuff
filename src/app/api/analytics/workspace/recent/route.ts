import { NextResponse } from "next/server";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { getRecentClicks } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "20"), 1), 100);
  const rows = getRecentClicks(ws.id, limit);
  return NextResponse.json({ recent: rows, count: rows.length });
}
