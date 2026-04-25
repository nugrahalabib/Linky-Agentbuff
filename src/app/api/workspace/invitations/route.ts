import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, workspaceInvitations, workspaceMembers } from "@/lib/db/schema";
import { getSessionUserWithWorkspace } from "@/lib/auth";
import { canAdmin } from "@/lib/workspace";

const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

export async function GET() {
  const ctx = await getSessionUserWithWorkspace();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const rows = db
    .select()
    .from(workspaceInvitations)
    .where(and(eq(workspaceInvitations.workspaceId, ctx.workspace.id), isNull(workspaceInvitations.acceptedAt)))
    .orderBy(desc(workspaceInvitations.createdAt))
    .all();
  return NextResponse.json({ invitations: rows, canManage: canAdmin(ctx.role) });
}

export async function POST(req: Request) {
  const ctx = await getSessionUserWithWorkspace();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!canAdmin(ctx.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const email = parsed.data.email.toLowerCase();

  // Already a member?
  const existingUser = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
  if (existingUser) {
    const already = db
      .select()
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, ctx.workspace.id), eq(workspaceMembers.userId, existingUser.id)),
      )
      .get();
    if (already) return NextResponse.json({ error: "Sudah jadi anggota workspace ini." }, { status: 409 });
  }

  const id = nanoid(14);
  const token = `winv_${crypto.randomBytes(20).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  db.insert(workspaceInvitations)
    .values({
      id,
      workspaceId: ctx.workspace.id,
      email,
      role: parsed.data.role,
      token,
      invitedBy: ctx.user.id,
      expiresAt,
    })
    .run();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
  const inviteUrl = `${appUrl}/invite/${token}`;
  return NextResponse.json({ id, token, inviteUrl, email, role: parsed.data.role, expiresAt });
}
