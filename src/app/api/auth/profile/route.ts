import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validators";

export async function PATCH(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) patch.name = parsed.data.name?.trim() || null;
  if (parsed.data.locale !== undefined) patch.locale = parsed.data.locale;
  db.update(users).set(patch).where(eq(users.id, ctx.user.id)).run();
  const updated = db
    .select({ id: users.id, email: users.email, name: users.name, locale: users.locale })
    .from(users)
    .where(eq(users.id, ctx.user.id))
    .get();
  return NextResponse.json({ user: updated });
}
