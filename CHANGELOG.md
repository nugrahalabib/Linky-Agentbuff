# Changelog

Semua perubahan penting didokumentasikan di sini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/) dan semver.

## [Unreleased]

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
