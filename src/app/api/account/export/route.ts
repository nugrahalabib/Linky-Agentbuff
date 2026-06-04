import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clicks,
  folders,
  linkTags,
  links,
  linkyPageClicks,
  linkyPages,
  tags,
  utmRecipes,
} from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);

  const myLinks = await db.select().from(links).where(eq(links.workspaceId, ws.id));
  const linkIds = myLinks.map((l) => l.id);
  const myFolders = await db.select().from(folders).where(eq(folders.workspaceId, ws.id));
  const myTags = await db.select().from(tags).where(eq(tags.workspaceId, ws.id));
  const myLinkTags = linkIds.length
    ? await db.select().from(linkTags).where(inArray(linkTags.linkId, linkIds))
    : [];
  const myClicks = linkIds.length
    ? await db.select().from(clicks).where(inArray(clicks.linkId, linkIds))
    : [];
  const myUtm = await db.select().from(utmRecipes).where(eq(utmRecipes.workspaceId, ws.id));
  const myPages = await db.select().from(linkyPages).where(eq(linkyPages.workspaceId, ws.id));
  const pageIds = myPages.map((p) => p.id);
  const myPageClicks = pageIds.length
    ? await db.select().from(linkyPageClicks).where(inArray(linkyPageClicks.pageId, pageIds))
    : [];

  const payload = {
    exported_at: new Date().toISOString(),
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      locale: ctx.user.locale,
      created_at: ctx.user.createdAt,
    },
    workspace: { id: ws.id, slug: ws.slug, name: ws.name, created_at: ws.createdAt },
    // Strip secrets/PII even from the owner's own export: link password hashes and the anonymous
    // owner IP should never leave the system, and visitor IP hashes aren't the exporter's data.
    links: myLinks.map(({ passwordHash: _ph, anonOwnerIp: _aip, ...rest }) => rest),
    folders: myFolders,
    tags: myTags,
    link_tags: myLinkTags,
    clicks: myClicks.map(({ ipHash: _ih, ...rest }) => rest),
    utm_recipes: myUtm,
    linky_pages: myPages,
    linky_page_clicks: myPageClicks.map(({ ipHash: _ih, ...rest }) => rest),
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="linky-export-${ws.slug}-${date}.json"`,
    },
  });
}
