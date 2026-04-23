import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(tags).where(and(eq(tags.id, id), eq(tags.workspaceId, ws.id))).get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  db.delete(tags).where(eq(tags.id, id)).run();
  return NextResponse.json({ ok: true });
}
