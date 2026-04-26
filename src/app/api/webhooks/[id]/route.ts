import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const patchSchema = z.object({
  active: z.boolean().optional(),
  events: z.array(z.enum(["link.clicked", "link.created", "link.updated", "link.deleted"])).min(1).optional(),
  url: z.string().url().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.workspaceId, ws.id))).get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.active !== undefined) patch.active = parsed.data.active;
  if (parsed.data.events) patch.events = parsed.data.events;
  if (parsed.data.url) patch.url = parsed.data.url;
  db.update(webhooks).set(patch).where(eq(webhooks.id, id)).run();
  const updated = db.select().from(webhooks).where(eq(webhooks.id, id)).get();
  return NextResponse.json({ webhook: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.workspaceId, ws.id))).get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  db.delete(webhooks).where(eq(webhooks.id, id)).run();
  return NextResponse.json({ ok: true });
}
