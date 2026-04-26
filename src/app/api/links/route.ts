import { NextResponse } from "next/server";
import { and, desc, eq, gte, inArray, isNull, like, lte, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { folders as foldersTable, links, linkTags, tags as tagsTable } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { createLinkSchema } from "@/lib/validators";
import { getFaviconUrl, hostOf, isValidUrl, normalizeUrl } from "@/lib/utils";
import { checkUrlSafety } from "@/lib/safe-browsing";
import { fireWebhooks } from "@/lib/webhooks";

export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const workspace = await ensureWorkspace(ctx.user.id);
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const folderId = url.searchParams.get("folder") ?? null;
  const tagIdsRaw = url.searchParams.get("tags");
  const tagIds = tagIdsRaw ? tagIdsRaw.split(",").filter(Boolean) : [];
  const archived = url.searchParams.get("archived") === "1";
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100"), 500);

  const conditions = [eq(links.workspaceId, workspace.id), eq(links.archived, archived)];
  if (q) {
    conditions.push(
      or(
        like(sql`lower(${links.slug})`, `%${q}%`),
        like(sql`lower(${links.destinationUrl})`, `%${q}%`),
        like(sql`lower(${links.title})`, `%${q}%`),
      )!,
    );
  }
  if (folderId === "_null") conditions.push(isNull(links.folderId));
  else if (folderId) conditions.push(eq(links.folderId, folderId));
  if (fromRaw) {
    const d = new Date(fromRaw);
    if (!isNaN(d.getTime())) conditions.push(gte(links.createdAt, d));
  }
  if (toRaw) {
    const d = new Date(toRaw);
    if (!isNaN(d.getTime())) conditions.push(lte(links.createdAt, d));
  }

  let rows = db
    .select()
    .from(links)
    .where(and(...conditions))
    .orderBy(desc(links.createdAt))
    .limit(limit)
    .all();

  // Tag filter (post-query for simplicity; good enough for per-workspace volumes)
  if (tagIds.length > 0) {
    const tagged = db
      .select({ linkId: linkTags.linkId })
      .from(linkTags)
      .where(inArray(linkTags.tagId, tagIds))
      .all()
      .map((r) => r.linkId);
    const set = new Set(tagged);
    rows = rows.filter((l) => set.has(l.id));
  }

  // Attach tags
  const ids = rows.map((l) => l.id);
  const tagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
  if (ids.length > 0) {
    const tagRows = db
      .select({ linkId: linkTags.linkId, id: tagsTable.id, name: tagsTable.name, color: tagsTable.color })
      .from(linkTags)
      .innerJoin(tagsTable, eq(tagsTable.id, linkTags.tagId))
      .where(inArray(linkTags.linkId, ids))
      .all();
    for (const t of tagRows) {
      const arr = tagMap.get(t.linkId) ?? [];
      arr.push({ id: t.id, name: t.name, color: t.color });
      tagMap.set(t.linkId, arr);
    }
  }
  // Attach folder
  const folderIds = Array.from(new Set(rows.map((l) => l.folderId).filter(Boolean) as string[]));
  const folderMap = new Map<string, { id: string; name: string; color: string }>();
  if (folderIds.length > 0) {
    const folderRows = db
      .select({ id: foldersTable.id, name: foldersTable.name, color: foldersTable.color })
      .from(foldersTable)
      .where(inArray(foldersTable.id, folderIds))
      .all();
    for (const f of folderRows) folderMap.set(f.id, f);
  }
  const enriched = rows.map((l) => ({
    ...l,
    tags: tagMap.get(l.id) ?? [],
    folder: l.folderId ? folderMap.get(l.folderId) ?? null : null,
  }));
  return NextResponse.json({ links: enriched, count: enriched.length });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const workspace = await ensureWorkspace(ctx.user.id);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
  }

  const destinationUrl = normalizeUrl(parsed.data.destinationUrl);
  if (!isValidUrl(destinationUrl)) return NextResponse.json({ error: "URL tujuan tidak valid." }, { status: 400 });

  const safety = await checkUrlSafety(destinationUrl);
  if (safety.verdict === "malicious") {
    return NextResponse.json(
      { error: "URL terdeteksi berbahaya (phishing/malware).", threats: safety.threatTypes },
      { status: 422 },
    );
  }

  let slug = parsed.data.customSlug?.trim() || generateSlug();
  if (parsed.data.customSlug) {
    if (!isValidSlug(slug)) {
      return NextResponse.json(
        { error: "Slug hanya boleh huruf/angka/-/_ (2–50 karakter), bukan kata reserved." },
        { status: 400 },
      );
    }
    const exists = db
      .select({ id: links.id })
      .from(links)
      .where(and(eq(links.slug, slug), isNull(links.domainId)))
      .get();
    if (exists) return NextResponse.json({ error: "Slug sudah digunakan." }, { status: 409 });
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

  const utmParams: Record<string, string> = {};
  if (parsed.data.utmSource) utmParams.utm_source = parsed.data.utmSource;
  if (parsed.data.utmMedium) utmParams.utm_medium = parsed.data.utmMedium;
  if (parsed.data.utmCampaign) utmParams.utm_campaign = parsed.data.utmCampaign;
  if (parsed.data.utmTerm) utmParams.utm_term = parsed.data.utmTerm;
  if (parsed.data.utmContent) utmParams.utm_content = parsed.data.utmContent;

  db.insert(links)
    .values({
      id,
      workspaceId: workspace.id,
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
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : null,
      ogTitle: parsed.data.ogTitle || null,
      ogDescription: parsed.data.ogDescription || null,
      ogImage: parsed.data.ogImage || null,
      cloak: Boolean(parsed.data.cloak),
      folderId: parsed.data.folderId || null,
      createdBy: ctx.user.id,
    })
    .run();

  const created = db.select().from(links).where(eq(links.id, id)).get();

  // Assign tags if passed
  if (parsed.data.tagIds && parsed.data.tagIds.length > 0) {
    const valid = db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(and(eq(tagsTable.workspaceId, workspace.id), inArray(tagsTable.id, parsed.data.tagIds)))
      .all()
      .map((t) => t.id);
    for (const tagId of valid) db.insert(linkTags).values({ linkId: id, tagId }).run();
  }

  if (created) {
    fireWebhooks(workspace.id, "link.created", {
      link_id: created.id,
      slug: created.slug,
      destination_url: created.destinationUrl,
      title: created.title,
      created_by: created.createdBy,
    });
  }

  return NextResponse.json({ link: created });
}
