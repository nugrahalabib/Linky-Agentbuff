import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/db/schema";
import { getSessionUserWithWorkspace } from "@/lib/auth";
import { canAdmin, isOwner } from "@/lib/workspace";

const patchSchema = z.object({
  role: z.enum(["admin", "editor", "viewer"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await getSessionUserWithWorkspace();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!canAdmin(ctx.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const target = db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, ctx.workspace.id), eq(workspaceMembers.userId, userId)))
    .get();
  if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (target.role === "owner") {
    return NextResponse.json({ error: "Owner role tidak bisa diubah." }, { status: 400 });
  }

  db.update(workspaceMembers)
    .set({ role: parsed.data.role })
    .where(and(eq(workspaceMembers.workspaceId, ctx.workspace.id), eq(workspaceMembers.userId, userId)))
    .run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await getSessionUserWithWorkspace();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { userId } = await params;
  // Self-leave allowed for non-owner; admin can remove others except owner
  const target = db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, ctx.workspace.id), eq(workspaceMembers.userId, userId)))
    .get();
  if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (target.role === "owner") {
    return NextResponse.json({ error: "Owner tidak bisa dihapus dari workspace." }, { status: 400 });
  }
  const isSelf = userId === ctx.user.id;
  if (!isSelf && !canAdmin(ctx.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (isOwner(ctx.role) === false && target.role === "admin" && !isSelf) {
    return NextResponse.json({ error: "Hanya owner yang bisa menghapus admin." }, { status: 403 });
  }

  db.delete(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, ctx.workspace.id), eq(workspaceMembers.userId, userId)))
    .run();
  return NextResponse.json({ ok: true });
}
