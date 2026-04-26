import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { fireWebhooks } from "@/lib/webhooks";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const hook = db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.id, id), eq(webhooks.workspaceId, ws.id)))
    .get();
  if (!hook) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  fireWebhooks(ws.id, "link.clicked", {
    test: true,
    link_id: "test_link_id",
    slug: "test",
    destination_url: "https://example.com",
    note: "Ini adalah test event dari dashboard Linky.",
    ts: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, message: "Test event dikirim. Cek tab 'Pengiriman' beberapa detik lagi." });
}
