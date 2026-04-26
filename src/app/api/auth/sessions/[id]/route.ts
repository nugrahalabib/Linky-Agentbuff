import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (id === ctx.session.id) {
    return NextResponse.json({ error: "Tidak bisa revoke sesi yang sedang aktif. Pakai Logout." }, { status: 400 });
  }
  const r = db
    .delete(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, ctx.user.id)))
    .run();
  if (r.changes === 0) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
