import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { destroySession, getSessionUser } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/validators";

export async function DELETE(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  // Login is Google OAuth-only, so confirmation is typing the exact account email.
  if (parsed.data.confirmEmail.toLowerCase() !== ctx.user.email.toLowerCase()) {
    return NextResponse.json({ error: "Email konfirmasi tidak cocok." }, { status: 400 });
  }

  // FK cascades will remove sessions, workspaces, links, folders, tags, etc.
  await db.delete(users).where(eq(users.id, ctx.user.id));
  await destroySession();
  return NextResponse.json({ ok: true });
}
