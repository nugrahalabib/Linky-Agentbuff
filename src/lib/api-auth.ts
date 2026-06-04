import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys, workspaces } from "@/lib/db/schema";
import { sha256 } from "@/lib/hash";

export async function authenticateApiKey(req: Request) {
  const hdr = req.headers.get("authorization") ?? "";
  const m = hdr.match(/^Bearer\s+(lnk_[A-Za-z0-9_-]{20,})$/);
  if (!m) return null;
  const token = m[1];
  const hash = sha256(token);
  const key = (await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, hash),
        or(isNull(apiKeys.expiresAt), gt(apiKeys.expiresAt, new Date())),
      ),
    ))[0];
  if (!key) return null;
  const ws = (await db.select().from(workspaces).where(eq(workspaces.id, key.workspaceId)))[0];
  if (!ws) return null;
  // Update last-used asynchronously
  try {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, key.id));
  } catch {
    /* non-fatal */
  }
  return { key, workspace: ws };
}
