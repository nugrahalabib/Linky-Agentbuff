import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { encodeCsv } from "@/lib/csv";

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return new Response(JSON.stringify({ error: "UNAUTHORIZED" }), { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);

  const rows = db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, ws.id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .all();

  const data = rows.map((l) => ({
    slug: l.slug,
    destination_url: l.destinationUrl,
    title: l.title ?? "",
    description: l.description ?? "",
    click_count: l.clickCount,
    password_protected: l.passwordHash ? "yes" : "",
    expires_at: l.expiresAt ? new Date(l.expiresAt).toISOString() : "",
    click_limit: l.clickLimit ?? "",
    ios_url: l.iosUrl ?? "",
    android_url: l.androidUrl ?? "",
    utm_source: l.utmParams?.utm_source ?? "",
    utm_medium: l.utmParams?.utm_medium ?? "",
    utm_campaign: l.utmParams?.utm_campaign ?? "",
    created_at: new Date(l.createdAt).toISOString(),
  }));

  const csv = encodeCsv(data);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="linky-export-${Date.now()}.csv"`,
    },
  });
}
