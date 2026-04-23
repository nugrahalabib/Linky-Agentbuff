import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { isValidUrl } from "@/lib/utils";

const abSchema = z.object({
  kind: z.literal("ab"),
  variants: z
    .array(
      z.object({
        url: z.string().url(),
        weight: z.number().int().min(1).max(100),
        label: z.string().max(40).optional(),
      }),
    )
    .max(4),
});

const geoSchema = z.object({
  kind: z.literal("geo"),
  rules: z
    .array(
      z.object({
        country: z.string().length(2),
        url: z.string().url(),
      }),
    )
    .max(20),
});

const clearSchema = z.object({ kind: z.literal("clear"), type: z.enum(["ab", "geo"]) });

const bodySchema = z.union([abSchema, geoSchema, clearSchema]);

async function owned(id: string) {
  const ctx = await getSessionUser();
  if (!ctx) return { err: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const;
  const ws = await ensureWorkspace(ctx.user.id);
  const link = db.select().from(links).where(and(eq(links.id, id), eq(links.workspaceId, ws.id))).get();
  if (!link) return { err: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) } as const;
  return { link, ws } as const;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await owned(id);
  if ("err" in r) return r.err;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (parsed.data.kind === "ab") {
    for (const v of parsed.data.variants) {
      if (!isValidUrl(v.url)) return NextResponse.json({ error: `URL invalid: ${v.url}` }, { status: 400 });
    }
    db.update(links)
      .set({ abVariants: parsed.data.variants, updatedAt: new Date() })
      .where(eq(links.id, id))
      .run();
  } else if (parsed.data.kind === "geo") {
    for (const v of parsed.data.rules) {
      if (!isValidUrl(v.url)) return NextResponse.json({ error: `URL invalid: ${v.url}` }, { status: 400 });
    }
    db.update(links)
      .set({ geoRules: parsed.data.rules, updatedAt: new Date() })
      .where(eq(links.id, id))
      .run();
  } else if (parsed.data.kind === "clear") {
    if (parsed.data.type === "ab") {
      db.update(links).set({ abVariants: null, updatedAt: new Date() }).where(eq(links.id, id)).run();
    } else {
      db.update(links).set({ geoRules: null, updatedAt: new Date() }).where(eq(links.id, id)).run();
    }
  }

  const updated = db.select().from(links).where(eq(links.id, id)).get();
  return NextResponse.json({ link: updated });
}
