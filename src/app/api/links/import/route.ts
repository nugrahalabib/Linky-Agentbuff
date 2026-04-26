import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { folders, linkTags, links, tags as tagsTable } from "@/lib/db/schema";
import { ensureWorkspace, getSessionUser } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { autoMap, detectProvider, parseTagsCell, type FieldKey } from "@/lib/csv-mapping";
import { generateSlug, isValidSlug } from "@/lib/slug";
import { getFaviconUrl, hostOf, isValidUrl, normalizeUrl } from "@/lib/utils";

const MAX_ROWS = 10_000;

interface RequestBody {
  csv?: string;
  commit?: boolean;
  mapping?: Partial<Record<FieldKey, number | null>>;
  conflict?: "skip" | "rename" | "fail";
  defaultFolderId?: string | null;
  defaultTagIds?: string[];
}

export async function POST(req: Request) {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const ws = await ensureWorkspace(ctx.user.id);

  const body = (await req.json().catch(() => null)) as RequestBody | null;
  const csv = body?.csv ?? "";
  const commit = Boolean(body?.commit);
  const conflict = body?.conflict ?? "fail";
  if (!csv.trim()) return NextResponse.json({ error: "CSV kosong." }, { status: 400 });

  const { headers, rows, delimiter } = parseCsv(csv);
  if (rows.length === 0) return NextResponse.json({ error: "Tidak ada baris data." }, { status: 400 });
  if (rows.length > MAX_ROWS)
    return NextResponse.json(
      { error: `Batas ${MAX_ROWS} baris, terbaca ${rows.length}.` },
      { status: 400 },
    );

  const provider = detectProvider(headers);
  const auto = autoMap(headers);
  const mapping: Record<FieldKey, number | null> = { ...auto, ...(body?.mapping ?? {}) } as Record<
    FieldKey,
    number | null
  >;

  if (mapping.destination_url == null || mapping.destination_url < 0) {
    return NextResponse.json(
      {
        error:
          "Kolom URL tujuan belum dipetakan. Pastikan ada kolom seperti `long_url` (Bit.ly), `destination` (Rebrandly), atau `destination_url`.",
        headers,
        provider,
        suggested_mapping: auto,
      },
      { status: 400 },
    );
  }

  // Default folder + tag validation (if provided, must belong to workspace)
  let defaultFolderId: string | null = null;
  if (body?.defaultFolderId) {
    const f = db
      .select({ id: folders.id })
      .from(folders)
      .where(and(eq(folders.id, body.defaultFolderId), eq(folders.workspaceId, ws.id)))
      .get();
    if (!f) return NextResponse.json({ error: "Folder default tidak valid." }, { status: 400 });
    defaultFolderId = f.id;
  }
  const defaultTagIds: string[] = [];
  if (body?.defaultTagIds && body.defaultTagIds.length > 0) {
    const valid = db
      .select({ id: tagsTable.id })
      .from(tagsTable)
      .where(eq(tagsTable.workspaceId, ws.id))
      .all()
      .map((t) => t.id);
    for (const id of body.defaultTagIds) if (valid.includes(id)) defaultTagIds.push(id);
  }

  const cell = (row: string[], key: FieldKey): string => {
    const i = mapping[key];
    if (i == null || i < 0) return "";
    return (row[i] ?? "").trim();
  };

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
    tags: string[];
    folderId: string | null;
  };

  const prepared: Prepared[] = [];
  const issues: Array<{ row: number; error: string; original: string }> = [];
  const usedSlugsInBatch = new Set<string>();
  const allTagsInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i];
    const rowNo = i + 2; // header offset
    const original = cells.join(delimiter);

    const rawDest = cell(cells, "destination_url");
    if (!rawDest) continue;
    const dest = normalizeUrl(rawDest);
    if (!isValidUrl(dest)) {
      issues.push({ row: rowNo, error: `URL tidak valid: ${rawDest}`, original });
      continue;
    }

    let slug = cell(cells, "slug");
    if (slug) {
      if (!isValidSlug(slug)) {
        issues.push({ row: rowNo, error: `Slug tidak valid: ${slug}`, original });
        continue;
      }
      const exists =
        usedSlugsInBatch.has(slug) ||
        Boolean(
          db
            .select({ id: links.id })
            .from(links)
            .where(and(eq(links.slug, slug), isNull(links.domainId)))
            .get(),
        );
      if (exists) {
        if (conflict === "skip") continue;
        if (conflict === "rename") {
          let candidate = "";
          for (let attempt = 1; attempt < 50; attempt++) {
            const c = `${slug}-${attempt}`;
            if (!isValidSlug(c)) break;
            const ex =
              usedSlugsInBatch.has(c) ||
              Boolean(
                db
                  .select({ id: links.id })
                  .from(links)
                  .where(and(eq(links.slug, c), isNull(links.domainId)))
                  .get(),
              );
            if (!ex) {
              candidate = c;
              break;
            }
          }
          if (!candidate) {
            issues.push({ row: rowNo, error: `Slug ${slug} bentrok dan rename gagal`, original });
            continue;
          }
          slug = candidate;
        } else {
          issues.push({ row: rowNo, error: `Slug sudah dipakai: ${slug}`, original });
          continue;
        }
      }
      usedSlugsInBatch.add(slug);
    } else {
      let generated = "";
      for (let t = 0; t < 6; t++) {
        const g = generateSlug();
        if (usedSlugsInBatch.has(g)) continue;
        const ex = db
          .select({ id: links.id })
          .from(links)
          .where(and(eq(links.slug, g), isNull(links.domainId)))
          .get();
        if (!ex) {
          generated = g;
          break;
        }
      }
      if (!generated) {
        issues.push({ row: rowNo, error: `Gagal generate slug unik`, original });
        continue;
      }
      slug = generated;
      usedSlugsInBatch.add(slug);
    }

    let expiresAt: Date | null = null;
    const rawExp = cell(cells, "expires_at");
    if (rawExp) {
      const d = new Date(rawExp);
      if (isNaN(d.getTime())) {
        issues.push({ row: rowNo, error: `expires_at invalid date: ${rawExp}`, original });
        continue;
      }
      expiresAt = d;
    }
    const rawLimit = cell(cells, "click_limit");
    let clickLimit: number | null = null;
    if (rawLimit) {
      const n = Number(rawLimit);
      if (!Number.isFinite(n) || n < 0) {
        issues.push({ row: rowNo, error: `click_limit invalid: ${rawLimit}`, original });
        continue;
      }
      clickLimit = n > 0 ? n : null;
    }

    const utm: Record<string, string> = {};
    const utmSrc = cell(cells, "utm_source");
    const utmMed = cell(cells, "utm_medium");
    const utmCmp = cell(cells, "utm_campaign");
    const utmTrm = cell(cells, "utm_term");
    const utmCnt = cell(cells, "utm_content");
    if (utmSrc) utm.utm_source = utmSrc;
    if (utmMed) utm.utm_medium = utmMed;
    if (utmCmp) utm.utm_campaign = utmCmp;
    if (utmTrm) utm.utm_term = utmTrm;
    if (utmCnt) utm.utm_content = utmCnt;

    const rawTags = parseTagsCell(cell(cells, "tags"));
    for (const t of rawTags) allTagsInBatch.add(t);

    prepared.push({
      rowIndex: rowNo,
      slug,
      destinationUrl: dest,
      title: cell(cells, "title") || hostOf(dest),
      description: cell(cells, "description") || null,
      password: cell(cells, "password") || null,
      expiresAt,
      clickLimit,
      iosUrl: cell(cells, "ios_url") || null,
      androidUrl: cell(cells, "android_url") || null,
      utm: Object.keys(utm).length ? utm : null,
      tags: rawTags,
      folderId: defaultFolderId,
    });
  }

  if (!commit) {
    return NextResponse.json({
      preview: true,
      provider,
      delimiter,
      headers,
      mapping,
      totalRows: rows.length,
      valid: prepared.length,
      invalid: issues.length,
      tags_to_create: Array.from(allTagsInBatch).slice(0, 50),
      tags_to_create_count: allTagsInBatch.size,
      issues: issues.slice(0, 100),
      sample: prepared.slice(0, 10).map((p) => ({
        slug: p.slug,
        destination_url: p.destinationUrl,
        title: p.title,
        tags: p.tags,
        has_password: !!p.password,
        expires_at: p.expiresAt?.toISOString() ?? null,
      })),
    });
  }

  // Resolve / create tags (workspace-scoped)
  const tagIdByName = new Map<string, string>();
  const existing = db
    .select({ id: tagsTable.id, name: tagsTable.name })
    .from(tagsTable)
    .where(eq(tagsTable.workspaceId, ws.id))
    .all();
  for (const t of existing) tagIdByName.set(t.name.toLowerCase(), t.id);

  for (const tagName of allTagsInBatch) {
    const key = tagName.toLowerCase();
    if (tagIdByName.has(key)) continue;
    const id = nanoid(12);
    db.insert(tagsTable)
      .values({ id, workspaceId: ws.id, name: tagName, color: "#4F46E5" })
      .run();
    tagIdByName.set(key, id);
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
          folderId: p.folderId,
          createdBy: ctx.user.id,
        })
        .run();
      created++;

      const linkTagIds = new Set<string>();
      for (const t of p.tags) {
        const tid = tagIdByName.get(t.toLowerCase());
        if (tid) linkTagIds.add(tid);
      }
      for (const tid of defaultTagIds) linkTagIds.add(tid);
      for (const tid of linkTagIds) db.insert(linkTags).values({ linkId: id, tagId: tid }).run();
    }
  });

  return NextResponse.json({
    committed: true,
    created,
    skipped: issues.length,
    total: rows.length,
    issues: issues.slice(0, 100),
    tags_created: allTagsInBatch.size,
  });
}
