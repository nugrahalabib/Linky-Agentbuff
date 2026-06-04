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

export async function fireWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  let subscribers: Array<{ id: string; url: string; secret: string; events: unknown }>;
  try {
    const targets = await db.select().from(webhooks).where(eq(webhooks.workspaceId, workspaceId));
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
    void deliverOne(w.id, w.url, w.secret, event, deliveryId, body, 1);
  }
}

// Exponential backoff between attempts: 1m → 5m → 30m. MAX_ATTEMPTS=4 (initial + 3 retries).
// In-process scheduler (setTimeout): retries survive while the Node process stays up; a restart
// drops pending retries — acceptable for the current single-process deploy. A persistent queue
// (Redis Streams / a jobs table) would be the next step for at-least-once durability.
const RETRY_BACKOFF_MS = [60_000, 300_000, 1_800_000];
const MAX_ATTEMPTS = 4;

function isRetryable(statusCode: number | null): boolean {
  // network error/timeout (null), server errors, or rate-limited — but never 2xx/4xx (except 429).
  if (statusCode === null) return true;
  if (statusCode === 429) return true;
  return statusCode >= 500;
}

async function deliverOne(
  webhookId: string,
  url: string,
  secret: string,
  event: WebhookEvent,
  deliveryId: string,
  body: string,
  attempt: number,
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
        "X-Linky-Delivery-Attempt": String(attempt),
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
  const willRetry = !success && isRetryable(statusCode) && attempt < MAX_ATTEMPTS;

  try {
    await db.insert(webhookDeliveries)
      .values({
        // Stable delivery_id in the payload (for receiver dedup); unique row id per attempt.
        id: attempt === 1 ? deliveryId : `${deliveryId}.${attempt}`,
        webhookId,
        event,
        statusCode,
        success,
        durationMs,
        error: willRetry
          ? `${errorMessage ?? `HTTP ${statusCode}`} — retry ${attempt}/${MAX_ATTEMPTS - 1} dijadwalkan`
          : errorMessage,
        requestBody: body.slice(0, 4000),
        responseSnippet,
      });
    await db.update(webhooks)
      .set({
        lastDeliveryAt: new Date(),
        lastStatusCode: statusCode,
        // Only settle failureCount when we're done retrying (success resets, final failure increments).
        failureCount: success
          ? 0
          : willRetry
            ? sql`${webhooks.failureCount}`
            : sql`${webhooks.failureCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(webhooks.id, webhookId));
    await db.execute(
      sql`DELETE FROM webhook_deliveries WHERE webhook_id = ${webhookId} AND id NOT IN (SELECT id FROM webhook_deliveries WHERE webhook_id = ${webhookId} ORDER BY ts DESC LIMIT 50)`,
    );
  } catch {
    /* non-fatal */
  }

  if (willRetry) {
    const delay = RETRY_BACKOFF_MS[attempt - 1] ?? 1_800_000;
    const timer = setTimeout(() => {
      void deliverOne(webhookId, url, secret, event, deliveryId, body, attempt + 1);
    }, delay);
    // Don't keep the event loop alive solely for a pending retry.
    if (typeof timer.unref === "function") timer.unref();
  }
}
