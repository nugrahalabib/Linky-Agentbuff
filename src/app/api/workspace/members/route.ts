import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, workspaceMembers } from "@/lib/db/schema";
import { getSessionUserWithWorkspace } from "@/lib/auth";
import { canAdmin } from "@/lib/workspace";

export async function GET() {
  const ctx = await getSessionUserWithWorkspace();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const rows = db
    .select({
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
      email: users.email,
      name: users.name,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, ctx.workspace.id))
    .all();

  return NextResponse.json({
    members: rows,
    canManage: canAdmin(ctx.role),
    currentUserId: ctx.user.id,
  });
}
