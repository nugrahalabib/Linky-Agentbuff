import { NextResponse } from "next/server";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { getTopLinks } from "@/lib/analytics";

export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "30"), 1), 365);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "10"), 1), 50);
  const rows = getTopLinks(ws.id, days, limit);
  return NextResponse.json({ links: rows, count: rows.length });
}
