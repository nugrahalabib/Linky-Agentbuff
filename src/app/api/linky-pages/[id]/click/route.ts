import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { linkyPageClicks, linkyPages } from "@/lib/db/schema";
import { hashIp } from "@/lib/hash";
import { isBot } from "@/lib/clicks";
import { clientIpFromHeaders } from "@/lib/utils";

const schema = z.object({ blockId: z.string().max(50).optional(), view: z.boolean().optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad input" }, { status: 400 });

  const page = (await db
    .select({ id: linkyPages.id, published: linkyPages.published })
    .from(linkyPages)
    .where(eq(linkyPages.id, id)))[0];
  // No-op (don't leak existence, don't pollute clicks) for missing or unpublished/draft pages.
  if (!page || !page.published) return NextResponse.json({ ok: true });

  // Don't count crawler/preview-fetcher hits as views or clicks.
  if (isBot(req.headers.get("user-agent"))) return NextResponse.json({ ok: true });

  const ip = clientIpFromHeaders((k) => req.headers.get(k));
  await db.insert(linkyPageClicks)
    .values({
      pageId: id,
      blockId: parsed.data.blockId ?? null,
      referrer: req.headers.get("referer") ?? null,
      country: req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? null,
      ipHash: hashIp(ip),
    });

  if (parsed.data.view) {
    await db.update(linkyPages).set({ views: sql`${linkyPages.views} + 1` }).where(eq(linkyPages.id, id));
  }
  return NextResponse.json({ ok: true });
}
