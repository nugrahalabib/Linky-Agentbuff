import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { getSessionUser, ensureWorkspace } from "@/lib/auth";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { shortenAnonSchema } from "@/lib/validators";
import { getFaviconUrl, hostOf, isValidUrl, normalizeUrl } from "@/lib/utils";

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) {
    return NextResponse.json(
      { error: "Silakan masuk dulu untuk membuat link." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  const parsed = shortenAnonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }

  const destinationUrl = normalizeUrl(parsed.data.destinationUrl);
  if (!isValidUrl(destinationUrl)) {
    return NextResponse.json({ error: "URL tujuan tidak valid." }, { status: 400 });
  }

  const workspace = await ensureWorkspace(ctx.user.id);

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
    if (exists) return NextResponse.json({ error: "Slug sudah digunakan. Coba yang lain." }, { status: 409 });
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
  const host = hostOf(destinationUrl);

  db.insert(links)
    .values({
      id,
      workspaceId: workspace.id,
      domainId: null,
      slug,
      destinationUrl,
      title: host || null,
      faviconUrl: getFaviconUrl(destinationUrl),
      isAnonymous: false,
      anonOwnerIp: null,
      createdBy: ctx.user.id,
    })
    .run();

  return NextResponse.json({ id, slug });
}
