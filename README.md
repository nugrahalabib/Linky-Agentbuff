# Linky — Link pendek. Cerita panjang.

> Open-source, free-forever URL shortener + link-in-bio. MIT licensed. All features unlocked.

Linky adalah alternatif Bit.ly + Linktree yang 100% gratis dan terbuka. Custom slug, QR code branded, analitik mendalam, password, kedaluwarsa, deep link, link-in-bio page, REST API, webhooks — semua tersedia tanpa paywall.

Production: **[linky.agentbuff.id](https://linky.agentbuff.id)**

## Fitur

### Core shortener
- ✅ **Shorten instan** — tempel URL, dapat link pendek, tanpa signup (limit 5/IP/hari untuk anonim)
- ✅ **Custom slug** — `linky.agentbuff.id/kampanye-ramadan`
- ✅ **QR code studio** — branded (warna, logo, frame, eye-style), unduh PNG/SVG
- ✅ **Analitik komprehensif** — total klik, pengunjung unik, geo, device, browser, referrer, top links + 7-hari sparkline + delta%
- ✅ **Password protection** — bcrypt-hashed gate page
- ✅ **Kedaluwarsa** — tanggal/waktu atau batas klik
- ✅ **Deep link** — URL berbeda untuk iOS/Android via UA detection
- ✅ **UTM builder** + recipes (preset kampanye yang bisa di-save & re-apply)
- ✅ **Cloaking** — sembunyikan URL tujuan di address bar
- ✅ **OG override** — title/description/image kustom saat di-share

### Organization
- ✅ **Folder** — kelompok berwarna, satu link satu folder
- ✅ **Tag** — multi-tag per link, filter cepat
- ✅ **Search & filter** — cari berdasarkan slug/URL/title, filter folder/tag/tanggal/archived
- ✅ **Bulk CSV import** — sampai 10rb baris
- ✅ **Bulk operations** — pilih multi-link → arsip/hapus/pindah folder

### Linky Page (link-in-bio)
- ✅ Editor blocks: header, link button, social, embed (YouTube), text, divider, image, countdown
- ✅ 5 tema preset (Creator, Minimal, Neon, Student, UMKM)
- ✅ URL: `linky.agentbuff.id/u/<username>`
- ✅ Analytics terintegrasi

### Multi-user workspaces
- ✅ Roles: Owner / Admin / Editor / Viewer
- ✅ Invitation via shareable token URL (tanpa email)
- ✅ Switch workspace dari header

### Developer / Integration
- ✅ **REST API v1** (`/api/v1/*`) — links CRUD, analytics, QR, /me — Bearer auth, CORS, 120 req/min rate-limit, standard error format
- ✅ **Webhooks** — HMAC-SHA256 signed POST untuk `link.clicked` / `link.created` / `link.updated` / `link.deleted` event, dengan delivery log (50 terakhir per webhook) + tombol kirim test event dari dashboard
- ✅ **Public API docs** — [linky.agentbuff.id/docs/api](https://linky.agentbuff.id/docs/api) dengan cookbook 5 resep + signature verifier per bahasa
- ✅ **OpenAPI 3.1 spec** — [linky.agentbuff.id/docs/openapi.json](https://linky.agentbuff.id/docs/openapi.json) (import ke Postman/Insomnia)
- ✅ **Test console** di dashboard — coba endpoint langsung dari browser

### Auth & security
- ✅ Email + password auth, session cookie httpOnly + signed JWT (HS256)
- ✅ Passwords bcrypt (10 rounds), API keys SHA-256 hashed
- ✅ **Google Safe Browsing v4** + heuristic checks (suspicious TLD, punycode, internal IP, phishing patterns) — fallback ke heuristic kalau API key tidak diset
- ✅ Anonymous shortener rate-limited per IP per hari
- ✅ Cross-workspace isolation airtight (verified via cross-workspace pen test)
- ✅ Security headers di `next.config.ts`

### Platform
- ✅ Dashboard responsif — sidebar desktop + bottom tab bar mobile
- ✅ Dark mode otomatis (`prefers-color-scheme`)
- ✅ WCAG focus ring, `prefers-reduced-motion` respected, semantic HTML
- ✅ i18n ready (Bahasa Indonesia + English)

## Quickstart

```bash
# 1. Install dependencies (otomatis jalankan migrasi DB)
npm install

# 2. Siapkan env
cp .env.example .env.local
# Edit AUTH_SECRET menjadi nilai random minimal 24 karakter

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:1709](http://localhost:1709).

## Scripts

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server dengan Turbopack di port 1709 |
| `npm run build` | Production build |
| `npm start` | Jalankan production build |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (94 tests via `node:test` + tsx) |
| `npm run db:migrate` | Jalankan migrasi DB manual |

## Environment variables

Lihat `.env.example`. Yang penting:

- `AUTH_SECRET` — **wajib di production**, minimal 24 karakter random (gen: `openssl rand -base64 32`)
- `DATABASE_URL` — default `file:./linky.db` (SQLite). Postgres adapter siap (lihat `scripts/migrate-pg.ts`)
- `NEXT_PUBLIC_APP_URL` — base URL aplikasi untuk short link (default `http://localhost:1709`)
- `ANON_DAILY_LIMIT` — quota link anonim per IP per hari (default `5`)
- `GOOGLE_SAFE_BROWSING_API_KEY` — opsional, aktifkan classifier real (kalau kosong, heuristic-only)
- `REDIS_URL` — opsional, untuk rate limit & caching (graceful fallback kalau tidak diset)

## REST API quickstart

Bikin akun → buka **Dashboard → Developer → tab API Keys → Buat**. Salin token `lnk_...` (sekali tampil saja).

```bash
curl -X POST https://linky.agentbuff.id/api/v1/links \
  -H "Authorization: Bearer lnk_LIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"destinationUrl":"https://example.com","customSlug":"promo"}'
```

Dokumentasi lengkap (auth, rate limits, error codes, semua endpoint, webhook signature verifier, cookbook 5 resep): **[/docs/api](https://linky.agentbuff.id/docs/api)** · OpenAPI: **[/docs/openapi.json](https://linky.agentbuff.id/docs/openapi.json)**

## Deployment

### Vercel

1. Push repo ke GitHub
2. Import di Vercel
3. Set env: `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL` (Postgres untuk produksi — Supabase/Neon)

### Self-host (VPS)

```bash
git clone https://github.com/nugrahalabib/Linky-Agentbuff.git
cd Linky-Agentbuff
npm install
npm run build
NODE_ENV=production npm start
```

Gunakan Caddy/Nginx untuk TLS + reverse proxy ke `:1709`.

## Stack

Next.js 15 (App Router, React 19) · TypeScript strict · Drizzle ORM · SQLite (Postgres-ready) · Tailwind CSS v4 · Radix UI · Recharts · `qrcode` · Zod · `bcryptjs` + `jose` (JWT) · `pino` · `ioredis` (graceful) · GitHub Actions CI

Lihat [CLAUDE.md](./CLAUDE.md) untuk konvensi codebase + struktur folder lengkap.

## Roadmap

✅ **v0.1 (MVP)** — shorten + redirect + QR + analytics + auth
✅ **v0.2 (Phase 1)** — Postgres prep, Redis, tests, CI
✅ **v0.3 (Phase 3)** — folders, tags, search, CSV, UTM recipes, bulk ops
✅ **v0.4 (Phase 4–10)** — targeting, Linky Page, REST API, webhooks, OpenAPI, public docs

Berikutnya:
- [ ] A/B testing (Linky Split) — schema sudah siap, UI menyusul
- [ ] Real-time analytics (SSE)
- [ ] Webhook retry policy (exp-backoff)
- [ ] ClickHouse migration untuk analytics skala besar
- [ ] Cloudflare Workers redirect layer (sub-50ms global p95)
- [ ] SDK official: TypeScript + Python
- [ ] Mobile app (React Native via Expo)

## Lisensi

MIT © 2026 Nugraha Labib Mujaddid. Lihat [LICENSE](./LICENSE).

---

Dibuat dengan ❤️ untuk semua orang — creator, marketer, pelajar, UMKM, developer. Semoga bermanfaat!
