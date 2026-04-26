import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookDeliveries, webhooks } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const hook = db
    .select({ id: webhooks.id })
    .from(webhooks)
    .where(and(eq(webhooks.id, id), eq(webhooks.workspaceId, ws.id)))
    .get();
  if (!hook) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const rows = db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.webhookId, id))
    .orderBy(desc(webhookDeliveries.ts))
    .limit(50)
    .all();
  return NextResponse.json({ deliveries: rows });
}
