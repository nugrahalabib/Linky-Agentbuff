import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { abuseReports, links } from "@/lib/db/schema";
import { hashIp } from "@/lib/hash";
import { clientIpFromHeaders } from "@/lib/utils";
import { rateLimitCheck } from "@/lib/api-helpers";

const schema = z.object({
  slug: z.string().min(1).max(50),
  reason: z.string().min(5).max(500),
});

export async function POST(req: Request) {
  const ip = clientIpFromHeaders((k) => req.headers.get(k));
  // Public, unauthenticated — cap to stop report-spam flooding the moderation queue.
  const rl = rateLimitCheck(`abuse-report:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Terlalu banyak laporan. Coba lagi sebentar." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const link = (await db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.slug, parsed.data.slug), isNull(links.domainId))))[0];
  if (!link) return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });

  const id = nanoid(14);
  await db.insert(abuseReports)
    .values({
      id,
      linkId: link.id,
      reason: parsed.data.reason,
      reporterIpHash: hashIp(ip),
      status: "open",
    });
  return NextResponse.json({ ok: true, id });
}
