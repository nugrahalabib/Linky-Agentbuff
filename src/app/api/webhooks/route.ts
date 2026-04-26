import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(["link.clicked", "link.created", "link.updated", "link.deleted"])).min(1),
});

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = db
    .select()
    .from(webhooks)
    .where(eq(webhooks.workspaceId, ws.id))
    .orderBy(desc(webhooks.createdAt))
    .all();
  return NextResponse.json({ webhooks: rows });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const id = nanoid(14);
  const secret = `whsec_${crypto.randomBytes(20).toString("base64url")}`;

  db.insert(webhooks)
    .values({
      id,
      workspaceId: ws.id,
      url: parsed.data.url,
      secret,
      events: parsed.data.events,
      active: true,
    })
    .run();

  const created = db.select().from(webhooks).where(eq(webhooks.id, id)).get();
  return NextResponse.json({ webhook: created });
}
