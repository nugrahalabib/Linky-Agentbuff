# Linky — Roadmap Production-Ready (Full Scope)

> **Tujuan:** Menjadi produk utuh setara **Bit.ly + Dub.co + Linktree** sebelum deploy ke `linky.agentbuff.id`. Tidak ada istilah MVP — setiap fitur harus matang, teruji, aman, dan terdokumentasi.
>
> **Target deploy target:** Hostinger VPS pribadi, domain `linky.agentbuff.id`.
>
> **Current state:** v0.1 functional core (shorten, redirect, password, expiration, deep link, UTM, basic QR, basic analytics, single-user auth).

---

## 1. Definition of "Ready" — 7 Pilar

Produk hanya bisa disebut siap deploy jika **SEMUA** pilar tercentang:

### A. Feature Completeness
- [ ] Semua fitur di roadmap v1.0 + v2.0 (dari plan awal) terimplementasi
- [ ] Tidak ada tombol/halaman yang "coming soon"
- [ ] Setiap fitur ada dokumentasi pengguna

### B. Quality Completeness
- [ ] Unit test coverage ≥ 80% di `src/lib/`
- [ ] E2E test mencakup 10 user journey kritis
- [ ] Load test: 1000 rps redirect, p95 < 100ms
- [ ] Lighthouse score ≥ 95 di 5 halaman utama
- [ ] axe-core scan: 0 critical issues
- [ ] Gitleaks + npm audit: 0 high/critical vulnerabilities

### C. Security Completeness
- [ ] OWASP Top 10 checklist clear
- [ ] Google Safe Browsing v5 aktif
- [ ] Rate limiting + Turnstile CAPTCHA terpasang
- [ ] Secrets via env vars, bukan code
- [ ] TLS end-to-end

### D. Operations Completeness
- [ ] Docker Compose one-liner untuk deploy
- [ ] Database backup otomatis + restore tested
- [ ] Monitoring dashboard jalan
- [ ] Alert channel (email/Telegram) teruji
- [ ] Zero-downtime deploy via GitHub Actions
- [ ] Rollback plan teruji

### E. Legal Completeness
- [ ] Terms of Service (ID + EN)
- [ ] Privacy Policy (UU PDP compliant)
- [ ] Cookie consent banner
- [ ] DMCA + abuse report flow + transparency report template

### F. Documentation Completeness
- [ ] README lengkap dengan quickstart + deploy guide
- [ ] API docs dengan OpenAPI 3.1
- [ ] CONTRIBUTING.md + CODE_OF_CONDUCT.md
- [ ] CHANGELOG.md
- [ ] User help docs (FAQ, tutorial)

### G. Launch Completeness
- [ ] Domain + DNS + TLS aktif di `linky.agentbuff.id`
- [ ] Email transaktional jalan (signup, reset password)
- [ ] Status page
- [ ] Seed demo data untuk screenshot marketing
- [ ] Social OG image generator

---

## 2. Upgrade Arsitektur (Foundation)

### 2.1 Database migration SQLite → Postgres
**Kenapa:** SQLite tidak scale + susah backup jika VPS shared + concurrent writes lambat.
**Rencana:**
- Tambah adapter Drizzle: `drizzle-orm/postgres-js` + `postgres` driver
- Env detection: jika `DATABASE_URL` mulai `postgres://` pakai postgres, else SQLite (dev)
- Schema SQLite → Postgres: ubah `integer` ke `bigserial`/`timestamp`/`jsonb`
- Migration script baru di `scripts/migrate-pg.ts`
- Dev tetap SQLite untuk cepat, prod Postgres

### 2.2 Redis cache + rate limit
**Kenapa:** Hot-path redirect harus cepat (< 20ms DB lookup bukan ideal di Postgres cold), rate limit butuh state cross-request.
**Rencana:**
- Container Redis 7 di docker-compose
- `src/lib/cache/redis.ts` — wrapper dengan timeout + fallback ke DB
- Redirect handler: Redis lookup dulu (TTL 5 menit), miss → DB + write-back
- Rate limit bucket per IP (signup, shorten, unlock password) pakai Redis `INCR`+`EXPIRE`
- Invalidasi on update link (PATCH/DELETE)

### 2.3 Observability
- OpenTelemetry traces untuk redirect + API
- `/api/health` endpoint (DB ping + Redis ping)
- `/api/metrics` Prometheus format
- Grafana container optional, default log ke stdout JSON
- Log rotation via Docker log-driver

### 2.4 Background job runner
**Kenapa:** Analytics rollup, email queue, abuse scan.
**Rencana:** `node-cron` di dalam Next.js app (Worker process terpisah) atau container `linky-worker` sendiri:
- Setiap 5 menit: rollup analytics harian
- Setiap 1 jam: clean expired sessions
- Setiap 24 jam: vacuum, prune clicks > 90 hari (configurable)
- Email queue drain (retry exponential)

---

## 3. Feature Completeness — Core

### 3.1 Folders + Tags + Search
- **Folders nested 3-level** di sidebar kiri, drag-drop pindah link
- **Tags warna** multi-pilih, creator di header
- **Search box global** (Cmd+K / ⌘K) — fuzzy match slug + destination + title
- Filter gabungan: folder + tag + tanggal + status
- Endpoint: `GET /api/links?folderId=...&tags=...&q=...`

### 3.2 Bulk operations
- **CSV Import** (up to 10.000 rows) via halaman `/dashboard/import`
  - Preview 10 baris dulu, validasi setiap baris, import atomic
  - Template CSV downloadable
- **CSV Export** semua link workspace dengan filter
- **Bulk edit**: select multiple → pindah folder / tag / archive / delete
- **Bulk QR**: select multiple → ZIP PNG (1024px) + SVG

### 3.3 UTM Builder + Recipes
- Builder UI di link detail: form source/medium/campaign/term/content
- **UTM Recipes** (templates): "Facebook Ads", "Google Ads", "TikTok", "Newsletter Weekly", custom
- Workspace-level saved recipes
- Preview URL generation real-time

### 3.4 A/B Testing ("Linky Split")
- Create up to 4 varian per link dengan weight
- Sticky assignment via hash(IP+slug) — user sama selalu dapat varian sama
- Dashboard: table per-varian click, CTR, conversions (jika conversion pixel dipasang)
- Indikator statistical significance (chi-squared test)
- Auto-promote varian winner (optional)

### 3.5 Geo/Device Targeting Rules
- UI editor rule-based (match condition → target URL):
  - Country matches (dropdown ISO)
  - Device matches (iOS/Android/Desktop)
  - Language header
  - Time of day
- Priority ordering via drag-drop
- Fallback ke destination default

### 3.6 Branded QR Studio (upgrade)
- **Logo upload** dengan auto background removal (client-side Remove.bg API / rembg-wasm)
- **Shape eye**: square / rounded / dots / leaf / star (qr-code-styling v2 client-side render)
- **Gradient**: linear / radial, 2-stop color
- **Frame**: border + CTA text ("Scan me", "SCAN UNTUK PROMO")
- **Error correction**: L/M/Q/H selector
- Preview real-time di canvas, export PNG (transparent bg), SVG, PDF
- "Print-ready pack" = ZIP 300/600/1200/3600 px + vector

### 3.7 Link Preview Editor
- Override Open Graph title/description/image per link
- Auto-fetch dari destination sebagai default (via server-side fetch)
- Scraper: cheerio parse `<meta>` tags
- Custom OG image generator dari template

### 3.8 Link Cloaking (iframe mask)
- Optional: tampilkan destination di dalam iframe dengan URL linky.agentbuff.id tetap di address bar
- Disclaimer banner "Dipersingkat oleh Linky" di footer iframe
- Disable untuk destination yang kirim `X-Frame-Options: DENY` (fallback redirect biasa)

---

## 4. Feature Completeness — Collaboration

### 4.1 Multi-user Workspaces
- Table `workspace_members` (sudah ada di schema MVP, sekarang diaktifkan)
- Roles: **Owner / Admin / Editor / Viewer / Billing**
- Invite flow via email token (7 hari expire)
- Permission matrix ditegakkan di setiap API endpoint
- Workspace switcher di header

### 4.2 Audit Log UI
- Setiap tulis (create/update/delete link, member invite, role change, API key, bulk op)
- Halaman `/dashboard/audit` dengan filter actor/action/date
- Retention 90 hari di free, export CSV

### 4.3 Komentar pada link
- Thread komentar per-link
- @mention member workspace → notifikasi email + in-app
- Resolve/unresolve

---

## 5. Feature Completeness — Linky Page (Link-in-bio)

### 5.1 Data model
- Table `linky_pages` (sudah disiapkan di schema)
- Table `linky_page_blocks` (ordered blocks)
- Subdomain claim `@username` atau custom domain
- `GET /@{username}` renders public page

### 5.2 Editor
- Split view: phone preview (iframe) + inspector kanan
- 12 block types: Header / Button / Social Row / YouTube / Spotify / TikTok / Instagram Post / Image / Text / Divider / Countdown / Form / Product
- Drag-drop reorder via dnd-kit
- Auto-save setiap 2 detik (debounced PATCH)

### 5.3 Templates
- 10 template starter (fully editable): Creator, Minimal, Neon, Ramadan, Student, UMKM, Artist, Musician, Developer, Podcast
- Template picker di page create

### 5.4 Customization
- Tema: 8 font pairing preset + color picker
- Background: solid / gradient / image upload / video loop (mp4 ≤ 5MB)
- Button style: filled / outline / soft / glass / neon
- SEO: title / description / OG image auto-generated

### 5.5 Analytics terintegrasi
- Page views + unique
- Per-block click-through
- Geo, referrer, audience growth
- Same dashboard sebagai link biasa

---

## 6. Developer Platform

### 6.1 REST API v1
- OpenAPI 3.1 spec (file `openapi.yaml`)
- Endpoint: full CRUD links + folders + tags + analytics + workspaces + api-keys + webhooks
- Cursor-based pagination (`cursor` + `limit`)
- Rate limit per API key (60 req/min free, configurable)
- Versioning via header `X-Linky-Version: 2026-04-01`
- Error format RFC 7807 Problem Details

### 6.2 API Keys
- Halaman `/dashboard/developer/keys`
- Create key: scopes (links:read, links:write, analytics:read, linky-pages:*, etc.)
- Show ONCE, simpan hash (SHA-256)
- Revoke, rotate, expire date
- Last-used tracking

### 6.3 Webhooks
- Event types: `link.created`, `link.updated`, `link.deleted`, `link.clicked`, `conversion.tracked`, `abuse.flagged`
- Subscribe di `/dashboard/developer/webhooks`
- HMAC-SHA256 signature di header `X-Linky-Signature`
- Retry: 3x exponential backoff jika non-2xx
- Deliveries log dengan payload + response status

### 6.4 SDKs
- **TypeScript**: `@linky/sdk` NPM package, full types dari OpenAPI
- **Python**: `linky-py` PyPI package
- Auto-generate via openapi-typescript-codegen di CI
- Contoh usage di docs

### 6.5 CLI
- `npx @linky/cli shorten https://...`
- `linky login` (device code flow)
- `linky links list/create/export`
- Cross-platform binary

### 6.6 API Docs site
- Fumadocs/Mintlify di subdomain `docs.linky.agentbuff.id`
- Interactive "Try it out" dari OpenAPI
- Tutorial per use-case

---

## 7. Safety & Anti-abuse

### 7.1 Destination classifier pipeline
Setiap shorten / slug check melewati pipeline:
1. Format URL + reserved/internal IP check
2. Punycode + homograph detection
3. Redirect chain analysis (max 3 hop, Head request)
4. **Google Safe Browsing v5** lookup (cache Redis 24h)
5. **PhishTank + URLhaus** mirror lookup (updated nightly via cron)
6. Heuristic rules (TLD age < 30 hari, encoded URL, credential harvest pattern)

Result:
- `safe` → normal
- `suspicious` → force preview page (user harus konfirmasi)
- `malicious` → block + masuk abuse queue

### 7.2 Rate limiting
- Redis-backed token bucket per IP + per user
- Tier berbeda: anonymous landing / auth signup / auth shorten / API key
- Cloudflare Turnstile pada: signup, password unlock, > N shorten/jam

### 7.3 Abuse reporting
- Public form `/report?slug=...` (tanpa login, honeypot + Turnstile)
- Admin queue di `/admin/abuse` (Owner role saja)
- Status: open / reviewing / resolved / rejected
- Email notifikasi ke `abuse@linky.agentbuff.id`
- **Transparency report** halaman publik, di-generate quarterly

### 7.4 Account abuse controls
- Auto-flag: > 10 link flagged dalam 24h → suspend pending review
- Appeal button one-click, SLA 48h
- Email verification wajib untuk: custom domain, bulk >100, API key
- Password strength meter via zxcvbn
- Login anomaly detection (new device → email alert)

---

## 8. Platform & UX Polish

### 8.1 Internationalization (i18n)
- **10 bahasa launch**: Indonesia (default), English, Spanish, Portuguese BR, French, German, Japanese, Arabic (RTL), Hindi, Vietnamese
- next-intl dengan pesan JSON per-namespace
- RTL support via `dir="rtl"` + logical CSS properties
- Locale-aware: tanggal, angka, timezone (default Asia/Jakarta untuk `.id` IP)
- Language switcher di settings + auto-detect dari `Accept-Language`

### 8.2 Accessibility (WCAG 2.2 AA)
- Kontras semua warna ≥ 4.5:1 body, 3:1 UI
- Keyboard-only nav: semua action reachable, skip-link, focus ring visible
- Screen reader: landmarks, aria-live untuk toast, chart data tersedia sebagai table
- `prefers-reduced-motion` honored
- Touch targets ≥ 44×44px
- axe-core pass di CI untuk 10 halaman kritis

### 8.3 PWA
- `manifest.webmanifest` dengan icon 192/512/maskable
- Service worker (Workbox): cache shell + offline fallback
- Install prompt edukasi
- Background sync untuk bulk operations

### 8.4 Keyboard shortcuts
- `⌘K` / `Ctrl+K` command palette (cmdk library)
  - Quick actions: Buat link, Cari link, Lihat analitik, Ke QR studio, Toggle theme, Logout
- `C` create link, `/` fokus search, `?` help panel

### 8.5 Dark mode
- Sudah otomatis; tambah: manual toggle di settings (sistem / light / dark)
- Simpan preferensi di cookie + DB

### 8.6 Email notifications
- Templates: welcome, email verification, password reset, magic link, weekly digest, abuse alert, webhook delivery failure, quota warning
- Provider: Resend (fallback SMTP Hostinger)
- `react-email` templates, brand-consistent design
- Unsubscribe link untuk digest

### 8.7 In-app onboarding tour
- `driver.js` 5-step tour pertama kali login
- Dismissable, recall di help menu
- Progress "Setup checklist" di dashboard pertama kali

---

## 9. Auth Completeness

- Magic link (email-only flow)
- 2FA TOTP dengan backup codes
- Password reset via email token
- Email verification required untuk: custom domain, bulk > 100, API key
- Session management: lihat semua sesi aktif, revoke per-device
- OAuth social login: Google, GitHub, Apple (optional)

---

## 10. Performance Engineering

### 10.1 Redirect hot path optimization
- Redis read-through cache (target: < 10ms total hop)
- Pre-warm cache untuk top 100 links per workspace
- HTTP/2 + Brotli compression
- Load test target: **1000 rps sustained, p95 < 100ms, p99 < 200ms**

### 10.2 Database tuning
- Indexes reviewed via EXPLAIN ANALYZE
- Connection pooling (pgBouncer atau pg-pool)
- Slow query log > 50ms

### 10.3 Bundle & frontend
- Next.js turbopack prod
- Budget: landing < 150KB gzipped first load, dashboard < 200KB
- Image optimization: AVIF/WebP
- Font subset (Inter latin + ext-latin only)

### 10.4 Edge vs Node
- Opsional: redirect route di-refactor jadi edge-compatible (tanpa better-sqlite3) pakai HTTP call ke Postgres via Supabase pooler — **TAPI** karena kita self-host, tetap Node + Redis cukup
- Node cluster mode via PM2 / built-in

---

## 11. Testing & Quality

### 11.1 Unit tests (Vitest)
- Target coverage ≥ 80% di `src/lib/`
- Harus cover: `resolve-link`, `analytics`, `clicks`, `slug`, `validators`, `auth` (password hash, JWT), `qr`, `utils`

### 11.2 Integration tests
- API route handlers dengan supertest + PGlite (in-memory Postgres)
- Auth flow end-to-end

### 11.3 E2E tests (Playwright)
- 10 journey kritis:
  1. Signup → verify email → buat link → redirect
  2. Login → edit link → QR download
  3. Password-protected link: visitor unlock
  4. Bulk CSV import → preview → commit
  5. A/B test setup → split traffic verifikasi
  6. Team invite → accept → role test
  7. API key create → REST call sukses
  8. Webhook create → delivery received
  9. Linky Page build → publish → public view
  10. Abuse report → admin review → resolve

### 11.4 Load testing
- k6 script: 1000 rps redirect, ramp-up pattern
- Output: latency distribution, error rate, bottleneck identification

### 11.5 Security tests
- Gitleaks di CI (pre-push + on PR)
- npm audit + Snyk
- OWASP ZAP baseline scan
- Manual pentest checklist (checkist di `SECURITY.md`)

### 11.6 Accessibility
- `@axe-core/playwright` inject ke E2E tests, fail jika violation > 0 critical
- Manual NVDA / VoiceOver pass pada 5 halaman kunci

### 11.7 Visual regression (optional)
- Chromatic/Percy untuk komponen utama

---

## 12. Legal, Documentation & Content

### 12.1 Legal
- `/legal/terms` (ID + EN) — Draft by user, consult lawyer rekomendasi
- `/legal/privacy` — comply UU PDP (Indonesia) + GDPR basics
- `/legal/cookies` + banner consent (cookie-consent library)
- `/legal/dmca` — takedown form + email `dmca@linky.agentbuff.id`
- `/legal/abuse` — report form

### 12.2 User-facing docs
- Help Center di `/help` atau subdomain `help.linky.agentbuff.id`
- Topics: Getting started, Custom domain setup, Branded QR, API authentication, Webhooks, Billing, FAQ
- Search via Pagefind/Flexsearch

### 12.3 Developer docs
- API reference (OpenAPI rendered)
- Tutorials: Quickstart, Authentication, Rate limits, Webhooks, SDKs
- Changelog

### 12.4 Marketing pages
- `/` landing (existing, polish)
- `/features/analytics` — deep dive
- `/features/qr-studio`
- `/features/linky-pages`
- `/features/api`
- `/pricing` (all free, donate tier)
- `/about`
- `/contact`
- `/blog` (optional, WordPress-like via markdown)
- `/changelog`

### 12.5 Branding assets
- Logo variations: icon-only, stacked, horizontal, monochrome
- Favicon pack (16/32/180/192/512)
- Social OG image per halaman (auto-generated via `/api/og`)
- Brand guidelines doc `docs/BRAND.md`

---

## 13. Deployment ke Hostinger VPS

### 13.1 VPS preparation
- OS: Ubuntu 22.04 LTS minimum
- User non-root dengan sudo
- SSH key-only login (disable password)
- UFW firewall: 22, 80, 443 saja
- Fail2ban
- Automatic security updates

### 13.2 Runtime stack
- Docker + Docker Compose v2
- Containers:
  - `linky-app` (Next.js)
  - `linky-worker` (cron + webhooks + emails)
  - `postgres:16-alpine`
  - `redis:7-alpine`
  - `caddy:2-alpine` (reverse proxy + auto-TLS)
- Shared Docker network `linky-net`
- Named volumes: `pg-data`, `redis-data`, `caddy-data`, `upload-data`

### 13.3 Caddy reverse proxy
```caddyfile
linky.agentbuff.id {
  reverse_proxy linky-app:1709
  encode gzip zstd
  header { Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" }
}
docs.linky.agentbuff.id {
  reverse_proxy linky-docs:3000
}
```
Auto-TLS via Let's Encrypt.

### 13.4 Secrets management
- File `.env.production` di VPS, mode 600, owned by deploy user
- Secrets: `AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`, `GOOGLE_SAFE_BROWSING_KEY`, `TURNSTILE_SECRET`
- Never di git — contoh di `.env.example`

### 13.5 CI/CD via GitHub Actions
Workflow `.github/workflows/deploy.yml`:
1. On push `main`: run lint + typecheck + unit tests + build
2. On tag `v*`: build Docker image, push to ghcr.io, SSH ke VPS, `docker compose pull && up -d`
3. Smoke test: curl healthcheck endpoint
4. Rollback step jika smoke gagal

### 13.6 Database backup
- `pg_dump` setiap 6 jam ke object storage (Backblaze B2 atau Hostinger storage)
- Retention 30 hari daily + 12 bulan monthly
- Script `scripts/backup.sh` + cron
- Restore drill tested di staging

### 13.7 Monitoring
- Uptime monitor eksternal: UptimeRobot (free) cek `/api/health` tiap 5 menit
- Internal: Grafana + Prometheus (optional heavy)
- Alert: Telegram bot channel pribadi
- Log aggregation: stdout → docker logs → rotate

### 13.8 Zero-downtime deploy
- Rolling update: `docker compose up -d --no-deps --build linky-app` (Caddy auto-retry)
- Smoke test 3x sebelum declare healthy
- Rollback: tag rollback ke image lama

### 13.9 Post-deploy
- DNS check: `linky.agentbuff.id` A record → VPS IP
- TLS check: SSL Labs A+ rating
- Performance: GTmetrix / PageSpeed > 90
- Functional: signup flow live test dari HP + desktop

---

## 14. Urutan Eksekusi (Recommended Phases)

Saya rekomendasikan **10 fase berurutan**, masing-masing punya "definition of done" jelas. Setiap fase diakhiri commit + tag di GitHub.

### Fase 1 — Foundation Upgrade (Minggu 1–2)
- Postgres migration + Redis integration
- Background worker skeleton
- Observability (health, metrics, OTel)
- Config management (env validation dengan Zod)
- Unit test harness (Vitest) + CI (GitHub Actions)
- **DoD:** App jalan di Postgres+Redis di dev & staging, CI hijau, coverage > 40%

### Fase 2 — Auth Completeness (Minggu 3)
- Email verification flow + magic link
- Password reset
- 2FA TOTP + backup codes
- Session management UI
- Anomaly detection
- **DoD:** Full auth matrix tested via Playwright

### Fase 3 — Core Features Expansion (Minggu 4–5)
- Folders + tags + search (+ Cmd+K palette)
- Bulk CSV import/export + bulk edit/delete/archive
- UTM builder + recipes
- Link preview editor
- Link cloaking
- **DoD:** User bisa kelola 1000+ link nyaman

### Fase 4 — Targeting & Intelligence (Minggu 6–7)
- A/B testing dengan stat-sig
- Geo/device rules editor
- Branded QR Studio (logo upload, shape, gradient, frame)
- Print-ready pack
- Conversion pixel + tracking
- **DoD:** Semua fitur targeting bit.ly/dub.co matched

### Fase 5 — Collaboration (Minggu 8)
- Multi-user workspaces + roles + invites
- Audit log UI
- Komentar + @mention
- Shared templates (UTM, QR, pages)
- **DoD:** Team dengan 5 member bisa kolaborasi penuh

### Fase 6 — Linky Page (Minggu 9–10)
- Page model + editor + 10 templates
- Public render + SEO + OG
- Custom domain integration
- Analytics terintegrasi
- **DoD:** 1 orang bisa bangun Linktree-equivalent dalam < 5 menit

### Fase 7 — Developer Platform (Minggu 11)
- REST API v1 + OpenAPI
- API keys + scopes
- Webhooks + HMAC + retry
- SDK TypeScript + Python (auto-gen)
- CLI
- Docs site (Fumadocs)
- **DoD:** Developer bisa integrasi tanpa bantuan

### Fase 8 — Safety & Abuse (Minggu 12)
- Google Safe Browsing integration
- PhishTank/URLhaus mirror + nightly sync
- Turnstile CAPTCHA
- Abuse report form + admin queue
- Transparency report template
- **DoD:** Penetrasi phishing test: 0 malicious berhasil di-shorten

### Fase 9 — Polish (Minggu 13–14)
- i18n 10 bahasa
- WCAG 2.2 AA audit pass
- PWA manifest + service worker
- Email templates (react-email)
- In-app onboarding tour
- Legal pages (ToS, Privacy, Cookies, DMCA)
- Help center + FAQ
- Marketing pages (features, pricing, about)
- Branding assets final
- **DoD:** Lighthouse ≥ 95 semua halaman kritis

### Fase 10 — Quality & Deploy (Minggu 15–16)
- E2E tests 10 journey
- Load test k6 → tune
- Security scan (OWASP ZAP) → remediate
- Docker Compose production
- Caddy config + TLS
- CI/CD GitHub Actions → VPS
- Backup + restore drill
- Monitoring + alert teruji
- **DNS cutover** ke `linky.agentbuff.id`
- **DoD:** Launch! 🎉

---

## 15. Estimasi Waktu & Resource

**Kalau dikerjakan full-time (40 jam/minggu) oleh 1 developer (Claude + Anda):** ±16 minggu / 4 bulan

**Kalau paruh-waktu (20 jam/minggu):** ±8 bulan

**Percepat dengan:**
- Kurangi bahasa i18n jadi 3 (ID + EN + AR) — potong 1 minggu
- Skip SDK Python (hanya TS) — potong 3 hari
- Skip CLI — potong 2 hari
- Skip blog & docs engine (pakai README + /help statis) — potong 3 hari
- Skip visual regression test — potong 2 hari

Dengan cut di atas: ±12–14 minggu.

---

## 16. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Scope creep | Delay launch berbulan-bulan | Enforce "Definition of Ready" ceklist di akhir tiap fase |
| SQLite → Postgres migration bug | Data hilang di dev | Staging env, dump+restore drill |
| Google Safe Browsing false positive | User link legit diblokir | Whitelist domain trusted, appeal flow |
| VPS kena DDoS | Service down | Cloudflare proxy depan VPS (free tier) |
| Token GitHub bocor | Repo compromise | Rotate setiap 90 hari, gunakan SSH key |
| Email spam filter block | User tidak terima email | SPF + DKIM + DMARC setup + warming Resend |
| `linky.agentbuff.id` DNS propagation | Launch molor | Pre-configure 48 jam sebelum launch, TTL rendah |

---

## 17. Langkah Konkret Sekarang

1. **Anda putuskan:**
   - Apakah full 16 minggu OK, atau mau variant "cut scope" 12 minggu?
   - Apakah mau SDK Python di launch atau tunda?
   - Apakah Linky Page jadi prioritas atau bisa tunda ke setelah launch?
   - Staging env: pakai subdomain `staging.linky.agentbuff.id` di VPS yang sama, atau VPS terpisah?

2. **Saya mulai Fase 1 begitu konfirmasi.**

3. **Setiap fase:**
   - Commit incremental di branch `phase-N-xxx`
   - PR ke `main` dengan CI hijau
   - Tag `vX.Y.Z` setelah merge
   - Update `CHANGELOG.md`
   - Update progress di dokumen ini

---

## 18. Checklist Pra-Launch (Wajib Zero Gap)

### Teknis
- [ ] Database Postgres di VPS, backup restoreable
- [ ] Redis jalan + rate limit aktif
- [ ] TLS A+ di SSL Labs
- [ ] All 10 E2E tests pass
- [ ] Load test 1000 rps p95 < 100ms
- [ ] 0 axe-core critical
- [ ] 0 npm audit high
- [ ] Healthcheck endpoint + monitoring
- [ ] Backup script jalan via cron
- [ ] Rollback procedure diuji

### Produk
- [ ] 50+ fitur dari roadmap live
- [ ] 10 bahasa i18n
- [ ] PWA installable
- [ ] Semua halaman render mobile + dark mode

### Legal
- [ ] ToS + Privacy + Cookies + DMCA published
- [ ] Cookie consent banner
- [ ] Abuse report flow live

### Dokumentasi
- [ ] API docs published di `docs.linky.agentbuff.id`
- [ ] Help center minimal 20 artikel
- [ ] README + CONTRIBUTING + SECURITY.md
- [ ] CHANGELOG.md

### Marketing
- [ ] Landing final dengan screenshot asli
- [ ] OG image generator jalan
- [ ] Seed demo data bagus untuk screenshot
- [ ] Social handle disiapkan (opsional)

### Ops
- [ ] Monitoring alert test (trigger sengaja)
- [ ] Log rotation jalan
- [ ] Secrets di VPS, bukan di git
- [ ] Docker Compose `up -d` fresh VPS tested
- [ ] Domain DNS + TLS aktif
- [ ] Email transaksional terkirim (SPF/DKIM pass)

---

**Dokumen ini akan di-update setiap akhir fase. Sumber tunggal kebenaran untuk scope & progress.**

Terakhir diupdate: 2026-04-23
