import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { sha256 } from "@/lib/hash";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  expiresInDays: z.number().int().min(1).max(3650).optional(),
});

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, ws.id))
    .orderBy(desc(apiKeys.createdAt))
    .all();
  return NextResponse.json({ keys: rows });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const token = `lnk_${crypto.randomBytes(24).toString("base64url")}`;
  const prefix = token.slice(0, 10);
  const keyHash = sha256(token);
  const id = nanoid(14);
  const expiresAt = parsed.data.expiresInDays
    ? new Date(Date.now() + parsed.data.expiresInDays * 86400000)
    : null;

  db.insert(apiKeys)
    .values({
      id,
      workspaceId: ws.id,
      userId: ctx.user.id,
      name: parsed.data.name,
      keyHash,
      keyPrefix: prefix,
      expiresAt,
    })
    .run();

  return NextResponse.json({ key: { id, prefix, token, name: parsed.data.name, expiresAt } });
}
