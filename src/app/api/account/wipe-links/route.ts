import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";

const schema = z.object({ confirm: z.string() });

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success || parsed.data.confirm !== ws.name) {
    return NextResponse.json(
      { error: `Konfirmasi tidak cocok. Ketik nama workspace persis: "${ws.name}".` },
      { status: 400 },
    );
  }
  // FK ON DELETE CASCADE will clean clicks, link_tags, qr_codes
  const r = db.delete(links).where(eq(links.workspaceId, ws.id)).run();
  return NextResponse.json({ ok: true, deleted: r.changes });
}
