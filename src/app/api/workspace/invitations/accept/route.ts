import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { workspaceInvitations, workspaceMembers, users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { setActiveWorkspace } from "@/lib/workspace";

const schema = z.object({ token: z.string().min(20).max(80) });

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  const invite = db
    .select()
    .from(workspaceInvitations)
    .where(and(eq(workspaceInvitations.token, parsed.data.token), isNull(workspaceInvitations.acceptedAt)))
    .get();
  if (!invite) return NextResponse.json({ error: "Undangan tidak ditemukan atau sudah diterima." }, { status: 404 });
  if (invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Undangan kadaluarsa." }, { status: 410 });
  }
  if (invite.email.toLowerCase() !== ctx.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Undangan ini untuk email lain." }, { status: 403 });
  }

  const already = db
    .select()
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, invite.workspaceId), eq(workspaceMembers.userId, ctx.user.id)),
    )
    .get();
  if (!already) {
    db.insert(workspaceMembers)
      .values({ workspaceId: invite.workspaceId, userId: ctx.user.id, role: invite.role })
      .run();
  }
  db.update(workspaceInvitations)
    .set({ acceptedAt: new Date(), acceptedBy: ctx.user.id })
    .where(eq(workspaceInvitations.id, invite.id))
    .run();

  setActiveWorkspace(ctx.user.id, invite.workspaceId);
  // Touch user updatedAt
  db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, ctx.user.id)).run();

  return NextResponse.json({ ok: true, workspaceId: invite.workspaceId });
}
