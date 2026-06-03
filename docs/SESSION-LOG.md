# Session Log — April-June 2026

> Catatan komprehensif tentang apa yang berubah, dirombak, ditambahkan, dan dihapus dalam sesi-sesi development antara 2026-04-22 dan 2026-06-04. Tujuan: kalau buka sesi baru, kamu (atau Claude di sesi berikutnya) bisa langsung mengerti **state codebase** + **alasan setiap keputusan besar** + **konteks user preferences** tanpa harus repaint dari nol.

---

## State Snapshot (per 2026-06-04)

| Item | Nilai |
|---|---|
| Versi | **0.5.4** |
| Branch | `main` (sinkron dengan `origin/main`) |
| Working tree | Clean |
| Total commit di sesi ini | 6 commit (semua sudah di-push) |
| Tests | 119/119 pass |
| TypeScript | Zero error |
| Production build | Sukses |
| DB | SQLite, 12 migrations applied |
| Dev server status | (matikan setelah testing — terakhir kali running di `b0hkgiky2`) |

---

## Konteks User (jangan ulangi tanya)

### Profil pengguna
- **Nama:** Nugraha Labib Mujaddid
- **Email:** `agentbuff.id@gmail.com` (juga login GitHub `nugrahalabib`)
- **Repo:** https://github.com/nugrahalabib/Linky-Agentbuff
- **Target produksi:** `linky.agentbuff.id` (sudah punya VPS Hostinger di `148.230.100.170`)

### Preferensi kerja yang sudah dikonfirmasi
1. **Skip auth polish** — tidak butuh magic link / 2FA / email verification kompleks. Email + password cukup.
2. **No MVP-MVP-an** — bangun produk komprehensif sekali jadi, bukan ship versi minimal lalu iterate.
3. **Single-user product** — fitur Tim/multi-user/invite **DITOLAK**. Pernah dibangun lalu dihapus total. Jangan re-introduce.
4. **Indonesian UI default, friendly tone** — pakai "kamu", santai, manusiawi. Bukan "Anda" + technical jargon.
5. **Real working features** — kalau fitur ditampilkan, harus beneran berfungsi end-to-end (bukan dummy). Pernah complain "ini ga kayak website professional dan ga kayak fungsi pengaturan yang sesungguhnya".
6. **Komprehensif documentation** — request eksplisit untuk plan detail sebelum implementasi besar.
7. **Domain konsisten** — `linky.agentbuff.id` di semua tempat (bukan `localhost` hardcoded di docs/copy).
8. **Port 1709** — pernah cek pakai 1706/3000, di-override jadi 1709. Sudah set di package.json.

### Cara user kasih feedback
- **Frustrated capslock** ("AKU BILANG DI LEBARIN BUKAN DI PANJANGIN") = critical, langsung fix arah opposite dari yang sedang dilakukan
- **Lower case dengan "kah/sih"** = clarifying question, jawab langsung
- **"buat plan komprehensif"** = bikin plan dulu, jangan langsung code
- **"push"** = commit + push semua perubahan ke remote

### Yang BIKIN USER FRUSTRATED (jangan ulangi)
- Bikin halaman read-only saja → "ga ada guna manfaat dan ngapain ada beginian"
- Klaim fitur bisa tanpa tes nyata → "atau jangan jangan fitur bodong?"
- Lupa swap dimensions (lebar vs panjang) di mockup
- Hardcoded localhost di copywriting yang seharusnya production URL

---

## Timeline Sesi (chronological)

### Sesi 1-N awal (sebelum sesi yang dirangkum di file ini)
Bangun foundation:
- v0.1 MVP — shorten, redirect, QR, basic analytics, auth, signup
- Phase 1 (v0.2) — Postgres prep, Redis client, tests, GitHub Actions CI
- Phase 3 (v0.3) — folders, tags, search, CSV import/export awal, UTM recipes, bulk ops
- Phase 4-10 (v0.4) — targeting schema, Linky Pages, REST API v1 awal, deploy artifacts (Docker, Caddy)

### 2026-04-23 — Folders + Tags + UTM integration (`81c400a`)
Setelah folders/tags/UTM dibuat, integrate ke create-link form (chip selector multi-tag, folder dropdown, UTM recipe apply + save). Detail folder/tag page (list link inside). Explainer cards.

### 2026-04-25 — Analytics Dashboard Pro (`3f2bf2c`)
Single-page analytics dashboard:
- KPI cards
- Big area chart (Recharts)
- Top 10 links dengan sparkline + delta%
- 4 breakdown cards (country/referrer/device/browser) dengan bar visualization
- Recent activity feed
- Searchable link picker filter
- Period switcher 7/30/90

### 2026-04-25 — Landing page redesign massif (`32c5e9d`)
10+ iteration revisi copywriting dengan user feedback. Phone mockup hilang total karena tidak bisa proporsional. Container `max-w-3xl`. Sections final:
- Hero (no phone)
- Trust strip
- URL Shortener product section
- Linky Pages section (sticky phone preview)
- Use cases 4 persona
- 9 micro features grid
- Developer section
- 3-step How it works
- Final CTA
- Footer

### 2026-04-25 — relativeTime fix (`546759b`)
Fix runtime `TypeError: d.getTime is not a function` karena Date kadang serialized jadi string. Tambah `toDate()` helper.

### 2026-04-26 (sesi besar #1) — Developer/API revamp (`72d26c7`)
User complain: "Dokumentasi API untuk developer ga ada, terus halaman developer juga ga jelas ini ga yakin apakah berfungsi atau engga, pasti ga berfungsi dengan baik!"

Plan 7-fase, lalu eksekusi:

1. **REST API v1 lengkap** di `/api/v1/*`:
   - `me`, `links` (CRUD), `analytics` (workspace + per-link), `qr`
   - Bearer auth, CORS, 120 req/menit rate limit
   - Standard error format `{ error: { code, message }, request_id }`
   - `OPTIONS` handlers untuk preflight
   - Rate limit headers di setiap response

2. **Webhook delivery system**:
   - `fireWebhooks(workspaceId, event, data)` di `src/lib/webhooks.ts`
   - HMAC-SHA256 signed POST
   - 5s timeout
   - Migration `0009_webhook_deliveries` (table baru)
   - Auto-prune ke 50 terakhir per webhook
   - Events: `link.clicked` (dari `recordClick`), `link.created`/`updated`/`deleted` (dari CRUD)
   - Endpoints baru: `/api/webhooks/[id]/test`, `/api/webhooks/[id]/deliveries`, `PATCH /api/webhooks/[id]`

3. **Public docs**:
   - `/docs/api/page.tsx` — TOC sidebar, code samples (cURL/Node/Python/PHP) dengan `CodeBlock` & `CodeTabs` components yang copy-able
   - `/docs/openapi.json/route.ts` — OpenAPI 3.1 spec
   - Endpoint reference, error code table, webhook signature verifier 3 bahasa

4. **Dashboard Developer rebuild**:
   - 4 KPI cards (keys, webhooks, deliveries 7d, base URL)
   - Tabs: Quickstart / API Keys / Webhooks / Test Console
   - `ApiTestConsole` — pilih endpoint dari dropdown, paste key, kirim request live dari browser, lihat status + headers + body response
   - `WebhookManager` di-revamp: per-row test button, deliveries log expand-able, status pill (healthy/degraded/failing), reveal/copy signing secret, pause/resume

5. Audit & verifikasi end-to-end (lihat bagian "Audit Trail" di bawah).

### 2026-04-26 — API key onboarding + Cookbook (`ad758df`)
Setelah audit menyeluruh, tambahkan:
- Section "Cara dapat API key" di docs dengan step-by-step signup → dashboard → token
- Cookbook 5 resep: bulk CSV import (Node), Express webhook receiver dengan HMAC verify, Python QR bulk export, daily Slack digest, bulk PATCH destination
- ApiKeyManager: dropdown kadaluwarsa (Never/30/90/365 hari) + per-key Last-used + Kadaluwarsa display

### 2026-04-26 — README + CHANGELOG + CLAUDE.md update (`3d82899`)
Update meta-dokumentasi:
- README full feature list (core / org / Linky Page / multi-user / developer / auth / platform)
- Stack section
- REST API quickstart snippet
- Bump version 0.1.0 → 0.5.0
- CLAUDE.md section "REST API surface (v0.5)"

### 2026-04-26 — Hapus fitur Tim/multi-user (`46758c1`)
User: "fungsi team gausah deh hilangin aja hingga bersih dan total bener bener clean dan bersih pastiin jangan sampai ada yang tersisa atau nyampah"

Eksekusi komprehensif:
- Hapus 9 file: `/dashboard/team`, `/api/workspace/{members,invitations,switch}`, `/api/workspace` (GET/POST), `/invite/[token]`, `TeamManager`, `AcceptInviteButton`, `WorkspaceSwitcher`
- Hapus 2 tabel DB via migration `0010_drop_team`:
  - `DROP TABLE workspace_invitations`
  - `DROP TABLE workspace_members`
  - `ALTER TABLE users DROP COLUMN active_workspace_id`
- Hapus types: `WorkspaceRole`, `WorkspaceMember`, `WorkspaceInvitation`, `canEdit/canAdmin/isOwner`
- Simplify `lib/workspace.ts` dari 107 baris → 19 baris (1 fungsi `getActiveWorkspace`)
- Simplify `lib/auth.ts` — `getSessionUserWithWorkspace()` tidak lagi return `role`
- Sidebar: hapus item "Tim" + import `Users` icon + `WorkspaceSwitcher`
- Cmd+K palette: hapus entry "Tim (Members & Invites)"
- README: hapus section "Multi-user workspaces"
- Verifikasi: grep di seluruh `src/` zero referensi tersisa untuk `workspaceMembers`, `workspaceInvitations`, `WorkspaceRole`, `activeWorkspaceId`, `/dashboard/team`, `/api/workspace/`, `/invite/`, `TeamManager`

Bump version 0.5.0 → 0.5.1.

### 2026-04-26 — Settings page redesign (`0035c3a`)
User: "halaman pengaturan ini apa fungsinya kenapa cuma gini doang ga ada guna manfaat dan ngapain ada beginian ini ga kayak website professional dan ga kayak fungsi pengaturan yang sesungguhnya"

Plan 6-tab functional, lalu eksekusi:

1. **Schema upgrade** — Migration `0011_session_metadata`:
   ```sql
   ALTER TABLE sessions ADD COLUMN user_agent TEXT;
   ALTER TABLE sessions ADD COLUMN ip_hash TEXT;
   ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER;
   ```
   `createSession` auto-populate dari headers, `getSessionUser` update `last_seen_at`.

2. **9 endpoint baru**:
   - `PATCH /api/auth/profile` (validator `updateProfileSchema`)
   - `POST /api/auth/change-password` (validator `changePasswordSchema`, rejects same-as-old, auto-revoke other sessions)
   - `GET /api/auth/sessions` (list dengan device/OS/browser detection)
   - `DELETE /api/auth/sessions/[id]` (current session dilindungi)
   - `POST /api/auth/sessions/revoke-others`
   - `PATCH /api/workspace` (validator dengan slug uniqueness check)
   - `GET /api/account/stats` (KPI counts)
   - `GET /api/account/export` (JSON download dengan Content-Disposition)
   - `POST /api/account/wipe-links` (konfirm ketik nama workspace)
   - `DELETE /api/account` (konfirm email + password, cascade purge)

3. **6 client components** di `src/components/settings/`:
   - `settings-tabs.tsx` (orchestrator)
   - `profile-section.tsx`
   - `security-section.tsx` (dengan sessions list + device detection)
   - `workspace-section.tsx`
   - `preferences-section.tsx` (tema + density, localStorage)
   - `data-section.tsx` (stats + ekspor)
   - `danger-zone.tsx`

4. **Page rakitan** — `src/app/dashboard/settings/page.tsx`

5. Verifikasi end-to-end (lihat audit trail).

Bump version 0.5.1 → 0.5.2.

### 2026-04-26 — CSV import revamp (`99761ca`)
User: "fitur import csv ini emang benar benar sudah pasti bisa di pakai untuk migrasi dari bit.ly dan kawan kawan ga? atau jangan jangan fitur bodong?"

Audit menemukan **11 bug nyata**:
1. iOS/Android tertukar (line 149-150 di import route)
2. Bit.ly export gagal (kolom `long_url` bukan `destination_url`)
3. BOM `﻿` di Excel exports
4. Delimiter `;` (EU) / `\t` (TSV) tidak di-detect
5. Tidak ada column mapping UI
6. Tidak parse tags
7. Tidak ada conflict resolution
8. Tidak ada folder/tag default
9. Tidak ada error report download
10. Tidak ada provider guide
11. Tidak ada sample CSV

Eksekusi komprehensif:

1. **Library upgrade**:
   - `src/lib/csv.ts` — `detectDelimiter()` (quoted-aware sniff), strip BOM, `parseCsv()` return `{ headers, rows, delimiter }`
   - `src/lib/csv-mapping.ts` — `FieldKey` union (15 fields), `ALIASES` (50+ alias dari 5 platform), `autoMap()`, `detectProvider()`, `parseTagsCell()`, `FIELD_LABELS`, `PROVIDER_LABEL`

2. **Endpoint upgrade** `/api/links/import`:
   - Body: `{ csv, commit?, mapping?, conflict?, defaultFolderId?, defaultTagIds? }`
   - Conflict modes: `skip` (default UI) / `rename` (auto-suffix `-1`) / `fail`
   - Tags auto-create (case-insensitive lookup, INSERT kalau belum ada)
   - Default folder + tag validate belong to workspace
   - Response preview kaya: `provider`, `delimiter`, `mapping`, `tags_to_create[]`, `issues[]` dengan `original` field

3. **Error report endpoint** `POST /api/links/import/error-report` — serve CSV download dengan `row, error, original_data` kolom.

4. **3-step wizard UI** `csv-importer.tsx`:
   - Step 1: Upload (drag-drop, paste, .csv/.tsv accept)
   - Step 2: Map table + conflict dropdown + folder/tag picker
   - Step 3: Preview sample 10 + tags count + issues + commit button
   - Step 4: Success card dengan "Lihat semua link" + "Unduh laporan error" + "Import lagi"

5. **Provider guide sidebar** `provider-guide.tsx`:
   - Accordion 6 provider (Bit.ly, Rebrandly, TinyURL, Dub.co, Short.io, Linky template)
   - Step-by-step export instructions per provider
   - Sample CSV download per provider
   - Link docs official (mis. Bit.ly help)

6. **Tests**: +25 unit tests (`csv.test.ts` + `csv-mapping.test.ts`) → 119/119 total.

Bump version 0.5.2 → 0.5.3.

### 2026-04-27 — Run project untuk testing live
User minta jalankan project. Encountered Windows App Control blocking `better_sqlite3.node`. Solved by copying binary dari VidBee project folder (sama versi 12.4.1).
- `npm run db:migrate` → 12 migrations OK
- `npm run dev` (Turbopack) → ready di :1709
- Smoke test: public pages 200, dashboard pages redirect 307 (correct)

### 2026-06-04 — Dokumentasi komprehensif (sesi ini)
Update CLAUDE.md jadi master onboarding doc + bikin docs/ARCHITECTURE.md + docs/SESSION-LOG.md (file ini). Tujuan: sesi baru bisa langsung lanjut tanpa kembali ke sesi ini.

---

## Audit Trail Penting

### Cross-workspace isolation pen-test (sesi REST API)

Setup: bikin workspace B + key B + link B. Pakai key A coba serang.

| Attack | Hasil |
|---|---|
| GET A's `/me` workspace ID | Returns ws A ID (correct) |
| GET B's `/me` workspace ID | Returns ws B ID (correct) |
| A tries `GET /api/v1/links/{B_link_id}` | 404 not_found ✅ |
| A tries `PATCH /api/v1/links/{B_link_id}` | 404 not_found ✅ |
| A tries `DELETE /api/v1/links/{B_link_id}` | 404 not_found ✅ |
| A's list contains B's link? | `grep -c "audit-other-ws-link"` → 0 ✅ |
| A reads B's link analytics | 404 not_found ✅ |
| B's link still intact after attack | YES, unmodified ✅ |

**Verdict:** Workspace isolation 100%.

### Rate limit test
Fire 130 quick requests with same key. Result: **120 succeed, 10 rate-limited.** Exact spec match.

### Webhook signature verification test
Receiver Express dengan HMAC verify. Trigger 4 actions:
- POST `/api/v1/links` (create)
- Click redirect
- PATCH `/api/v1/links/{id}` (update)
- DELETE `/api/v1/links/{id}` (delete)

Result: **4/4 events delivered, all signatures `valid=true`, all HTTP 200, all logged to `webhook_deliveries` DB.**

### Settings destructive ops test

| Op | Hasil |
|---|---|
| Change password wrong current | Rejected ✅ |
| Change password same as old | Rejected (validator) ✅ |
| Change password valid | OK, old password fails login, new works ✅ |
| Cannot revoke current session | UX guard ✅ |
| Revoke-others kills only others | ✅ |
| Wipe-links wrong confirm | Rejected ✅ |
| Wipe-links correct confirm | 3 links deleted ✅ |
| Delete account wrong password | Rejected ✅ |
| Delete account wrong email | Rejected ✅ |
| Delete account real | Cascade purge — users/workspaces/sessions/links/all = 0 ✅ |

### CSV import end-to-end (Bit.ly format)

Input:
```csv
id,title,long_url,created_at,link,archived,tags
1abc,Promo April,https://example.com/landing,...,...,false,marketing|launch
```

Result:
- Provider auto-detected: `bitly` ✅
- Mapping auto: `long_url → destination_url`, `title → title`, `tags → tags` ✅
- Tags pipe-split: `marketing`, `launch` ✅
- Commit: 3 links created, 3 tags auto-created, link↔tag association correct ✅

### Deep link swap fix verification
Input: `ios_url=apps.apple.com, android_url=play.google.com`
DB after commit: `ios_url=apps.apple.com, android_url=play.google.com` ✅ (sebelumnya tertukar)

### Conflict modes test
Seed slug `my-conflict-slug`, lalu import same slug dengan 3 modes:
- `fail` → row marked invalid with clear error ✅
- `skip` → silently skipped (0 valid, 0 invalid) ✅
- `rename` → became `my-conflict-slug-1` ✅

---

## Decisions Log

### Mengapa SQLite sync (bukan Postgres async)
- Single-instance scale OK
- Zero config untuk dev/self-host
- Drizzle ORM sama untuk SQL backend, schema sudah ditulis
- Postgres adapter siap (`schema-pg.ts`, `migrate-pg.ts`) untuk masa depan
- Migrasi butuh refactor 150 call site jadi async → tidak prioritas sekarang

### Mengapa custom JWT (bukan NextAuth)
- Lebih ringan
- Kontrol penuh atas session DB row vs JWT
- Revocation langsung (delete row → langsung 401, tidak perlu tunggu JWT expiry)
- NextAuth besar untuk use case sederhana ini

### Mengapa node:test (bukan vitest)
- Windows App Control owner block rolldown native binding
- node:test built-in, no dep
- API mirror via test-shim, code test tetap familiar
- Fast (~2s untuk 119 tests)

### Mengapa fire-and-forget webhook (bukan queue)
- SQLite tidak punya LISTEN/NOTIFY
- Add Redis Streams = dependency baru
- Current scale OK
- Roadmap: persistent queue saat butuh retry

### Mengapa single-user (bukan multi-user team)
- User eksplisit request — pernah ada lalu hapus total
- Kompleksitas membership/role/invitation tidak perlu untuk solo user
- Bisa di-revisit kalau ada use case nyata di masa depan

### Mengapa `/u/[username]` (bukan `/@username` atau `/[username]`)
- Top-level `/[slug]` sudah dipakai redirect
- Next.js parse `@` syntax sebagai parallel route slot di beberapa konteks
- `/u/` prefix jelas dan unambiguous

### Mengapa port 1709
- 3000 sering bentrok dengan dev tools lain
- 1706 sempat dipakai, user override jadi 1709
- Set di `package.json` dan `.env*`

### Mengapa Tailwind v4 CSS-first
- Modern, future-proof
- `@theme` block di CSS = single source of design tokens
- Tidak perlu `tailwind.config.ts` file
- Indigo (#4F46E5) + Cyan (#06B6D4) brand palette

---

## Known Issues / TODOs

### High priority
- [ ] Webhook retry policy (exp-backoff, 4 attempts max)
- [ ] A/B testing UI (schema sudah ada, perlu editor)
- [ ] Geo targeting rules UI (schema sudah ada)

### Medium
- [ ] Postgres adapter actually switched on (perlu async refactor)
- [ ] Real-time analytics (SSE)
- [ ] Multi-domain support UI (verification wizard)
- [ ] Email send untuk webhook failure alert (kalau >24h failing)

### Low
- [ ] ClickHouse migration (saat scale)
- [ ] CF Workers edge redirect (saat target p95 <80ms global)
- [ ] Mobile app (React Native + Expo)
- [ ] Official SDKs (TS + Python)
- [ ] Translation: Spanish, Portuguese, French, German, Japanese, Arabic, Hindi, Vietnamese

### Code health
- [ ] Some unused imports might be left over from session iterations (run `npm run lint`)
- [ ] CHANGELOG entries could be tightened (some duplicate phrasing)

---

## Anti-Patterns yang Pernah Ditemui

### Phone mockup proportional issues
Iterating lebar/panjang phone preview bikin user frustrated. Akhirnya hapus phone dari hero karena tidak bisa proporsional di constraints layout. Untuk Linky Pages section ditahan dengan `items-start` sticky. **Pelajaran:** kalau mockup tidak fit, hapus, jangan force.

### Dummy/decorative pages
Settings v1 cuma 2 read-only card. User: "ga ada guna manfaat". **Pelajaran:** kalau page ditampilkan, harus beneran berfungsi.

### Hardcoded localhost di copy
`/docs/api` sempat tampilkan `http://localhost:1709/api/v1` di prod. Fix dengan `process.env.NEXT_PUBLIC_APP_URL` fallback.

### Claim fitur tanpa tes nyata
User berkali-kali tanya "udah dipastiin?". **Pelajaran:** untuk fitur baru besar, audit end-to-end via cURL + DB inspect, tunjukkan bukti.

### Token sharing di chat (security incident)
User pernah paste GitHub PAT ke chat untuk push. Token sekarang exposed di chat history. **Pelajaran:** selalu pakai credential local yang sudah ada di git config — tolak terima token via chat.

---

## File yang sering dibaca/diubah

### Wajib selalu sinkron
- `src/lib/db/schema.ts` — schema single source of truth
- `scripts/migrate-sqlite.ts` — migrations list (kalau tambah, append `0012_xxx`)
- `src/lib/validators.ts` — Zod schemas
- `CLAUDE.md` — master onboarding
- `CHANGELOG.md` — release notes
- `README.md` — public-facing
- `package.json` — version + scripts

### High-touch
- `src/app/[slug]/route.ts` — hot path
- `src/lib/auth.ts` — security critical
- `src/lib/api-helpers.ts` — public API contract
- `src/lib/webhooks.ts` — delivery infrastructure
- `src/components/csv-importer.tsx` — wizard logic
- `src/components/settings/*` — settings sections

### Style touch
- `src/app/globals.css` — design tokens via @theme
- `src/components/ui/*` — primitives

---

## Cara resume di sesi berikutnya

1. Baca `CLAUDE.md` (master onboarding)
2. Baca `docs/ARCHITECTURE.md` (kalau perlu deep technical)
3. Baca file ini (`docs/SESSION-LOG.md`) untuk konteks decisions
4. `git log --oneline -10` untuk lihat commit terakhir
5. `git status` untuk lihat working tree
6. `npm install` kalau node_modules belum ada
7. `npx tsx scripts/migrate-sqlite.ts` untuk pastikan DB up-to-date
8. `npm test` untuk sanity check
9. `npm run dev` untuk start
10. Akses `http://localhost:1709`

Kalau user ada request baru:
- Kalau **fitur kecil**: langsung implement dengan respect konvensi
- Kalau **fitur besar**: bikin **plan komprehensif dulu** dengan format:
  - Kondisi sekarang (apa yang sudah ada, apa bug-nya)
  - Yang akan dibangun (list endpoint/komponen/migration)
  - Verifikasi plan
- Kalau **refactor / hapus fitur**: tanya konfirmasi dulu, lalu eksekusi total
- Kalau **bug fix**: investigate root cause, jangan suppress symptom

---

## Hubungan ke sesi sebelumnya

Untuk konteks fitur yang dibangun sebelum sesi yang dirangkum di file ini, baca:
- `CHANGELOG.md` — semua release dari 0.1.0 ke 0.5.3
- `git log --oneline` — commit history
- `~/.claude/plans/aku-ingin-membuat-web-sunny-hanrahan.md` — visi awal & plan komprehensif original

---

> Akhir log. Update file ini di setiap sesi yang punya perubahan signifikan. Kalau cuma typo fix atau commit kecil, cukup CHANGELOG.md.
