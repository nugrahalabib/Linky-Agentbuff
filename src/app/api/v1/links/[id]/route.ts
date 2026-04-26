import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { updateLinkSchema } from "@/lib/validators";
import { isValidUrl, normalizeUrl } from "@/lib/utils";
import { apiError, apiOk, apiOptions, readJson, withApiAuth, type AuthedRequest } from "@/lib/api-helpers";
import { fireWebhooks } from "@/lib/webhooks";
import { serializeLink } from "@/lib/api-serializers";

export async function OPTIONS() {
  return apiOptions();
}

async function loadOwned(id: string, auth: AuthedRequest) {
  const link = db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.workspaceId, auth.workspace.id)))
    .get();
  return link ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  const { id } = await params;
  const link = await loadOwned(id, a.auth);
  if (!link) return apiError("not_found", "Link tidak ditemukan.", 404, a.auth.rateHeaders);
  return apiOk({ data: serializeLink(link) }, { extraHeaders: a.auth.rateHeaders });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  const { id } = await params;
  const link = await loadOwned(id, a.auth);
  if (!link) return apiError("not_found", "Link tidak ditemukan.", 404, a.auth.rateHeaders);
  const j = await readJson<unknown>(req);
  if (!j.ok) return j.res;
  const parsed = updateLinkSchema.safeParse(j.data);
  if (!parsed.success) {
    return apiError("validation_error", parsed.error.issues[0]?.message ?? "Invalid input", 400, a.auth.rateHeaders);
  }
  const data = parsed.data;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof data.destinationUrl === "string") {
    const u = normalizeUrl(data.destinationUrl);
    if (!isValidUrl(u)) return apiError("invalid_url", "destinationUrl invalid.", 400, a.auth.rateHeaders);
    patch.destinationUrl = u;
  }
  if (typeof data.title === "string") patch.title = data.title;
  if (typeof data.description === "string") patch.description = data.description;
  if (typeof data.archived === "boolean") patch.archived = data.archived;
  if (typeof data.cloak === "boolean") patch.cloak = data.cloak;
  if (data.folderId !== undefined) patch.folderId = data.folderId || null;
  if (data.clearPassword) patch.passwordHash = null;
  else if (typeof data.password === "string" && data.password.length > 0) {
    patch.passwordHash = await bcrypt.hash(data.password, 10);
  }
  if (typeof data.expiresAt === "string") patch.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (typeof data.clickLimit === "number") patch.clickLimit = data.clickLimit || null;
  if (typeof data.iosUrl === "string") patch.iosUrl = data.iosUrl || null;
  if (typeof data.androidUrl === "string") patch.androidUrl = data.androidUrl || null;
  if (typeof data.ogTitle === "string") patch.ogTitle = data.ogTitle || null;
  if (typeof data.ogDescription === "string") patch.ogDescription = data.ogDescription || null;
  if (typeof data.ogImage === "string") patch.ogImage = data.ogImage || null;
  if (data.utmSource || data.utmMedium || data.utmCampaign || data.utmTerm || data.utmContent) {
    const utm: Record<string, string> = {};
    if (data.utmSource) utm.utm_source = data.utmSource;
    if (data.utmMedium) utm.utm_medium = data.utmMedium;
    if (data.utmCampaign) utm.utm_campaign = data.utmCampaign;
    if (data.utmTerm) utm.utm_term = data.utmTerm;
    if (data.utmContent) utm.utm_content = data.utmContent;
    patch.utmParams = utm;
  }
  db.update(links).set(patch).where(eq(links.id, id)).run();
  const updated = db.select().from(links).where(eq(links.id, id)).get();
  if (updated) {
    fireWebhooks(a.auth.workspace.id, "link.updated", {
      link_id: updated.id,
      slug: updated.slug,
      destination_url: updated.destinationUrl,
      archived: updated.archived,
    });
  }
  return apiOk({ data: updated ? serializeLink(updated) : null }, { extraHeaders: a.auth.rateHeaders });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  const { id } = await params;
  const link = await loadOwned(id, a.auth);
  if (!link) return apiError("not_found", "Link tidak ditemukan.", 404, a.auth.rateHeaders);
  const snapshot = { link_id: link.id, slug: link.slug, destination_url: link.destinationUrl };
  db.delete(links).where(eq(links.id, id)).run();
  fireWebhooks(a.auth.workspace.id, "link.deleted", snapshot);
  return apiOk({ ok: true }, { extraHeaders: a.auth.rateHeaders });
}
