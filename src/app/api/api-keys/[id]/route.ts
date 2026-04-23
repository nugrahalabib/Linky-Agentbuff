import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, ws.id))).get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  db.delete(apiKeys).where(eq(apiKeys.id, id)).run();
  return NextResponse.json({ ok: true });
}
