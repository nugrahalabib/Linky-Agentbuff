import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { authenticateApiKey } from "@/lib/api-auth";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { createLinkSchema } from "@/lib/validators";
import { getFaviconUrl, hostOf, isValidUrl, normalizeUrl } from "@/lib/utils";

export async function GET(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
  const rows = db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, auth.workspace.id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .limit(limit)
    .all();
  return NextResponse.json({ data: rows, count: rows.length });
}

export async function POST(req: Request) {
  const auth = await authenticateApiKey(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const destinationUrl = normalizeUrl(parsed.data.destinationUrl);
  if (!isValidUrl(destinationUrl)) return NextResponse.json({ error: "Destination URL invalid" }, { status: 400 });

  let slug = parsed.data.customSlug?.trim() || generateSlug();
  if (parsed.data.customSlug) {
    if (!isValidSlug(slug)) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    const exists = db
      .select({ id: links.id })
      .from(links)
      .where(and(eq(links.slug, slug), isNull(links.domainId)))
      .get();
    if (exists) return NextResponse.json({ error: "Slug taken" }, { status: 409 });
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

  db.insert(links)
    .values({
      id,
      workspaceId: auth.workspace.id,
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
      createdBy: auth.key.userId,
    })
    .run();

  const created = db.select().from(links).where(eq(links.id, id)).get();
  return NextResponse.json({ data: created }, { status: 201 });
}
