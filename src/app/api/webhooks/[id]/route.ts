import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { isUnsafeRequestUrl } from "@/lib/safe-browsing";
import { maskWebhookSecret } from "../route";

const patchSchema = z.object({
  active: z.boolean().optional(),
  events: z.array(z.enum(["link.clicked", "link.created", "link.updated", "link.deleted"])).min(1).optional(),
  url: z.string().url().optional(),
});

// Reveal the full signing secret on demand (owner-only). The list endpoint masks it; this is the
// only way to read it back after creation, so the owner can configure HMAC verification.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = (await db.select().from(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.workspaceId, ws.id))))[0];
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ secret: row.secret });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = (await db.select().from(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.workspaceId, ws.id))))[0];
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.url && isUnsafeRequestUrl(parsed.data.url)) {
    return NextResponse.json({ error: "URL webhook tidak boleh menunjuk ke alamat internal/lokal." }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.active !== undefined) patch.active = parsed.data.active;
  if (parsed.data.events) patch.events = parsed.data.events;
  if (parsed.data.url) patch.url = parsed.data.url;
  await db.update(webhooks).set(patch).where(eq(webhooks.id, id));
  const updated = (await db.select().from(webhooks).where(eq(webhooks.id, id)))[0];
  // Mask the signing secret in the PATCH response too — it should only be obtained via the explicit
  // owner-only reveal endpoint (GET), never returned incidentally on an update.
  return NextResponse.json({ webhook: maskWebhookSecret(updated) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = (await db.select().from(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.workspaceId, ws.id))))[0];
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await db.delete(webhooks).where(eq(webhooks.id, id));
  return NextResponse.json({ ok: true });
}
