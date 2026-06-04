import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import dns from "node:dns/promises";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Verifies domain ownership via a DNS TXT record at _linky-verify.<hostname> containing the token.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const row = db.select().from(domains).where(and(eq(domains.id, id), eq(domains.workspaceId, ws.id))).get();
  if (!row) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!row.verificationToken) {
    return NextResponse.json({ error: "Token verifikasi tidak ada." }, { status: 400 });
  }

  const recordName = `_linky-verify.${row.hostname}`;
  try {
    const txt = await dns.resolveTxt(recordName);
    const values = txt.flat().map((s) => s.trim());
    if (values.includes(row.verificationToken)) {
      db.update(domains)
        .set({ verified: true, sslStatus: "active", updatedAt: new Date() })
        .where(eq(domains.id, id))
        .run();
      return NextResponse.json({ ok: true, verified: true });
    }
    return NextResponse.json({
      ok: false,
      verified: false,
      error: "Record TXT ditemukan tapi nilainya belum cocok. Pastikan nilainya benar lalu tunggu propagasi DNS.",
      recordName,
      expected: row.verificationToken,
    });
  } catch {
    return NextResponse.json({
      ok: false,
      verified: false,
      error: "Record TXT belum ditemukan. Tambahkan dulu lalu tunggu propagasi DNS (bisa beberapa menit).",
      recordName,
      expected: row.verificationToken,
    });
  }
}
