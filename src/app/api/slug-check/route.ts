import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { isValidSlug } from "@/lib/slug";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") ?? "").trim();
  if (!slug) return NextResponse.json({ available: false, reason: "empty" });
  if (!isValidSlug(slug)) return NextResponse.json({ available: false, reason: "invalid" });
  const exists = db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.slug, slug), isNull(links.domainId)))
    .get();
  return NextResponse.json({ available: !exists, reason: exists ? "taken" : "ok" });
}
