import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { linkyPageClicks, linkyPages } from "@/lib/db/schema";
import { hashIp } from "@/lib/hash";

const schema = z.object({ blockId: z.string().max(50).optional(), view: z.boolean().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad input" }, { status: 400 });

  const exists = db.select({ id: linkyPages.id }).from(linkyPages).where(eq(linkyPages.id, id)).get();
  if (!exists) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  db.insert(linkyPageClicks)
    .values({
      pageId: id,
      blockId: parsed.data.blockId ?? null,
      referrer: req.headers.get("referer") ?? null,
      country: req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? null,
      ipHash: hashIp(ip),
    })
    .run();

  if (parsed.data.view) {
    db.update(linkyPages).set({ views: sql`${linkyPages.views} + 1` }).where(eq(linkyPages.id, id)).run();
  }
  return NextResponse.json({ ok: true });
}
