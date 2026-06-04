import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { utmRecipes } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = (await db
    .select()
    .from(utmRecipes)
    .where(and(eq(utmRecipes.id, id), eq(utmRecipes.workspaceId, ws.id))))[0];
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.name && parsed.data.name !== row.name) {
    const dup = (await db
      .select({ id: utmRecipes.id })
      .from(utmRecipes)
      .where(and(eq(utmRecipes.workspaceId, ws.id), eq(utmRecipes.name, parsed.data.name))))[0];
    if (dup) return NextResponse.json({ error: "Nama recipe sudah dipakai." }, { status: 409 });
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.utmSource !== undefined) patch.utmSource = parsed.data.utmSource || null;
  if (parsed.data.utmMedium !== undefined) patch.utmMedium = parsed.data.utmMedium || null;
  if (parsed.data.utmCampaign !== undefined) patch.utmCampaign = parsed.data.utmCampaign || null;
  if (parsed.data.utmTerm !== undefined) patch.utmTerm = parsed.data.utmTerm || null;
  if (parsed.data.utmContent !== undefined) patch.utmContent = parsed.data.utmContent || null;
  await db.update(utmRecipes).set(patch).where(eq(utmRecipes.id, id));
  const updated = (await db.select().from(utmRecipes).where(eq(utmRecipes.id, id)))[0];
  return NextResponse.json({ recipe: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = (await db
    .select()
    .from(utmRecipes)
    .where(and(eq(utmRecipes.id, id), eq(utmRecipes.workspaceId, ws.id))))[0];
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await db.delete(utmRecipes).where(eq(utmRecipes.id, id));
  return NextResponse.json({ ok: true });
}
