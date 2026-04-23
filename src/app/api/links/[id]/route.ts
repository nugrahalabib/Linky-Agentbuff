import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { updateLinkSchema } from "@/lib/validators";
import { isValidUrl, normalizeUrl } from "@/lib/utils";

async function loadOwned(id: string) {
  const ctx = await getSessionUser();
  if (!ctx) return { err: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const;
  const workspace = await ensureWorkspace(ctx.user.id);
  const link = db.select().from(links).where(and(eq(links.id, id), eq(links.workspaceId, workspace.id))).get();
  if (!link) return { err: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) } as const;
  return { link, workspace, user: ctx.user } as const;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadOwned(id);
  if ("err" in r) return r.err;
  return NextResponse.json({ link: r.link });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadOwned(id);
  if ("err" in r) return r.err;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid." }, { status: 400 });
  }
  const data = parsed.data;

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (typeof data.destinationUrl === "string") {
    const u = normalizeUrl(data.destinationUrl);
    if (!isValidUrl(u)) return NextResponse.json({ error: "URL tujuan tidak valid." }, { status: 400 });
    patch.destinationUrl = u;
  }
  if (typeof data.title === "string") patch.title = data.title;
  if (typeof data.description === "string") patch.description = data.description;
  if (typeof data.archived === "boolean") patch.archived = data.archived;
  if (data.clearPassword) patch.passwordHash = null;
  else if (typeof data.password === "string" && data.password.length > 0) {
    patch.passwordHash = await bcrypt.hash(data.password, 10);
  }
  if (typeof data.expiresAt === "string") patch.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  if (typeof data.clickLimit === "number") patch.clickLimit = data.clickLimit || null;
  if (typeof data.iosUrl === "string") patch.iosUrl = data.iosUrl || null;
  if (typeof data.androidUrl === "string") patch.androidUrl = data.androidUrl || null;

  if (data.utmSource || data.utmMedium || data.utmCampaign || data.utmTerm || data.utmContent) {
    const utm: Record<string, string> = {};
    if (data.utmSource) utm.utm_source = data.utmSource;
    if (data.utmMedium) utm.utm_medium = data.utmMedium;
    if (data.utmCampaign) utm.utm_campaign = data.utmCampaign;
    if (data.utmTerm) utm.utm_term = data.utmTerm;
    if (data.utmContent) utm.utm_content = data.utmContent;
    patch.utmParams = utm;
  }

  db.update(links).set(patch).where(eq(links.id, id)).run();
  const updated = db.select().from(links).where(eq(links.id, id)).get();
  return NextResponse.json({ link: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await loadOwned(id);
  if ("err" in r) return r.err;
  db.delete(links).where(eq(links.id, id)).run();
  return NextResponse.json({ ok: true });
}
