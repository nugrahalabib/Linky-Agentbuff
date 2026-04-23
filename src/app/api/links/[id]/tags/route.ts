import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { links, linkTags, tags } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const setSchema = z.object({ tagIds: z.array(z.string().max(20)).max(50) });

async function loadOwned(id: string) {
  const ctx = await getSessionUser();
  if (!ctx) return { err: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const;
  const ws = await ensureWorkspace(ctx.user.id);
  const link = db.select().from(links).where(and(eq(links.id, id), eq(links.workspaceId, ws.id))).get();
  if (!link) return { err: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) } as const;
  return { link, ws } as const;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadOwned(id);
  if ("err" in r) return r.err;
  const rows = db
    .select({ id: tags.id, name: tags.name, color: tags.color })
    .from(linkTags)
    .innerJoin(tags, eq(tags.id, linkTags.tagId))
    .where(eq(linkTags.linkId, id))
    .all();
  return NextResponse.json({ tags: rows });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadOwned(id);
  if ("err" in r) return r.err;
  const body = await req.json().catch(() => null);
  const parsed = setSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  // Validate every tag belongs to the workspace
  const valid =
    parsed.data.tagIds.length === 0
      ? []
      : db
          .select({ id: tags.id })
          .from(tags)
          .where(and(eq(tags.workspaceId, r.ws.id), inArray(tags.id, parsed.data.tagIds)))
          .all()
          .map((t) => t.id);

  db.transaction(() => {
    db.delete(linkTags).where(eq(linkTags.linkId, id)).run();
    for (const tagId of valid) db.insert(linkTags).values({ linkId: id, tagId }).run();
  });
  return NextResponse.json({ tagIds: valid });
}
