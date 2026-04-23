import { NextResponse } from "next/server";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { getWorkspaceAnalytics, fillMissingDays } from "@/lib/analytics";

export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const workspace = await ensureWorkspace(ctx.user.id);
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "30"), 1), 365);
  const data = getWorkspaceAnalytics(workspace.id, days);
  return NextResponse.json({ ...data, last7Days: fillMissingDays(data.last7Days, days <= 7 ? 7 : 30) });
}
