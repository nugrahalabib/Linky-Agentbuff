import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { createLinkSchema } from "@/lib/validators";
import { getFaviconUrl, hostOf, isValidUrl, normalizeUrl } from "@/lib/utils";
import { checkUrlSafety } from "@/lib/safe-browsing";
import { apiError, apiOk, apiOptions, readJson, withApiAuth } from "@/lib/api-helpers";
import { fireWebhooks } from "@/lib/webhooks";
import { serializeLink } from "@/lib/api-serializers";

export async function OPTIONS() {
  return apiOptions();
}

export async function GET(req: Request) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "50"), 1), 200);
  const archived = url.searchParams.get("archived") === "1";
  const rows = db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, a.auth.workspace.id), eq(links.archived, archived)))
    .orderBy(desc(links.createdAt))
    .limit(limit)
    .all();
  return apiOk(
    { data: rows.map(serializeLink), count: rows.length },
    { extraHeaders: a.auth.rateHeaders },
  );
}

export async function POST(req: Request) {
  const a = await withApiAuth(req);
  if (!a.ok) return a.res;
  const j = await readJson<unknown>(req);
  if (!j.ok) return j.res;
  const parsed = createLinkSchema.safeParse(j.data);
  if (!parsed.success) {
    return apiError("validation_error", parsed.error.issues[0]?.message ?? "Invalid input", 400, a.auth.rateHeaders);
  }
  const destinationUrl = normalizeUrl(parsed.data.destinationUrl);
  if (!isValidUrl(destinationUrl)) {
    return apiError("invalid_url", "destinationUrl invalid (harus http/https).", 400, a.auth.rateHeaders);
  }
  const safety = await checkUrlSafety(destinationUrl);
  if (safety.verdict === "malicious") {
    return apiError("unsafe_url", "URL flagged sebagai phishing/malware.", 422, a.auth.rateHeaders);
  }
  let slug = parsed.data.customSlug?.trim() || generateSlug();
  if (parsed.data.customSlug) {
    if (!isValidSlug(slug)) {
      return apiError("invalid_slug", "Slug hanya a-z 0-9 - _ (2–50 char), bukan reserved.", 400, a.auth.rateHeaders);
    }
    const exists = db
      .select({ id: links.id })
      .from(links)
      .where(and(eq(links.slug, slug), isNull(links.domainId)))
      .get();
    if (exists) return apiError("slug_taken", "Slug sudah digunakan.", 409, a.auth.rateHeaders);
  } else {
    for (let i = 0; i < 5; i++) {
      const exists = db
        .select({ id: links.id })
        .from(links)
        .where(and(eq(links.slug, slug), isNull(links.domainId)))
        .get();
      if (!exists) break;
      slug = generateSlug();
    }
  }
  const id = nanoid(14);
  const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 10) : null;
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  const clickLimit =
    typeof parsed.data.clickLimit === "number" && parsed.data.clickLimit > 0 ? parsed.data.clickLimit : null;
  const utm: Record<string, string> = {};
  if (parsed.data.utmSource) utm.utm_source = parsed.data.utmSource;
  if (parsed.data.utmMedium) utm.utm_medium = parsed.data.utmMedium;
  if (parsed.data.utmCampaign) utm.utm_campaign = parsed.data.utmCampaign;
  if (parsed.data.utmTerm) utm.utm_term = parsed.data.utmTerm;
  if (parsed.data.utmContent) utm.utm_content = parsed.data.utmContent;

  db.insert(links)
    .values({
      id,
      workspaceId: a.auth.workspace.id,
      domainId: null,
      slug,
      destinationUrl,
      title: parsed.data.title || hostOf(destinationUrl),
      description: parsed.data.description || null,
      faviconUrl: getFaviconUrl(destinationUrl),
      passwordHash,
      expiresAt,
      clickLimit,
      iosUrl: parsed.data.iosUrl || null,
      androidUrl: parsed.data.androidUrl || null,
      utmParams: Object.keys(utm).length ? utm : null,
      ogTitle: parsed.data.ogTitle || null,
      ogDescription: parsed.data.ogDescription || null,
      ogImage: parsed.data.ogImage || null,
      cloak: Boolean(parsed.data.cloak),
      folderId: parsed.data.folderId || null,
      createdBy: a.auth.key.userId,
    })
    .run();

  const created = db.select().from(links).where(eq(links.id, id)).get();
  if (created) {
    fireWebhooks(a.auth.workspace.id, "link.created", {
      link_id: created.id,
      slug: created.slug,
      destination_url: created.destinationUrl,
      title: created.title,
      created_by: created.createdBy,
    });
  }
  return apiOk({ data: created ? serializeLink(created) : null }, { status: 201, extraHeaders: a.auth.rateHeaders });
}
