import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9-_\s]+$/, "Huruf/angka/-/_/spasi saja")
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(tags).where(and(eq(tags.id, id), eq(tags.workspaceId, ws.id))).get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.name && parsed.data.name !== row.name) {
    const dup = db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.workspaceId, ws.id), eq(tags.name, parsed.data.name)))
      .get();
    if (dup) return NextResponse.json({ error: "Tag sudah ada." }, { status: 409 });
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.color !== undefined) patch.color = parsed.data.color;
  db.update(tags).set(patch).where(eq(tags.id, id)).run();
  const updated = db.select().from(tags).where(eq(tags.id, id)).get();
  return NextResponse.json({ tag: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(tags).where(and(eq(tags.id, id), eq(tags.workspaceId, ws.id))).get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  db.delete(tags).where(eq(tags.id, id)).run();
  return NextResponse.json({ ok: true });
}
