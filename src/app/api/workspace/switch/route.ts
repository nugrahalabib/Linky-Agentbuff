import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { setActiveWorkspace } from "@/lib/workspace";

const schema = z.object({ workspaceId: z.string().min(8).max(20) });

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const ok = setActiveWorkspace(ctx.user.id, parsed.data.workspaceId);
  if (!ok) return NextResponse.json({ error: "Bukan member workspace ini." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
