# Changelog

Semua perubahan penting didokumentasikan di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/) dan semver.

## [Unreleased]

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
