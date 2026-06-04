import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { linkyPages, type LinkyPageBlock, type LinkyPageTheme } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { isReservedSlug } from "@/lib/slug";

const createSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/),
  title: z.string().min(1).max(80),
  bio: z.string().max(280).optional(),
});

const defaultBlocks: LinkyPageBlock[] = [
  { id: "h1", kind: "header", data: {} },
  { id: "b1", kind: "link", data: { label: "Website utama", url: "https://example.com" } },
  { id: "b2", kind: "social", data: { items: [{ platform: "instagram", handle: "@username" }] } },
];

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = await db
    .select()
    .from(linkyPages)
    .where(eq(linkyPages.workspaceId, ws.id))
    .orderBy(desc(linkyPages.createdAt));
  return NextResponse.json({ pages: rows });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  if (isReservedSlug(parsed.data.slug))
    return NextResponse.json({ error: "Slug reserved, coba yang lain." }, { status: 400 });

  const existing = (await db.select({ id: linkyPages.id }).from(linkyPages).where(eq(linkyPages.slug, parsed.data.slug)))[0];
  if (existing) return NextResponse.json({ error: "Username sudah dipakai." }, { status: 409 });

  const id = nanoid(14);
  const theme: LinkyPageTheme = { preset: "creator", primary: "#4F46E5", buttonStyle: "filled", font: "inter" };
  await db.insert(linkyPages)
    .values({
      id,
      workspaceId: ws.id,
      slug: parsed.data.slug,
      title: parsed.data.title,
      bio: parsed.data.bio ?? null,
      theme,
      blocks: defaultBlocks,
      published: true,
      createdBy: ctx.user.id,
    });
  const created = (await db.select().from(linkyPages).where(eq(linkyPages.id, id)))[0];
  return NextResponse.json({ page: created });
}
