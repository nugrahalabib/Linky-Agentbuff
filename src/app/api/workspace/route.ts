import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getUserWorkspaces, setActiveWorkspace } from "@/lib/workspace";

const createSchema = z.object({ name: z.string().min(1).max(80) });

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const rows = getUserWorkspaces(ctx.user.id);
  return NextResponse.json({
    workspaces: rows.map((r) => ({ ...r.workspace, role: r.role })),
    activeWorkspaceId: ctx.user.activeWorkspaceId,
  });
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const id = nanoid(12);
  const slug = `${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(6).toLowerCase()}`;
  db.insert(workspaces).values({ id, slug, name: parsed.data.name, ownerId: ctx.user.id, plan: "free" }).run();
  db.insert(workspaceMembers).values({ workspaceId: id, userId: ctx.user.id, role: "owner" }).run();
  setActiveWorkspace(ctx.user.id, id);
  return NextResponse.json({ workspace: { id, slug, name: parsed.data.name, role: "owner" } });
}
