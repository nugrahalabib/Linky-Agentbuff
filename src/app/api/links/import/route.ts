import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { getFaviconUrl, hostOf, isValidUrl, normalizeUrl } from "@/lib/utils";

const MAX_ROWS = 10_000;

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);

  const body = await req.json().catch(() => null as { csv?: string; commit?: boolean } | null);
  const csv = body?.csv ?? "";
  const commit = Boolean(body?.commit);
  if (!csv.trim()) return NextResponse.json({ error: "CSV kosong." }, { status: 400 });

  const { headers, rows } = parseCsv(csv);
  if (rows.length === 0) return NextResponse.json({ error: "Tidak ada baris data." }, { status: 400 });
  if (rows.length > MAX_ROWS)
    return NextResponse.json(
      { error: `Batas ${MAX_ROWS} baris, terbaca ${rows.length}.` },
      { status: 400 },
    );

  const idx = (name: string) => headers.findIndex((h) => h.trim().toLowerCase() === name);
  const iDest = idx("destination_url");
  const iSlug = idx("slug");
  const iTitle = idx("title");
  const iDesc = idx("description");
  const iPw = idx("password");
  const iExp = idx("expires_at");
  const iLimit = idx("click_limit");
  const iIos = idx("ios_url");
  const iAnd = idx("android_url");
  const iSrc = idx("utm_source");
  const iMed = idx("utm_medium");
  const iCmp = idx("utm_campaign");

  if (iDest < 0) return NextResponse.json({ error: "Kolom `destination_url` wajib ada." }, { status: 400 });

  type Prepared = {
    rowIndex: number;
    slug: string;
    destinationUrl: string;
    title: string | null;
    description: string | null;
    password: string | null;
    expiresAt: Date | null;
    clickLimit: number | null;
    iosUrl: string | null;
    androidUrl: string | null;
    utm: Record<string, string> | null;
  };

  const prepared: Prepared[] = [];
  const issues: Array<{ row: number; error: string }> = [];
  const usedSlugsInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    const rowNo = i + 2; // +1 for header, +1 for 1-based

    const rawDest = (cells[iDest] ?? "").trim();
    if (!rawDest) continue;
    const dest = normalizeUrl(rawDest);
    if (!isValidUrl(dest)) {
      issues.push({ row: rowNo, error: `URL tidak valid: ${rawDest}` });
      continue;
    }

    let slug = (iSlug >= 0 ? cells[iSlug] ?? "" : "").trim();
    if (slug) {
      if (!isValidSlug(slug)) {
        issues.push({ row: rowNo, error: `Slug tidak valid: ${slug}` });
        continue;
      }
      if (usedSlugsInBatch.has(slug)) {
        issues.push({ row: rowNo, error: `Slug duplikat di batch: ${slug}` });
        continue;
      }
      const exists = db
        .select({ id: links.id })
        .from(links)
        .where(and(eq(links.slug, slug), isNull(links.domainId)))
        .get();
      if (exists) {
        issues.push({ row: rowNo, error: `Slug sudah dipakai di DB: ${slug}` });
        continue;
      }
      usedSlugsInBatch.add(slug);
    } else {
      // generate unique
      for (let t = 0; t < 6; t++) {
        const g = generateSlug();
        if (usedSlugsInBatch.has(g)) continue;
        const exists = db
          .select({ id: links.id })
          .from(links)
          .where(and(eq(links.slug, g), isNull(links.domainId)))
          .get();
        if (!exists) {
          slug = g;
          usedSlugsInBatch.add(g);
          break;
        }
      }
      if (!slug) {
        issues.push({ row: rowNo, error: `Gagal generate slug unik` });
        continue;
      }
    }

    let expiresAt: Date | null = null;
    if (iExp >= 0 && (cells[iExp] ?? "").trim()) {
      const d = new Date(cells[iExp]);
      if (isNaN(d.getTime())) {
        issues.push({ row: rowNo, error: `expires_at invalid date` });
        continue;
      }
      expiresAt = d;
    }
    const clickLimit = iLimit >= 0 && (cells[iLimit] ?? "").trim() ? Number(cells[iLimit]) : null;
    if (clickLimit !== null && (!Number.isFinite(clickLimit) || clickLimit < 0)) {
      issues.push({ row: rowNo, error: `click_limit invalid` });
      continue;
    }

    const utm: Record<string, string> = {};
    if (iSrc >= 0 && cells[iSrc]) utm.utm_source = cells[iSrc];
    if (iMed >= 0 && cells[iMed]) utm.utm_medium = cells[iMed];
    if (iCmp >= 0 && cells[iCmp]) utm.utm_campaign = cells[iCmp];

    prepared.push({
      rowIndex: rowNo,
      slug,
      destinationUrl: dest,
      title: iTitle >= 0 && cells[iTitle] ? cells[iTitle] : hostOf(dest),
      description: iDesc >= 0 && cells[iDesc] ? cells[iDesc] : null,
      password: iPw >= 0 && cells[iPw] ? cells[iPw] : null,
      expiresAt,
      clickLimit: clickLimit ?? null,
      iosUrl: iAnd >= 0 && cells[iAnd] ? cells[iAnd] : null,
      androidUrl: iIos >= 0 && cells[iIos] ? cells[iIos] : null,
      utm: Object.keys(utm).length ? utm : null,
    });
  }

  if (!commit) {
    return NextResponse.json({
      preview: true,
      totalRows: rows.length,
      valid: prepared.length,
      invalid: issues.length,
      issues: issues.slice(0, 50),
      sample: prepared.slice(0, 10).map((p) => ({ slug: p.slug, destination_url: p.destinationUrl, title: p.title })),
    });
  }

  let created = 0;
  db.transaction(() => {
    for (const p of prepared) {
      const id = nanoid(14);
      const passwordHash = p.password ? bcrypt.hashSync(p.password, 10) : null;
      db.insert(links)
        .values({
          id,
          workspaceId: ws.id,
          domainId: null,
          slug: p.slug,
          destinationUrl: p.destinationUrl,
          title: p.title,
          description: p.description,
          faviconUrl: getFaviconUrl(p.destinationUrl),
          passwordHash,
          expiresAt: p.expiresAt,
          clickLimit: p.clickLimit,
          iosUrl: p.iosUrl,
          androidUrl: p.androidUrl,
          utmParams: p.utm,
          createdBy: ctx.user.id,
        })
        .run();
      created++;
    }
  });
  return NextResponse.json({ committed: true, created, skipped: issues.length, issues: issues.slice(0, 50) });
}
