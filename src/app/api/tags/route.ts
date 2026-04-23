import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9-_\s]+$/, "Huruf/angka/-/_/spasi saja"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = db.select().from(tags).where(eq(tags.workspaceId, ws.id)).all();
  return NextResponse.json({ tags: rows });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const existing = db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.workspaceId, ws.id), eq(tags.name, parsed.data.name)))
    .get();
  if (existing) return NextResponse.json({ error: "Tag sudah ada." }, { status: 409 });

  const id = nanoid(12);
  db.insert(tags)
    .values({
      id,
      workspaceId: ws.id,
      name: parsed.data.name,
      color: parsed.data.color ?? "#4F46E5",
    })
    .run();
  const created = db.select().from(tags).where(eq(tags.id, id)).get();
  return NextResponse.json({ tag: created });
}
