import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const schema = z.object({
  ids: z.array(z.string().max(20)).min(1).max(1000),
  action: z.enum(["archive", "unarchive", "delete", "move_folder", "set_folder_null"]),
  folderId: z.string().max(20).optional(),
});

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  // Ensure all ids belong to workspace
  const owned = db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.workspaceId, ws.id), inArray(links.id, parsed.data.ids)))
    .all()
    .map((r) => r.id);
  if (owned.length === 0) return NextResponse.json({ affected: 0 });

  if (parsed.data.action === "delete") {
    db.delete(links).where(inArray(links.id, owned)).run();
  } else if (parsed.data.action === "archive") {
    db.update(links).set({ archived: true, updatedAt: new Date() }).where(inArray(links.id, owned)).run();
  } else if (parsed.data.action === "unarchive") {
    db.update(links).set({ archived: false, updatedAt: new Date() }).where(inArray(links.id, owned)).run();
  } else if (parsed.data.action === "set_folder_null") {
    db.update(links).set({ folderId: null, updatedAt: new Date() }).where(inArray(links.id, owned)).run();
  } else if (parsed.data.action === "move_folder") {
    if (!parsed.data.folderId) return NextResponse.json({ error: "folderId wajib." }, { status: 400 });
    db.update(links)
      .set({ folderId: parsed.data.folderId, updatedAt: new Date() })
      .where(inArray(links.id, owned))
      .run();
  }
  return NextResponse.json({ affected: owned.length });
}
