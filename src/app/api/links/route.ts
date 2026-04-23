import { NextResponse } from "next/server";
import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { createLinkSchema } from "@/lib/validators";
import { getFaviconUrl, hostOf, isValidUrl, normalizeUrl } from "@/lib/utils";

export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const workspace = await ensureWorkspace(ctx.user.id);
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  const whereClause = q
    ? and(
        eq(links.workspaceId, workspace.id),
        eq(links.archived, false),
        or(like(links.slug, `%${q}%`), like(links.destinationUrl, `%${q}%`), like(links.title, `%${q}%`)),
      )
    : and(eq(links.workspaceId, workspace.id), eq(links.archived, false));

  const rows = db.select().from(links).where(whereClause).orderBy(desc(links.createdAt)).limit(limit).all();
  return NextResponse.json({ links: rows });
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
      createdBy: ctx.user.id,
    })
    .run();

  const created = db.select().from(links).where(eq(links.id, id)).get();
  return NextResponse.json({ link: created });
}
