import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";

export async function POST() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const r = db
    .delete(sessions)
    .where(and(eq(sessions.userId, ctx.user.id), ne(sessions.id, ctx.session.id)))
    .run();
  return NextResponse.json({ ok: true, revoked: r.changes });
}
