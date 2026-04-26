import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { apiError, apiOk, apiOptions, withApiAuth } from "@/lib/api-helpers";
import { getLinkAnalytics } from "@/lib/analytics";

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  const { id } = await params;
  const link = db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.id, id), eq(links.workspaceId, a.auth.workspace.id)))
    .get();
  if (!link) return apiError("not_found", "Link tidak ditemukan.", 404, a.auth.rateHeaders);
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "30"), 1), 365);
  if (Number.isNaN(days)) return apiError("validation_error", "days harus angka.", 400, a.auth.rateHeaders);
  const data = getLinkAnalytics(id, days);
  return apiOk({ data: { link_id: id, period_days: days, ...data } }, { extraHeaders: a.auth.rateHeaders });
}
