import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { destroySession, getSessionUser, verifyPassword } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/validators";

export async function DELETE(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  if (parsed.data.confirmEmail.toLowerCase() !== ctx.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Email konfirmasi tidak cocok." }, { status: 400 });
  }
  const ok = await verifyPassword(parsed.data.password, ctx.user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Kata sandi salah." }, { status: 401 });

  // FK cascades will remove sessions, workspaces, links, folders, tags, etc.
  db.delete(users).where(eq(users.id, ctx.user.id)).run();
  await destroySession();
  return NextResponse.json({ ok: true });
}
