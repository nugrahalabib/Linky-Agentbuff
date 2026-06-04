import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { isUnsafeRequestUrl } from "@/lib/safe-browsing";

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(["link.clicked", "link.created", "link.updated", "link.deleted"])).min(1),
});

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.workspaceId, ws.id))
    .orderBy(desc(webhooks.createdAt));
  // Never return the full signing secret in a bulk list — only a preview. The owner reveals the
  // full value on demand via GET /api/webhooks/[id].
  return NextResponse.json({ webhooks: rows.map(maskWebhookSecret) });
}

export function maskWebhookSecret<T extends { secret: string }>(w: T): Omit<T, "secret"> & { secretPreview: string } {
  const { secret, ...rest } = w;
  return { ...rest, secretPreview: `${secret.slice(0, 14)}…` };
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (isUnsafeRequestUrl(parsed.data.url)) {
    return NextResponse.json({ error: "URL webhook tidak boleh menunjuk ke alamat internal/lokal." }, { status: 400 });
  }

  const id = nanoid(14);
  const secret = `whsec_${crypto.randomBytes(20).toString("base64url")}`;

  await db.insert(webhooks)
    .values({
      id,
      workspaceId: ws.id,
      url: parsed.data.url,
      secret,
      events: parsed.data.events,
      active: true,
    });

  const created = (await db.select().from(webhooks).where(eq(webhooks.id, id)))[0];
  return NextResponse.json({ webhook: created });
}
