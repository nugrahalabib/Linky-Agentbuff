import { apiError, apiOk, apiOptions, withApiAuth } from "@/lib/api-helpers";
import { getWorkspaceAnalytics } from "@/lib/analytics";

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(req: Request) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  const url = new URL(req.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? "30"), 1), 365);
  if (Number.isNaN(days)) return apiError("validation_error", "days harus angka.", 400, a.auth.rateHeaders);
  const data = getWorkspaceAnalytics(a.auth.workspace.id, days);
  return apiOk({ data: { period_days: days, ...data } }, { extraHeaders: a.auth.rateHeaders });
}
