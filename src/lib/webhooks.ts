import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { webhookDeliveries, webhooks } from "@/lib/db/schema";

export type WebhookEvent =
  | "link.clicked"
  | "link.created"
  | "link.updated"
  | "link.deleted";

export interface WebhookPayload {
  event: WebhookEvent;
  workspace_id: string;
  data: Record<string, unknown>;
  delivery_id: string;
  timestamp: string;
}

export function signPayload(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export function fireWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): void {
  let subscribers: Array<{ id: string; url: string; secret: string; events: unknown }>;
  try {
    const targets = db.select().from(webhooks).where(eq(webhooks.workspaceId, workspaceId)).all();
    subscribers = targets.filter(
      (w) => w.active && Array.isArray(w.events) && w.events.includes(event),
    );
  } catch {
    return;
  }
  if (subscribers.length === 0) return;

  for (const w of subscribers) {
    const deliveryId = `whd_${crypto.randomBytes(10).toString("base64url")}`;
    const payload: WebhookPayload = {
      event,
      workspace_id: workspaceId,
      data,
      delivery_id: deliveryId,
      timestamp: new Date().toISOString(),
    };
    const body = JSON.stringify(payload);
    void deliverOne(w.id, w.url, w.secret, event, deliveryId, body);
  }
}

async function deliverOne(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  deliveryId: string,
  body: string,
): Promise<void> {
  const sig = signPayload(secret, body);
  const startedAt = Date.now();
  let statusCode: number | null = null;
  let success = false;
  let errorMessage: string | null = null;
  let responseSnippet: string | null = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Linky-Webhook/1.0",
        "X-Linky-Event": event,
        "X-Linky-Signature": `sha256=${sig}`,
        "X-Linky-Delivery-Id": deliveryId,
      },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    statusCode = res.status;
    success = res.status >= 200 && res.status < 300;
    try {
      const text = await res.text();
      responseSnippet = text.slice(0, 500);
    } catch {
      /* ignore body read errors */
    }
  } catch (e) {
    errorMessage = (e as Error).message ?? "fetch failed";
  }
  const durationMs = Date.now() - startedAt;

  try {
    db.insert(webhookDeliveries)
      .values({
        id: deliveryId,
        webhookId,
        event,
        statusCode,
        success,
        durationMs,
        error: errorMessage,
        requestBody: body.slice(0, 4000),
        responseSnippet,
      })
      .run();
    db.update(webhooks)
      .set({
        lastDeliveryAt: new Date(),
        lastStatusCode: statusCode,
        failureCount: success ? 0 : sql`${webhooks.failureCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(webhooks.id, webhookId))
      .run();
    db.run(
      sql`DELETE FROM webhook_deliveries WHERE webhook_id = ${webhookId} AND id NOT IN (SELECT id FROM webhook_deliveries WHERE webhook_id = ${webhookId} ORDER BY ts DESC LIMIT 50)`,
    );
  } catch {
    /* non-fatal */
  }
}
