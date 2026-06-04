import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  hostname: z
    .string()
    .min(3)
    .max(253)
    .regex(
      /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i,
      "Hostname tidak valid (contoh: go.brandmu.com)",
    ),
});

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = await db
    .select()
    .from(domains)
    .where(eq(domains.workspaceId, ws.id))
    .orderBy(desc(domains.createdAt));
  return NextResponse.json({ domains: rows });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const hostname = parsed.data.hostname.trim().toLowerCase();
  // hostname is globally unique (a host can only belong to one workspace).
  const existing = (await db.select({ id: domains.id }).from(domains).where(eq(domains.hostname, hostname)))[0];
  if (existing) return NextResponse.json({ error: "Domain ini sudah terdaftar." }, { status: 409 });

  const id = nanoid(14);
  const verificationToken = `linky-verify-${crypto.randomBytes(12).toString("hex")}`;
  await db.insert(domains)
    .values({ id, workspaceId: ws.id, hostname, verificationToken, verified: false });
  const created = (await db.select().from(domains).where(eq(domains.id, id)))[0];
  return NextResponse.json({ domain: created });
}
