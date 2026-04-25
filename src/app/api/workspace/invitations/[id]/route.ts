import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaceInvitations } from "@/lib/db/schema";
import { getSessionUserWithWorkspace } from "@/lib/auth";
import { canAdmin } from "@/lib/workspace";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionUserWithWorkspace();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!canAdmin(ctx.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const row = db
    .select()
    .from(workspaceInvitations)
    .where(and(eq(workspaceInvitations.id, id), eq(workspaceInvitations.workspaceId, ctx.workspace.id)))
    .get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  db.delete(workspaceInvitations).where(eq(workspaceInvitations.id, id)).run();
  return NextResponse.json({ ok: true });
}
