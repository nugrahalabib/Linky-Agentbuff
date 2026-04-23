import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  parentId: z.string().max(20).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = db.select().from(folders).where(eq(folders.workspaceId, ws.id)).all();
  return NextResponse.json({ folders: rows });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });

  if (parsed.data.parentId) {
    const parent = db
      .select({ id: folders.id })
      .from(folders)
      .where(and(eq(folders.id, parsed.data.parentId), eq(folders.workspaceId, ws.id)))
      .get();
    if (!parent) return NextResponse.json({ error: "Parent folder tidak ditemukan." }, { status: 400 });
  }

  const id = nanoid(12);
  db.insert(folders)
    .values({
      id,
      workspaceId: ws.id,
      name: parsed.data.name,
      parentId: parsed.data.parentId ?? null,
      color: parsed.data.color ?? "#94A3B8",
    })
    .run();
  const created = db.select().from(folders).where(eq(folders.id, id)).get();
  return NextResponse.json({ folder: created });
}
