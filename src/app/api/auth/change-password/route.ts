import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const ok = await verifyPassword(parsed.data.currentPassword, ctx.user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Kata sandi saat ini salah." }, { status: 401 });

  const newHash = await hashPassword(parsed.data.newPassword);
  db.update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, ctx.user.id))
    .run();

  // Revoke all OTHER sessions (keep current logged in)
  db.delete(sessions)
    .where(and(eq(sessions.userId, ctx.user.id), ne(sessions.id, ctx.session.id)))
    .run();

  return NextResponse.json({ ok: true });
}
