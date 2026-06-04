import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { updateWorkspaceSchema } from "@/lib/validators";

export async function PATCH(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = updateWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name) patch.name = parsed.data.name.trim();
  if (parsed.data.slug) {
    const slug = parsed.data.slug.toLowerCase();
    const exists = (await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.slug, slug), ne(workspaces.id, ws.id))))[0];
    if (exists) return NextResponse.json({ error: "Slug workspace sudah dipakai." }, { status: 409 });
    patch.slug = slug;
  }
  await db.update(workspaces).set(patch).where(eq(workspaces.id, ws.id));
  const updated = (await db.select().from(workspaces).where(eq(workspaces.id, ws.id)))[0];
  return NextResponse.json({ workspace: updated });
}
