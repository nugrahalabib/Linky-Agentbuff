# Changelog

Semua perubahan penting didokumentasikan di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/) dan semver.

## [Unreleased]

### BREAKING — Auth is now Google OAuth only
- **Login dirombak total ke Google OAuth** (OAuth2 authorization-code + PKCE + state), implementasi manual tanpa dependency baru. Email/password login **dihapus** (route signup/login/change-password dihapus; `/signup` → redirect `/signin`). User lama otomatis ter-link via email saat login Google pertama.
- **Colokan SSO**: provider OIDC generik (`src/lib/oauth.ts`) yang auto-aktif dari env `SSO_OIDC_*` — sambungkan Keycloak/Auth0/Azure AD/Okta tanpa ubah kode. Routing generik `/api/auth/oauth/[provider]/{start,callback}`.
- **Migration 0012**: `users.image/oauth_provider/oauth_subject` + unique index. Fitur password per-link **tetap ada** (beda dari login).
- Settings "Keamanan": hapus ganti-sandi (kelola sesi tetap); hapus akun cukup konfirmasi email.
- Tutorial lengkap: **docs/AUTH-GOOGLE-SETUP.md**. Env baru: `GOOGLE_CLIENT_ID/SECRET` + opsional `SSO_OIDC_*`.

### Added (lanjutan penyelesaian fitur)
- **A/B Testing + Geo Targeting editor UI** — tab "Targeting" baru di detail link (sebelumnya endpoint-only): A/B sampai 4 varian berbobot + preview share% + tabel hasil; geo sampai 20 aturan negara→URL.
- **Webhook retry (exp-backoff)** — in-process scheduler 1m/5m/30m (maks 4 attempt), retry hanya pada network error / 5xx / 429; `X-Linky-Delivery-Id` stabil + `X-Linky-Delivery-Attempt`.
- **Ops**: `scripts/backup.sh` (SQLite `.backup`/`pg_dump` + retensi) dan `.github/workflows/deploy.yml` (deploy SSH ter-gate: verify → compose build/migrate/up → smoke health).

### Removed
- Dead code `src/components/shorten-form.tsx` (tidak dirender di mana pun).
- Index `links_anon_owner_idx` yang tidak terpakai (migration 0013) — kolom anon tetap (masih dipakai).

### Security (hardening 2026-06-04)
- **Webhook SSRF guard**: `POST /api/webhooks` & `PATCH /api/webhooks/[id]` menolak URL yang menunjuk ke alamat loopback/private/link-local/cloud-metadata atau skema non-http(s) (mencegah server fetch ke `127.0.0.1` / `169.254.169.254`).
- **Safe Browsing internal-host detection diperluas**: helper baru `isInternalHost`/`isUnsafeRequestUrl` menangkap IPv6 (`::1`, `fc00::/7`, `fe80::/10`), seluruh `127.0.0.0/8`, `0.0.0.0`, serta IPv4 ber-encoding desimal/hex (mis. `2130706433`, `0x7f000001`). + test baru.
- **HSTS** (`Strict-Transport-Security`) ditambah di `next.config.ts`.
- **Content-Security-Policy (Report-Only)** ditambah di `next.config.ts` (observasi dulu, belum blocking — perlu tuning sebelum di-enforce karena iframe cloak `/c/[slug]`).

### Added
- **Edit tag & UTM recipe**: endpoint `PATCH /api/tags/[id]` & `PATCH /api/utm-recipes/[id]` (validasi + guard unik) + UI edit (tombol pensil, panel ubah) di `tag-manager.tsx` & `utm-recipe-manager.tsx`. Sebelumnya keduanya hanya create+delete.
- **REST API v1 honor `tagIds`**: `POST` & `PATCH /api/v1/links` kini benar-benar menyimpan tag (workspace-scoped) — sebelumnya `tagIds` diterima tapi diam-diam dibuang.

### Changed
- next/font (Inter/JetBrains Mono) di-bridge ke token `@theme` (`--font-sans`/`--font-mono` kini `var(--font-inter)`/`var(--font-jetbrains)` dengan fallback) agar font yang di-download benar-benar dipakai.
- Anonymous shorten **ditegaskan DITOLAK by design**: pembuatan link wajib login (keputusan owner). `/api/shorten` authed-only adalah perilaku yang benar.

### Fixed (audit codebase 2026-06-04 — doc/kode disinkronkan + bug nyata)
- **REST API v1 `/api/v1/qr`**: param tidak valid (mis. `fg=red`, `size=9999`) sekarang balas `400 validation_error` standar, bukan `500` (ganti `qrConfigSchema.parse` → `safeParse`).
- **Folder integrity**: `DELETE /api/folders/[id]` sekarang mempromosikan sub-folder satu level ke atas (sebelumnya jadi yatim karena `parent_id` tidak punya FK). `PATCH /api/folders/[id]` memvalidasi `parentId` (harus milik workspace, bukan diri sendiri, dan menolak loop).
- **Cross-workspace integrity**: `POST /api/links/bulk` (move_folder), `PATCH /api/links/[id]`, dan `PATCH /api/v1/links/[id]` kini memvalidasi `folderId` milik workspace (sebelumnya bisa menunjuk folder workspace lain / memicu 500 FK).
- **Safe Browsing pada update**: `PATCH /api/links/[id]` dan `PATCH /api/v1/links/[id]` kini menjalankan `checkUrlSafety` saat `destinationUrl` berubah (sebelumnya hanya dicek saat create — celah bait-and-switch).
- **A/B sticky consistency**: ekstraksi client-IP disatukan via `clientIpFromHeaders` (utils) di `[slug]`, `/c/[slug]`, `/p/[slug]` — sebelumnya cloak/password path hanya baca `x-forwarded-for` sehingga variant A/B yang dicatat bisa beda dari yang ditampilkan di balik Cloudflare. Country header pada password gate diselaraskan ke `cf-ipcountry`.
- **Password gate** kini melewati `recordClick` untuk bot (konsisten dengan path utama; sebelumnya menyisipkan baris klik `is_bot=true`).
- **Linky Page tracking**: editor preview (`pageId="preview"`) tidak lagi mengirim POST 404 ke `/api/linky-pages/preview/click`. Endpoint click kini no-op untuk halaman draft/unpublished dan memfilter bot — view tidak lagi gampang di-inflate.

### Removed / config
- Hapus script `db:seed` yang rusak (`scripts/seed.ts` tidak ada).
- Hapus field `packageManager: pnpm@10.24.0` dari `package.json` (toolchain sebenarnya npm — `package-lock.json`, Docker & CI pakai `npm ci`).

### Docs (disinkronkan dengan kode setelah audit menyeluruh)
- **README/CLAUDE.md/ARCHITECTURE.md**: koreksi klaim "anonymous shortener" — `/api/shorten` faktanya authed-only, `ANON_DAILY_LIMIT` tidak dipakai, `shorten-form.tsx` dead code. Ditambah catatan "Known gaps" + keputusan re-enable vs hapus.
- README test count 94 → 119; Postgres adapter "siap" → "eksperimental & belum lengkap".
- CLAUDE.md: `recordClick` sinkron (bukan async); bot filter memang mengecualikan WhatsApp/Telegram (benar untuk shortener); `parent_id` tanpa FK; tambah `links-browser.tsx`/`workspace.ts`, ganti `utm-recipe-form.tsx`→`utm-recipe-manager.tsx`; build = `next build` (webpack), Turbopack hanya dev.
- ARCHITECTURE.md: tulis ulang lifecycle §3A (authed-only), perjelas §3B webhook hanya dari `/api/links`, koreksi sketsa test-shim, `hashIp` (salt:ip, truncated 24), glossary "Anonymous link".
- SESSION-LOG.md state snapshot versi 0.5.3 → 0.5.4.

## [0.5.4] - 2026-06-04

### Documentation overhaul (untuk session continuity)
- **CLAUDE.md** ditulis ulang total sebagai master onboarding doc — TL;DR, Quickstart, lingkungan khusus Windows App Control, arsitektur tingkat tinggi, struktur folder lengkap, data model 12 migrations, konvensi code (server vs client, error handling, validation, tests, UI tone), REST API surface, webhooks, redirect hot path, CSV import, settings page, auth & security, env vars, scripts, CI/CD, production deploy, roadmap, workflow untuk sesi baru, filosofi & tone, anti-patterns. Target: sesi baru bisa langsung lanjut tanpa kembali ke sesi sebelumnya.
- **docs/ARCHITECTURE.md** baru — deep technical reference 16 section:
  1. System overview dengan diagram
  2. Setiap tabel DB dijelaskan (kolom, indices, foreign keys)
  3. Request lifecycles (anon shorten, authed shorten, redirect hot path, password gate, API v1 create)
  4. Authentication & authorization (session flow, API key validation, workspace isolation)
  5. REST API v1 internal design (response format, code stability, rate limit headers, CORS, serializer)
  6. Webhook delivery system (fire flow, deliverOne, receiver verification, retry policy)
  7. CSV import pipeline (parseCsv detection, autoMap, detectProvider, endpoint flow, UI wizard)
  8. Analytics & click tracking
  9. QR code generation
  10. Linky Pages (link-in-bio)
  11. Safe Browsing & anti-abuse
  12. Frontend patterns
  13. Testing infrastructure
  14. Performance targets & bottlenecks
  15. Deployment topology (self-host VPS, Vercel, CF Workers future)
  16. Migration strategy SQLite → Postgres
- **docs/SESSION-LOG.md** baru — comprehensive session timeline April-June 2026 dengan:
  - State snapshot
  - Konteks user (profil, preferensi, cara feedback, anti-patterns)
  - Timeline chronological dari awal MVP ke v0.5.3
  - Audit trail (cross-workspace pen-test, rate limit verification, webhook signature E2E, settings destructive ops, CSV import Bit.ly format, deep link swap fix)
  - Decisions log (mengapa SQLite, mengapa node:test, mengapa single-user, mengapa port 1709, dll.)
  - Known issues / TODOs
  - Anti-patterns yang pernah ditemui
  - Workflow resume untuk sesi berikutnya

### Changed
- Bump version 0.5.3 → 0.5.4 untuk track docs release

## [0.5.3] - 2026-04-26

### Fixed (CSV Import bugs nyata)
- **iOS/Android deep link tertukar** — `iosUrl` malah ambil dari kolom `android_url` dan sebaliknya. Sekarang benar.
- **Bit.ly export gagal langsung** — Bit.ly pakai `long_url` (bukan `destination_url`). Sekarang auto-detect alias dari 5 platform.
- **BOM Excel** — `﻿` di awal CSV bikin header pertama tidak match. Sekarang di-strip.
- **Delimiter** — CSV Excel EU pakai `;`, TSV pakai `\t`. Sekarang auto-detect (sniff non-quoted occurrences).

### Added (Migrasi profesional yang beneran bisa dipakai)
- **Auto-detect provider** dari header (Bit.ly / Rebrandly / TinyURL / Dub.co / Short.io / Linky template / unknown).
- **Field alias map (50+ alias)** — `long_url`/`originalurl`/`url`/`destination`/`target` semua → `destination_url`. `slashtag`/`key`/`path` → slug. dst.
- **3-step wizard UI**:
  1. Upload (drag-drop atau paste, support .csv/.tsv)
  2. Map kolom — tabel "Field Linky → Kolom CSV" dengan auto-map + dropdown override per field, opsi conflict mode + folder default + tag default
  3. Preview & commit — sample 10 baris pertama dengan field hasil mapping, daftar tag baru yang akan dibuat, daftar issue
- **Conflict resolution** — `skip` (default) / `rename` (auto-suffix `-1`, `-2`, ...) / `fail`. Verified end-to-end.
- **Tags auto-create** — parse cell `marketing|launch` atau `marketing,launch`, auto-create tag yang belum ada di workspace, link otomatis di-tag.
- **Default folder + default tag** — opsional, terapkan ke semua link hasil import.
- **Error report download** — endpoint `POST /api/links/import/error-report` serve CSV `row, error, original_data` untuk semua issue.
- **Provider migration guide** — accordion di `/dashboard/import` dengan langkah export dari masing-masing platform + sample CSV download per provider + link ke docs official.
- **Page judul + subjudul disempurnakan** — "Migrasi & Import CSV" dengan deskripsi yang menjelaskan kapabilitas.

### Validators / API
- `/api/links/import` body baru: `mapping?: Partial<Record<FieldKey, number|null>>`, `conflict: 'skip'|'rename'|'fail'`, `defaultFolderId?`, `defaultTagIds?: string[]`.
- Response preview: `provider`, `delimiter`, `headers`, `mapping`, `tags_to_create[]`, `issues[]` dengan field `original` per issue.
- Issues array boleh sampai 100 entries (dari 50).

### Tests
- 25 unit test baru: `csv.test.ts` (BOM strip, delimiter detect, escaped quotes, semicolon EU format) + `csv-mapping.test.ts` (autoMap untuk 5 platform, detectProvider, parseTagsCell).
- **Total 119/119 tests pass**.

### Verified end-to-end (cURL + DB inspection)
- Bit.ly format: 3 link + 3 tag dibuat, link↔tag association benar.
- Rebrandly format: provider detected, slashtag → slug.
- BOM + semicolon: stripped + delimiter detected, mapped correctly.
- Conflict modes: fail/skip/rename behave sesuai spec.
- Deep link import: ios_url ke `apps.apple.com`, android_url ke `play.google.com` (bukan tertukar).
- Error report download → CSV bersih dengan 3 kolom.

## [0.5.2] - 2026-04-26

### Added
- **Settings page redesign — 6 functional tabs:**
  - **Profil**: edit nama, locale (id/en). Email tetap read-only.
  - **Keamanan**: ganti password (verify current, reject same-as-old, auto-revoke other sessions setelah ganti). Sessions list dengan device/OS/browser detection, last-seen timestamp, tombol revoke per-sesi + "Logout dari semua device lain".
  - **Workspace**: edit nama + slug (validate unique), tampilkan domain produksi + tanggal dibuat.
  - **Tampilan**: tema (Light/Dark/System) + density (Comfortable/Compact), persisted di localStorage.
  - **Data & statistik**: KPI count (link/clicks/Linky Pages/API key/webhook), member-since, ekspor JSON lengkap (link + clicks + folder + tag + Linky Pages + UTM recipes).
  - **Danger zone**: hapus semua link (konfirmasi ketik nama workspace) + hapus akun permanen (konfirmasi ketik email + password). Cascade delete via FK ON DELETE CASCADE — verifikasi: semua tabel related ter-purge.
- **API endpoints baru:**
  - `PATCH /api/auth/profile` (validator `updateProfileSchema`)
  - `POST /api/auth/change-password` (validator `changePasswordSchema`, rejects same-as-old)
  - `GET /api/auth/sessions` + `DELETE /api/auth/sessions/[id]` + `POST /api/auth/sessions/revoke-others`
  - `PATCH /api/workspace` (validator `updateWorkspaceSchema` dengan slug uniqueness check)
  - `GET /api/account/stats`
  - `GET /api/account/export` (JSON download dengan Content-Disposition)
  - `POST /api/account/wipe-links` (memerlukan ketik nama workspace)
  - `DELETE /api/account` (validator `deleteAccountSchema` — email + password)
- **Session metadata** — sessions table tambah `userAgent`, `ipHash`, `lastSeenAt`. `createSession` auto-populate dari request headers. `getSessionUser` update `lastSeenAt` setiap request.

### Migrations
- `0011_session_metadata` — ALTER sessions ADD COLUMN user_agent, ip_hash, last_seen_at.

### Verified end-to-end
- Auth gate: 9/9 endpoint return 401 tanpa session.
- Happy path: profile update, workspace rename, stats, export download semua sukses.
- Password change: wrong current rejected, same-as-old rejected, valid sukses → login dengan password baru works + login lama gagal.
- Sessions: cannot revoke current session (proper UX), revoke-others kills others & keeps current.
- Wipe links: wrong confirm rejected, correct confirm hapus 3 link → stats links 0.
- Delete account: wrong password/email rejected → real delete cascade-purges users + workspaces + sessions + links (verified all 0 in DB).
- 94/94 tests pass · TypeScript zero error · production build sukses.

## [0.5.1] - 2026-04-26

### Removed
- **Team / Multi-user workspaces feature** — semua kode collaboration dihapus total atas permintaan user (single-user product fit lebih sederhana).
  - Routes dihapus: `/dashboard/team`, `/api/workspace/{members,invitations,switch}`, `/api/workspace` (GET/POST list/create), `/invite/[token]`.
  - Komponen dihapus: `TeamManager`, `WorkspaceSwitcher`, `AcceptInviteButton`.
  - DB migration `0010_drop_team` — DROP `workspace_members`, `workspace_invitations`, ALTER `users` DROP `active_workspace_id`.
  - Schema bersih dari `workspaceMembers`, `workspaceInvitations`, type `WorkspaceRole`.
  - `lib/workspace.ts` disederhanakan: `getActiveWorkspace(userId)` sekarang hanya cari workspace owned-by-user dan auto-create kalau belum ada. Setiap user punya 1 workspace (Pribadi).
  - `lib/auth.ts` `getSessionUserWithWorkspace()` tidak lagi return `role`.
  - Sidebar dashboard + Cmd+K palette dibersihkan dari item "Tim".
- README section "Multi-user workspaces" dihapus.

### Verified
- 94/94 unit tests pass · TypeScript zero error · Production build sukses · Zero referensi tersisa di src.

## [0.5.0] - 2026-04-26

### Added
- **REST API v1 lengkap** (`/api/v1/*`) — Bearer auth, CORS terbuka, rate-limit 120 req/menit/key, standard error format `{ error: { code, message }, request_id }`. Endpoint: `links` (GET list, POST create, GET/PATCH/DELETE per id), `analytics/workspace`, `analytics/links/{id}`, `qr` (svg/png), `me`. Setiap response carry `X-RateLimit-*` headers. OPTIONS preflight ditangani.
- **Webhook delivery beneran** — `link.clicked` (dari redirect), `link.created` / `link.updated` / `link.deleted` (dari API + UI). HMAC-SHA256 signature di header `X-Linky-Signature`, plus `X-Linky-Event` + `X-Linky-Delivery-Id`. 5s timeout, response snippet captured.
- **Webhook deliveries log** — table `webhook_deliveries` (50 terakhir per webhook, auto-prune). Endpoint `/api/webhooks/{id}/deliveries` dan `/api/webhooks/{id}/test` untuk fire test event.
- **Public API docs** — `/docs/api` dengan TOC sidebar, "Cara dapat API key" step-by-step, Quickstart 60 detik (cURL/Node/Python/PHP), reference semua endpoint, error code table, webhook signature verifier (Node/Python/PHP), retry policy, Cookbook 5 resep nyata (bulk CSV import, Express receiver, Python QR export, daily Slack digest, bulk PATCH), changelog.
- **OpenAPI 3.1 spec** di `/docs/openapi.json` — siap diimport ke Postman/Insomnia/openapi-generator.
- **Dashboard Developer di-revamp** — 4 KPI cards (keys, webhooks, deliveries 7-hari, base URL), tabs (Quickstart / API Keys / Webhooks / Test Console). WebhookManager: per-row test button, deliveries log dengan status pill, signing-secret reveal/copy, pause/resume toggle. ApiTestConsole: pick endpoint, paste key, kirim live request dari browser. ApiKeyManager: dropdown kadaluwarsa (Never/30/90/365 hari) + per-key Last-used + Kadaluwarsa display.
- **PATCH webhook endpoint** — toggle `active`, edit `url` / `events`.
- **`link.updated` webhook event** — di-emit dari PATCH /api/links/{id} dan /api/v1/links/{id}.

### Migrations
- `0009_webhook_deliveries` — adds `webhook_deliveries` table + index.

### Verified end-to-end
- Auth gate: anonymous (401), bogus token (401), key issuance route requires session.
- Cross-workspace isolation: workspace A tidak bisa GET/PATCH/DELETE link workspace B (semua 404).
- Revocation: expired key → 401, deleted key → 401, langsung berlaku.
- Rate limit: 130 req → tepat 120 sukses + 10 rate-limited.
- Webhook signature: receiver Express verify HMAC → 4/4 event valid (link.created/clicked/updated/deleted).
- 94/94 unit tests pass, TypeScript zero error, production build sukses.

## [0.4.0] - 2026-04-23

### Added
- **A/B Testing (Linky Split)** — hingga 4 varian per link dengan weight, sticky assignment per IP, dan stats endpoint `/api/links/:id/ab-stats`.
- **Geo Rules** — endpoint `/api/links/:id/targeting` untuk set rule per country → URL.
- **Branded QR Studio 2.0** — logo upload (data URI ke `/api/qr-branded`), gradient fill, shape eye (square/rounded/dots), frame text CTA, preset (Minimal/Linky Gradient/Playful Dots/Neon/Sunset).
- **Linky Page (link-in-bio)** — schema `linky_pages` + `linky_page_clicks`, editor split-view dengan 8 block types (header/link/social/text/divider/youtube/image/countdown), 5 theme presets (creator/minimal/neon/student/umkm), 4 button styles, rendering publik di `/@username` dengan SSR OG tags, click tracking per-block.
- **Developer Platform** — `/dashboard/developer` page dengan API key manager + webhook manager. Public REST API di `/api/v1/links` dengan Bearer token auth (keys di-hash SHA-256, prefix ditampilkan, token penuh hanya sekali). Webhooks dengan HMAC-SHA256 secret.
- **Abuse Report** — public form di `/report?slug=...` + endpoint `/api/abuse-reports`.
- **PWA** — `manifest.webmanifest` + theme color + install-ready.
- **SEO** — `/robots.txt` + `/sitemap.xml` dengan dashboard/api/gate pages di-disallow.
- **Deploy artifacts** — multi-stage `Dockerfile`, `docker-compose.yml` (linky + caddy + volumes), `Caddyfile` dengan auto-TLS + HSTS, `.env.production.example`, `SECURITY.md`.

### Changed
- `resolve-link.ts`: `pickTargetUrl` sekarang returns `{ url, variant? }` dan menerima `ipHashSource` untuk A/B sticky assignment.
- `clicks` table: tambah kolom `ab_variant`; `recordClick` menerima `abVariant`.
- Dashboard sidebar: tambah "Linky Pages" (primary) + "Developer" (secondary).
- Cmd+K palette: tambah shortcut untuk Linky Pages & Developer.

### Migrations
- `0003_ab_variants` — adds `links.ab_variants` + `clicks.ab_variant` + index.
- `0004_linky_pages` — adds `linky_pages` + `linky_page_clicks` tables.
- `0005_webhooks` — adds `webhooks` table.

## [0.3.0] - 2026-04-23

### Added
- Folders (nested, colored) + Tags (colored, assignable) + search with filters
- Cmd+K command palette dengan 13 shortcut
- CSV Import (10k rows, preview + commit) + CSV Export
- Bulk operations (archive/unarchive/delete/move folder)
- UTM Recipes dengan 6 preset
- OG preview override + link cloaking via `/c/:slug`

## [0.2.0] - 2026-04-23

### Added
- Postgres VPS setup (`postgres_container`, role `linky_user`, DB `linky`)
- Dual-dialect DB layer preparation + migration runner
- Redis client with graceful degraded mode (ioredis)
- Pino structured logger
- Healthcheck endpoint `/api/health`
- 86 unit tests via `node --test` (Vitest-style shim)
- GitHub Actions CI workflow

## [0.1.0] - 2026-04-22

Initial MVP: shorten, redirect, password, expiration, deep link, UTM, QR, basic analytics, signup/signin, dashboard.
