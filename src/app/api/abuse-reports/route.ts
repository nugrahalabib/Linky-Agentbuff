import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { abuseReports, links } from "@/lib/db/schema";
import { hashIp } from "@/lib/hash";

const schema = z.object({
  slug: z.string().min(1).max(50),
  reason: z.string().min(5).max(500),
});

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const link = db
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.slug, parsed.data.slug), isNull(links.domainId)))
    .get();
  if (!link) return NextResponse.json({ error: "Link tidak ditemukan." }, { status: 404 });

  const id = nanoid(14);
  db.insert(abuseReports)
    .values({
      id,
      linkId: link.id,
      reason: parsed.data.reason,
      reporterIpHash: hashIp(getClientIp(req)),
      status: "open",
    })
    .run();
  return NextResponse.json({ ok: true, id });
}
