import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { utmRecipes } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(80),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
});

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const rows = db.select().from(utmRecipes).where(eq(utmRecipes.workspaceId, ws.id)).all();
  return NextResponse.json({ recipes: rows });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const existing = db
    .select({ id: utmRecipes.id })
    .from(utmRecipes)
    .where(and(eq(utmRecipes.workspaceId, ws.id), eq(utmRecipes.name, parsed.data.name)))
    .get();
  if (existing) return NextResponse.json({ error: "Nama recipe sudah dipakai." }, { status: 409 });

  const id = nanoid(12);
  db.insert(utmRecipes)
    .values({
      id,
      workspaceId: ws.id,
      name: parsed.data.name,
      utmSource: parsed.data.utmSource ?? null,
      utmMedium: parsed.data.utmMedium ?? null,
      utmCampaign: parsed.data.utmCampaign ?? null,
      utmTerm: parsed.data.utmTerm ?? null,
      utmContent: parsed.data.utmContent ?? null,
      createdBy: ctx.user.id,
    })
    .run();
  const created = db.select().from(utmRecipes).where(eq(utmRecipes.id, id)).get();
  return NextResponse.json({ recipe: created });
}
