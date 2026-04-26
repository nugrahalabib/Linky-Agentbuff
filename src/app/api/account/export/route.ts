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

  const myLinks = db.select().from(links).where(eq(links.workspaceId, ws.id)).all();
  const linkIds = myLinks.map((l) => l.id);
  const myFolders = db.select().from(folders).where(eq(folders.workspaceId, ws.id)).all();
  const myTags = db.select().from(tags).where(eq(tags.workspaceId, ws.id)).all();
  const myLinkTags = linkIds.length
    ? db.select().from(linkTags).where(inArray(linkTags.linkId, linkIds)).all()
    : [];
  const myClicks = linkIds.length
    ? db.select().from(clicks).where(inArray(clicks.linkId, linkIds)).all()
    : [];
  const myUtm = db.select().from(utmRecipes).where(eq(utmRecipes.workspaceId, ws.id)).all();
  const myPages = db.select().from(linkyPages).where(eq(linkyPages.workspaceId, ws.id)).all();
  const pageIds = myPages.map((p) => p.id);
  const myPageClicks = pageIds.length
    ? db.select().from(linkyPageClicks).where(inArray(linkyPageClicks.pageId, pageIds)).all()
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
    links: myLinks,
    folders: myFolders,
    tags: myTags,
    link_tags: myLinkTags,
    clicks: myClicks,
    utm_recipes: myUtm,
    linky_pages: myPages,
    linky_page_clicks: myPageClicks,
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
