import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  parentId: z.string().max(20).optional().nullable(),
});

async function owned(id: string) {
  const ctx = await getSessionUser();
  if (!ctx) return { err: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const;
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(folders).where(and(eq(folders.id, id), eq(folders.workspaceId, ws.id))).get();
  if (!row) return { err: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) } as const;
  return { row, ws } as const;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await owned(id);
  if ("err" in r) return r.err;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.color !== undefined) patch.color = parsed.data.color;
  if (parsed.data.parentId !== undefined) patch.parentId = parsed.data.parentId;
  db.update(folders).set(patch).where(eq(folders.id, id)).run();
  const updated = db.select().from(folders).where(eq(folders.id, id)).get();
  return NextResponse.json({ folder: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await owned(id);
  if ("err" in r) return r.err;
  db.delete(folders).where(eq(folders.id, id)).run();
  return NextResponse.json({ ok: true });
}
