import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { linkyPages } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  bio: z.string().max(280).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable().or(z.literal("")),
  theme: z.record(z.string(), z.unknown()).optional(),
  background: z.string().optional().nullable(),
  blocks: z.array(z.object({ id: z.string(), kind: z.string(), data: z.record(z.string(), z.unknown()) })).optional(),
  published: z.boolean().optional(),
});

async function owned(id: string) {
  const ctx = await getSessionUser();
  if (!ctx) return { err: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const;
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(linkyPages).where(and(eq(linkyPages.id, id), eq(linkyPages.workspaceId, ws.id))).get();
  if (!row) return { err: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) } as const;
  return { row } as const;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await owned(id);
  if ("err" in r) return r.err;
  return NextResponse.json({ page: r.row });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await owned(id);
  if ("err" in r) return r.err;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.bio !== undefined) patch.bio = parsed.data.bio || null;
  if (parsed.data.avatarUrl !== undefined) patch.avatarUrl = parsed.data.avatarUrl || null;
  if (parsed.data.theme !== undefined) patch.theme = parsed.data.theme;
  if (parsed.data.background !== undefined) patch.background = parsed.data.background || null;
  if (parsed.data.blocks !== undefined) patch.blocks = parsed.data.blocks;
  if (parsed.data.published !== undefined) patch.published = parsed.data.published;

  db.update(linkyPages).set(patch).where(eq(linkyPages.id, id)).run();
  const updated = db.select().from(linkyPages).where(eq(linkyPages.id, id)).get();
  return NextResponse.json({ page: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await owned(id);
  if ("err" in r) return r.err;
  db.delete(linkyPages).where(eq(linkyPages.id, id)).run();
  return NextResponse.json({ ok: true });
}
