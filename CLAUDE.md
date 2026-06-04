# CLAUDE.md — Linky Codebase Master Reference

> **Untuk Claude Code dan kontributor manusia.** Baca file ini **dulu** sebelum melakukan pekerjaan apa pun di codebase. Update file ini setiap kali kamu mengubah arsitektur, konvensi, atau menambah/mengubah fitur besar.

---

## 📚 Reading Order untuk Sesi Baru (WAJIB)

File ini sengaja ringkas (~700 baris). Untuk konteks penuh, baca tiga file dengan urutan ini:

| # | File | Kapan dibutuhkan | Ringkasan isi |
|---|---|---|---|
| 1 | **CLAUDE.md** (ini) | **Selalu — dibaca pertama** | Onboarding: stack, konvensi, struktur folder, workflow sesi baru |
| 2 | **[docs/SESSION-LOG.md](docs/SESSION-LOG.md)** | **Selalu — dibaca kedua** | Konteks user (preferensi, anti-patterns), timeline keputusan, audit trail, known issues, cara resume |
| 3 | **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | Saat menyentuh kode kompleks atau merancang fitur baru | Deep technical: setiap tabel DB, request lifecycles, REST API design, webhook delivery, CSV pipeline, performance, deploy topology, migration plan |

Plus referensi sekunder yang dipakai sesuai konteks:
- **[CHANGELOG.md](CHANGELOG.md)** — release notes per versi (apa yang berubah & kenapa)
- **[README.md](README.md)** — public-facing (jangan tulis konteks internal di sini)
- **`~/.claude/plans/aku-ingin-membuat-web-sunny-hanrahan.md`** — visi awal project (untuk konteks roadmap)

**Saat update arsitektur/konvensi:** update file yang relevan. Aturan:
- Konvensi atau struktur baru → **CLAUDE.md**
- Deep technical baru (flow, schema, perf) → **docs/ARCHITECTURE.md**
- Keputusan besar / fitur besar yang baru di-ship → **docs/SESSION-LOG.md** + **CHANGELOG.md**

---

## TL;DR — Apa ini

**Linky** — open-source (MIT) URL shortener + link-in-bio (Linktree-style) yang free-forever. Production target: **https://linky.agentbuff.id**. Pemilik repo: **Nugraha Labib Mujaddid** (`agentbuff.id@gmail.com`). Versi saat ini: **v0.5.4**.

- **Stack:** Next.js 15 App Router + React 19 + TypeScript strict + Tailwind v4 + SQLite (Drizzle) + Google OAuth login (jose JWT sessions) + Turbopack dev
- **Port dev/start:** `1709` (bukan 3000)
- **Repo:** https://github.com/nugrahalabib/Linky-Agentbuff
- **Lisensi:** MIT
- **Plan asli:** `~/.claude/plans/aku-ingin-membuat-web-sunny-hanrahan.md`

---

## Quickstart untuk Sesi Baru

Kalau kamu Claude Code yang baru masuk ke sesi, ikuti urutan ini:

```bash
# 1. Pastikan dependencies ada
npm install

# 2. Migrate DB (idempotent)
npm run db:migrate

# 3. Dev server
npm run dev
# Akses http://localhost:1709
```

Kalau prod build:
```bash
npm run build
npm run start  # juga di port 1709
```

Akun untuk test biasanya kamu signup baru via `/signup`. Tidak ada akun seed default — bikin sendiri.

**Tes wajib sebelum claim "done":**
```bash
npm run typecheck   # tsc --noEmit, harus zero error
npm test            # 119 tests, semua harus pass
npm run build       # production build, harus succeed
```

---

## Kondisi Lingkungan Khusus (Windows App Control)

Ini sudah **menyala** di mesin pemilik. Implikasinya:

1. **Vitest/Rolldown native bindings di-block.** Itu sebabnya project pakai **`node:test` via `tsx`** (lewat `scripts/run-tests.mjs`) bukan vitest. API mirip vitest karena ada `src/lib/test-shim.ts` yang memetakan `describe`/`it`/`expect`.

2. **`better-sqlite3` native binary kadang di-block** setelah `npm install` baru. Gejala: `Error: An Application Control policy has blocked this file ... better_sqlite3.node`. Workaround di sesi sebelumnya: copy binary dari project lain yang sudah whitelisted:

   ```bash
   cp "/c/Users/nugra/Documents/Project/App-Skills/VidBee/node_modules/.pnpm/better-sqlite3@12.4.1/node_modules/better-sqlite3/build/Release/better_sqlite3.node" \
      node_modules/better-sqlite3/build/Release/better_sqlite3.node
   ```
   
   Atau restart Windows (clear App Control cache). **Jangan jalankan `npm rebuild better-sqlite3`** — itu hapus binary lama lalu install baru yang justru lebih sering di-block.

3. **Bash shell yang dipakai:** Git Bash di Windows. Path Unix-style boleh, tapi `taskkill //F //PID` butuh double-slash karena MSYS.

---

## Arsitektur Tingkat Tinggi

### Satu Next.js app, bukan monorepo
Keputusan eksplisit: monorepo (Turborepo) ditolak untuk menjaga build complexity rendah. Semua di satu folder `src/`.

### Layer & batasan
```
┌────────────────────────────────────────────────────────────┐
│ Browser (Tailwind + Radix + Recharts client components)    │
└──────────────┬──────────────────────────┬──────────────────┘
               │ Server Components        │ fetch /api/*
               ▼                          ▼
       ┌────────────────────┐   ┌─────────────────────────┐
       │  RSC pages         │   │ Route Handlers          │
       │  (data fetched     │   │ (CRUD endpoints, JSON   │
       │  via lib helpers)  │   │ responses)              │
       └─────────┬──────────┘   └────────────┬────────────┘
                 │                            │
                 └────────────┬───────────────┘
                              ▼
                ┌────────────────────────────┐
                │  src/lib/* (pure logic +   │
                │  Drizzle queries)          │
                └────────────┬───────────────┘
                             ▼
                ┌────────────────────────────┐
                │  better-sqlite3 (sync API) │
                │  → linky.db                │
                └────────────────────────────┘
```

**Aturan:**
- Server Components by default. Mark `"use client"` hanya kalau perlu (`useState`, browser API, dll.).
- `@/lib/db` hanya boleh diimpor dari kode server. Jangan import dari client component.
- Route handlers selalu validate via Zod schema dulu. Error message dalam Bahasa Indonesia.
- Pesan error untuk API publik (`/api/v1/*`) pakai format standar — lihat bagian REST API.

### Pemilihan teknologi (mengapa)

| Pilihan | Alasan singkat |
|---|---|
| **better-sqlite3 + sync Drizzle API** | Zero-config, file `linky.db` ringan, banyak query per request tidak masalah karena sync. Postgres adapter siap (`src/lib/db/schema-pg.ts`, `scripts/migrate-pg.ts`) tapi runtime masih SQLite. Migrasi ke async Drizzle = pekerjaan besar (semua call site harus jadi async). |
| **Custom JWT (jose) bukan NextAuth** | Lebih ringan, kontrol penuh. JWT signed HS256 disimpan di httpOnly cookie + tabel `sessions`. |
| **Tailwind v4 CSS-first** | `@theme` block di `globals.css`. Tidak ada `tailwind.config.ts`. |
| **shadcn-style components copy-paste** | UI primitives ada di `src/components/ui/`. Bukan dependency NPM, supaya bisa di-tweak. |
| **`node:test` + tsx + test-shim** | Vitest rolldown native binding di-block oleh Windows App Control. Lihat bagian "Lingkungan Khusus". |
| **Lucide icons + Recharts** | Default shadcn, modern, tree-shakeable. |
| **`ioredis` graceful** | Tidak crash kalau `REDIS_URL` kosong. Cache jadi no-op. |

---

## Struktur Folder Detail

```
src/
├── app/                            # Next.js App Router
│   ├── page.tsx                    # Landing marketing (statis; TIDAK ada form shorten — lihat catatan anon di Roadmap)
│   ├── layout.tsx                  # Root layout + global Toast provider
│   ├── globals.css                 # Tailwind v4 + design tokens (@theme)
│   ├── not-found.tsx               # 404 default
│   ├── [slug]/route.ts             # HOT PATH: redirect handler
│   ├── c/[slug]/page.tsx           # Cloaked link iframe page
│   ├── p/[slug]/page.tsx           # Password gate (server action)
│   ├── expired/page.tsx            # 410-equivalent landing
│   ├── report/page.tsx             # Abuse report form (public)
│   ├── u/[username]/page.tsx       # Linky Page publik (link-in-bio)
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   ├── robots.txt/route.ts
│   ├── sitemap.xml/route.ts
│   ├── docs/
│   │   ├── api/page.tsx            # Public API reference (TOC + cookbook)
│   │   └── openapi.json/route.ts   # OpenAPI 3.1 spec
│   ├── dashboard/                  # Semua page di sini auth-gated
│   │   ├── layout.tsx              # Sidebar + bottom nav + cmd palette
│   │   ├── page.tsx                # Home dashboard
│   │   ├── links/
│   │   │   ├── page.tsx            # List
│   │   │   ├── new/page.tsx        # Create form
│   │   │   └── [id]/page.tsx       # Detail tabs (Overview/Analytics/QR/Settings/Danger)
│   │   ├── analytics/page.tsx      # Workspace analytics dashboard
│   │   ├── qr/page.tsx             # Standalone branded QR studio
│   │   ├── pages/                  # Linky Pages (link-in-bio editor)
│   │   │   ├── page.tsx            # List
│   │   │   └── [id]/page.tsx       # Editor (split-view phone preview)
│   │   ├── folders/
│   │   │   ├── page.tsx            # Manage folders
│   │   │   └── [id]/page.tsx       # Folder detail (links inside)
│   │   ├── tags/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── utm-recipes/page.tsx
│   │   ├── import/page.tsx         # CSV migration wizard (3-step)
│   │   ├── developer/page.tsx      # API Keys + Webhooks + Test console
│   │   └── settings/page.tsx       # 6-tab settings (profil/keamanan/dst.)
│   └── api/                        # 53 route handlers
│       ├── health/route.ts         # Liveness probe
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── profile/route.ts                    # PATCH (name/locale)
│       │   ├── change-password/route.ts            # POST
│       │   └── sessions/
│       │       ├── route.ts                        # GET list
│       │       ├── [id]/route.ts                   # DELETE revoke
│       │       └── revoke-others/route.ts          # POST
│       ├── account/
│       │   ├── route.ts            # DELETE (cascade purge)
│       │   ├── stats/route.ts
│       │   ├── export/route.ts     # JSON download
│       │   └── wipe-links/route.ts
│       ├── workspace/route.ts      # PATCH (name/slug)
│       ├── shorten/route.ts        # POST anonymous/authed shorten (landing)
│       ├── slug-check/route.ts     # GET availability
│       ├── links/
│       │   ├── route.ts            # GET list, POST create
│       │   ├── [id]/
│       │   │   ├── route.ts        # GET, PATCH, DELETE
│       │   │   ├── analytics/route.ts
│       │   │   ├── ab-stats/route.ts
│       │   │   ├── targeting/route.ts
│       │   │   └── tags/route.ts
│       │   ├── bulk/route.ts       # Archive/delete/move bulk
│       │   ├── export/route.ts     # CSV download
│       │   └── import/
│       │       ├── route.ts        # CSV wizard endpoint (preview + commit)
│       │       └── error-report/route.ts
│       ├── analytics/workspace/
│       │   ├── route.ts
│       │   ├── recent/route.ts
│       │   └── top-links/route.ts
│       ├── qr/route.ts             # Basic QR (PNG/SVG)
│       ├── qr-branded/route.ts     # Branded QR
│       ├── folders/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── tags/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── utm-recipes/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── linky-pages/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/click/route.ts
│       ├── api-keys/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── webhooks/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── test/route.ts
│       │       └── deliveries/route.ts
│       ├── abuse-reports/route.ts
│       └── v1/                     # Public REST API
│           ├── me/route.ts
│           ├── qr/route.ts
│           ├── links/
│           │   ├── route.ts        # GET, POST
│           │   └── [id]/route.ts   # GET, PATCH, DELETE
│           └── analytics/
│               ├── workspace/route.ts
│               └── links/[id]/route.ts
│
├── components/                     # 46+ komponen
│   ├── ui/                         # Primitive (button, input, card, tabs, badge, toast, skeleton)
│   ├── brand/logo.tsx
│   ├── site-header.tsx
│   ├── command-palette.tsx         # Cmd+K
│   ├── search-trigger.tsx
│   ├── shorten-form.tsx            # ⚠️ TIDAK dirender di mana pun (dead code); /api/shorten authed-only
│   ├── create-link-form.tsx        # Authed link create
│   ├── link-list-item.tsx
│   ├── links-browser.tsx           # list utama yang dirender di /dashboard/links
│   ├── links-table.tsx             # (legacy, tidak dipakai)
│   ├── analytics-dashboard.tsx
│   ├── analytics-panel.tsx
│   ├── sparkline-chart.tsx
│   ├── qr-studio.tsx
│   ├── csv-importer.tsx            # 3-step wizard (Upload → Map → Review)
│   ├── provider-guide.tsx          # Sidebar Bit.ly/Rebrandly/dst. guide
│   ├── code-block.tsx              # /docs/api code samples with copy
│   ├── api-key-manager.tsx
│   ├── webhook-manager.tsx         # With deliveries log + test button
│   ├── api-test-console.tsx
│   ├── developer-quickstart.tsx
│   ├── developer-tabs.tsx
│   ├── folder-manager.tsx
│   ├── tag-manager.tsx
│   ├── utm-recipe-manager.tsx
│   ├── linky-page-editor.tsx       # Split-view phone preview + block inspector
│   ├── linky-page-renderer.tsx     # Public /u/<username> render
│   ├── settings/                   # NEW (Phase yang baru selesai)
│   │   ├── settings-tabs.tsx
│   │   ├── profile-section.tsx
│   │   ├── security-section.tsx
│   │   ├── workspace-section.tsx
│   │   ├── preferences-section.tsx
│   │   ├── data-section.tsx
│   │   └── danger-zone.tsx
│   └── ... (lainnya)
│
└── lib/
    ├── db/
    │   ├── schema.ts               # Drizzle SQLite schema (single source of truth)
    │   ├── schema-pg.ts            # Postgres prep (belum dipakai)
    │   └── index.ts                # Database client + connection
    ├── cache/
    │   └── redis.ts                # ioredis graceful fallback
    ├── auth.ts                     # JWT + session + requireUser/getSessionUser; ensureWorkspace() delegasi ke workspace.ts; password = bcryptjs (10 rounds)
    ├── workspace.ts                # getActiveWorkspace — auto-create 1 personal workspace per user (ownerId)
    ├── api-auth.ts                 # Bearer token auth untuk /api/v1/*
    ├── api-helpers.ts              # apiOk/apiError/apiOptions/withApiAuth/rateLimitCheck
    ├── api-serializers.ts          # serializeLink → PublicLink (snake_case)
    ├── analytics.ts                # getWorkspaceAnalytics, getLinkAnalytics, getTopLinks, dst.
    ├── clicks.ts                   # recordClick + isBot
    ├── csv.ts                      # parseCsv (BOM strip, delimiter detect), encodeCsv
    ├── csv-mapping.ts              # Field aliases + provider detection + parseTagsCell
    ├── hash.ts                     # sha256, hashIp
    ├── i18n.ts                     # Pesan UI ID/EN
    ├── logger.ts                   # pino
    ├── qr.ts                       # qrToSvg, qrToPngBuffer, brandedQrSvg
    ├── resolve-link.ts             # resolveLinkBySlug, checkLinkStatus, pickTargetUrl (A/B + geo + UA)
    ├── safe-browsing.ts            # Google Safe Browsing v4 + heuristic
    ├── slug.ts                     # generateSlug (Crockford nanoid), isValidSlug, RESERVED
    ├── utils.ts                    # normalizeUrl, isValidUrl, hostOf, getFaviconUrl, relativeTime, formatDate
    ├── validators.ts               # Semua Zod schema
    ├── webhooks.ts                 # signPayload, fireWebhooks (HMAC-SHA256, delivery log)
    └── test-shim.ts                # describe/it/expect mapping ke node:test
```

---

## Data Model — DB Schema Snapshot (12 migrations)

File: `src/lib/db/schema.ts` (single source of truth). Migration runner: `npm run db:migrate` menjalankan `scripts/migrate.ts` — dispatcher yang otomatis pilih `scripts/migrate-sqlite.ts` (default) atau `scripts/migrate-pg.ts` berdasarkan prefix `DATABASE_URL` (`postgres...` → PG, selain itu → SQLite). DDL SQLite ada di dalam `migrate-sqlite.ts` (bukan file `.sql` terpisah).

| Tabel | Fungsi |
|---|---|
| `users` | id, email, password_hash, name, email_verified_at, locale, timestamps |
| `sessions` | id, user_id (CASCADE), expires_at, user_agent, ip_hash, last_seen_at, timestamps |
| `workspaces` | id, slug (unique), name, owner_id (CASCADE), plan(`free`/`self_hosted`), timestamps |
| `domains` | id, workspace_id, hostname (unique), verified, ssl_status, is_default, verification_token |
| `folders` | id, workspace_id, parent_id (nullable, **indexed only — TIDAK ada DB FK**; integritas parent dijaga di app code), name, color |
| `tags` | id, workspace_id, name, color — unique(workspace_id, name) |
| `links` | id, workspace_id (CASCADE), domain_id (SET NULL), slug, destination_url, title, description, favicon_url, folder_id, password_hash, expires_at, click_limit, ios_url, android_url, utm_params (JSON), geo_rules (JSON), ab_variants (JSON), og_title/desc/image, cloak, click_count, archived, is_anonymous, anon_owner_ip, created_by, timestamps. **Indices kritis:** unique(domain_id, slug), partial unique slug WHERE domain_id IS NULL |
| `link_tags` | composite (link_id, tag_id) |
| `qr_codes` | id, link_id, style (JSON), logo_url, fg, bg, shape |
| `clicks` | id (autoincrement), link_id (CASCADE), ts, country/region/city, device/os/browser, referrer, ip_hash, is_bot, utm_*, ab_variant |
| `api_keys` | id, workspace_id, user_id, name, key_hash (SHA-256, unique), key_prefix, last_used_at, expires_at, timestamps |
| `abuse_reports` | id, link_id, reason, reporter_ip_hash, status(`open`/`reviewing`/`resolved`/`rejected`) |
| `utm_recipes` | id, workspace_id, name, utm_*, created_by — unique(workspace_id, name) |
| `linky_pages` | id, workspace_id, slug (unique), title, bio, avatar_url, theme (JSON), background, blocks (JSON), views, published |
| `linky_page_clicks` | id (autoincrement), page_id (CASCADE), block_id, ts, referrer, country, ip_hash |
| `webhooks` | id, workspace_id, url, secret (whsec_*), events (JSON array), active, last_delivery_at, last_status_code, failure_count, timestamps |
| `webhook_deliveries` | id (whd_*), webhook_id (CASCADE), event, status_code, success, duration_ms, error, request_body, response_snippet, ts |
| `safe_browsing_cache` | url_hash (pk), verdict, threat_types, checked_at, expires_at |

**Migration list:**
1. `0000_initial` — users, sessions, workspaces, domains, folders, tags, links, link_tags, qr_codes, clicks, api_keys, abuse_reports
2. `0001_utm_recipes`
3. `0002_link_og_override` — adds og_title, og_description, og_image, cloak
4. `0003_ab_variants` — links.ab_variants + clicks.ab_variant
5. `0004_linky_pages` — linky_pages + linky_page_clicks
6. `0005_webhooks`
7. `0006_workspace_members` — **REVERTED in 0010**
8. `0007_active_workspace` — **REVERTED in 0010** (column added back null only)
9. `0008_safe_browsing_cache`
10. `0009_webhook_deliveries`
11. `0010_drop_team` — DROP workspace_members + workspace_invitations + ALTER users DROP active_workspace_id
12. `0011_session_metadata` — sessions ADD user_agent, ip_hash, last_seen_at

---

## Konvensi Code (WAJIB diikuti)

### Naming & path
- Import alias: `@/...` → `src/...`
- Dashboard pages selalu `requireUser()` di top
- API routes selalu `getSessionUser()` (return null) atau `requireUser()` (throw)
- Untuk auth dengan workspace info gunakan `getSessionUserWithWorkspace()`

### Server vs Client Components
- Default = Server Component
- `"use client"` cuma kalau ada `useState`, `useEffect`, event handler, `localStorage`, `window`, dll.
- Jangan import `@/lib/db` di client component
- Jangan import komponen yang punya `"use client"` di server-only file — Next.js auto-handles boundary kalau import lurus

### Error handling
- API biasa (`/api/...`): `NextResponse.json({ error: "Pesan ID" }, { status: 4xx })`
- API publik (`/api/v1/...`): WAJIB pakai `apiError(code, message, status, headers)` dari `@/lib/api-helpers`. Format selalu `{ error: { code, message }, request_id }`.
- Server actions: throw `redirect()` atau `Error` yang ditangkap by Next.js error boundary

### Validation
- Selalu Zod via `@/lib/validators.ts`
- Pesan error dalam Bahasa Indonesia
- Untuk API publik, kode error stabil dan bisa diandalkan client (`unauthorized`, `validation_error`, `invalid_url`, `slug_taken`, `not_found`, `rate_limited`, `unsafe_url`)

### Tests
- `*.test.ts` di sebelah file yang dites
- Pakai `describe`, `it`, `expect` dari `@/lib/test-shim`
- Jalan via `npm test` (yang invoke `scripts/run-tests.mjs`)
- Total saat ini: **119 tests, semua pass**

### Komen & dokumentasi
- Jangan tulis komen yang menjelaskan WHAT (kode sudah jelas). Hanya tulis WHY untuk keputusan non-obvious / workaround.
- Jangan bikin file dokumentasi baru (markdown) kecuali user minta atau memang dibutuhkan untuk onboarding (seperti CLAUDE.md ini).

### UI tone (Bahasa Indonesia)
- Pakai "kamu" untuk UI umum, "Anda" cuma legal/billing
- Friendly dan ramah, tidak technical: "Hmm, itu belum terlihat seperti URL. Coba tambahkan https://?"
- Empty state: "Belum ada link. Tempel URL pertamamu di atas — butuh 2 detik."
- Sukses: "Berhasil!" + emoji konservatif (jangan kelebihan)
- Error: jelaskan apa yang salah + saran (jangan stack trace)

---

## REST API Surface (v1 — stable)

Base URL: `${NEXT_PUBLIC_APP_URL}/api/v1`. Bearer auth dengan API key `lnk_...`. CORS terbuka. Rate limit 120 req/menit/key. Standard error format.

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/v1/me` | Introspect key + workspace |
| GET | `/api/v1/links?limit=N&archived=0/1` | List links |
| POST | `/api/v1/links` | Create link |
| GET | `/api/v1/links/{id}` | Get one |
| PATCH | `/api/v1/links/{id}` | Update |
| DELETE | `/api/v1/links/{id}` | Delete (cascade clicks) |
| GET | `/api/v1/analytics/workspace?days=N` | Workspace stats |
| GET | `/api/v1/analytics/links/{id}?days=N` | Per-link breakdown |
| GET | `/api/v1/qr?text=...&format=svg/png` | QR generation |
| OPTIONS | (semua) | CORS preflight |

**Helpers wajib pakai:**
- `withApiAuth(req)` — return `{ ok: true, auth }` atau `{ ok: false, res }`. Auth object punya `workspace`, `key`, `rateHeaders`.
- `apiOk(data, { status?, extraHeaders? })` — selalu return JSON dengan CORS + rate limit headers
- `apiError(code, message, status?, headers?)` — return error format standar
- `apiOptions()` — return 204 untuk OPTIONS preflight
- `readJson<T>(req)` — parse body dengan handling JSON invalid

**Serializer:** `serializeLink(link)` → `PublicLink` (snake_case shape). Selalu pakai ini untuk response, jangan return drizzle row mentah.

**Public docs:** `/docs/api` (page TSX besar dengan TOC sidebar + cookbook 5 resep + signature verifier 3 bahasa). OpenAPI spec: `/docs/openapi.json`.

---

## Webhooks

`fireWebhooks(workspaceId, event, data)` di `src/lib/webhooks.ts`:
- Sync lookup webhooks aktif di workspace
- Filter by event subscription
- Fire-and-forget `deliverOne()` per webhook
- HMAC-SHA256 signature header `X-Linky-Signature: sha256=<hex>`
- Headers tambahan: `X-Linky-Event`, `X-Linky-Delivery-Id`, `User-Agent: Linky-Webhook/1.0`
- 5s timeout via AbortController
- Tulis ke `webhook_deliveries` (last 50 per webhook, auto-prune via SQL trick)
- Update `webhooks.last_delivery_at`, `last_status_code`, `failure_count`

**Event types:** `link.clicked` | `link.created` | `link.updated` | `link.deleted`

**Call sites:**
- `src/lib/clicks.ts` `recordClick()` — fires `link.clicked` setelah update click count
- `src/app/api/links/route.ts` POST — fires `link.created`
- `src/app/api/links/[id]/route.ts` PATCH/DELETE — fires `link.updated`/`link.deleted`
- Sama untuk versi v1 di `src/app/api/v1/links/`

---

## Redirect Hot Path

`src/app/[slug]/route.ts` adalah file paling kritis untuk performa. Flow:
1. `resolveLinkBySlug(slug)` — DB query
2. `checkLinkStatus(link)` — handle expired/click_limit/password_required
3. `pickTargetUrl(link, ua, country, ip)` — A/B variant sticky by IP hash + geo + UA (iOS/Android)
4. Bot detection via UA regex (`isBot(ua)`)
5. `recordClick(...)` — **sinkron** (better-sqlite3), bukan `async`; dipanggil tanpa `await` (fire-and-forget) untuk non-bot
6. `NextResponse.redirect(target, 302)` dengan `Cache-Control: private, no-store` (+ `Referrer-Policy: no-referrer-when-downgrade` di redirect final, bukan di cloak)

**Yang TIDAK boleh diubah tanpa diskusi:**
- Sync click insert (better-sqlite3 sync) — tidak boleh ditambah await
- Bot filter — `BOT_RE` di `clicks.ts` **mengecualikan** crawler + social preview fetchers (WhatsApp/Telegram/Facebook/Discord) dari click_count + webhook karena itu pre-render, bukan klik manusia. Ini **benar** untuk shortener. Jangan terlalu agresif untuk UA browser asli.
- Cloak handling — `link.cloak === true` → redirect ke `/c/<slug>` (iframe page) bukan langsung

---

## CSV Import Library

Dua file kunci:

**`src/lib/csv.ts`:**
- `parseCsv(input, { delimiter? })` → `{ headers, rows, delimiter }`. Auto-detect delimiter `,` `;` `\t` via `detectDelimiter()` (quoted-aware sniff). Strip BOM `﻿`.
- `encodeCsv(rows, columns?)` → escape RFC-4180

**`src/lib/csv-mapping.ts`:**
- `FieldKey` union (15 fields)
- `ALIASES` map: 50+ alias dari 5 platform
- `autoMap(headers)` → `Record<FieldKey, number | null>`
- `detectProvider(headers)` → `"bitly" | "rebrandly" | "tinyurl" | "dubco" | "shortio" | "linky" | "unknown"`
- `parseTagsCell(cell)` — split by `,` atau `|`, trim, dedupe empty

**Endpoint:** `POST /api/links/import` dengan body `{ csv, commit?, mapping?, conflict?, defaultFolderId?, defaultTagIds? }`. Conflict modes: `skip` (default) / `rename` (auto-suffix `-1`) / `fail`.

**UI:** 3-step wizard `csv-importer.tsx` (Upload → Map → Review). Sidebar `provider-guide.tsx` accordion dengan langkah export tiap platform + sample CSV download.

---

## Settings Page (6 tab)

`/dashboard/settings` (newest feature). File: `src/app/dashboard/settings/page.tsx` + `src/components/settings/*`.

| Tab | Fungsi | Endpoint |
|---|---|---|
| Profil | Edit nama + locale | `PATCH /api/auth/profile` |
| Keamanan | Ganti password + sessions list | `POST /api/auth/change-password`, `GET/DELETE /api/auth/sessions/[id]`, `POST /api/auth/sessions/revoke-others` |
| Workspace | Edit nama + slug | `PATCH /api/workspace` |
| Tampilan | Tema + density (localStorage) | (client-only) |
| Data | Stats + JSON export | `GET /api/account/stats`, `GET /api/account/export` |
| Danger zone | Wipe links / delete account | `POST /api/account/wipe-links`, `DELETE /api/account` |

**Critical UX guards:**
- Password change verify current dulu, reject same-as-old, auto revoke other sessions
- Wipe links butuh ketik nama workspace persis
- Delete account butuh ketik email + password verify

---

## Auth & Security

**Login = Google OAuth ONLY** (keputusan owner 2026-06-04 — wajib punya akun, no anonymous). Email/password login DIHAPUS.
- OAuth2 authorization-code + PKCE + state, implementasi manual di `src/lib/oauth.ts` (tanpa dep baru). Routing generik per-provider: `/api/auth/oauth/[provider]/{start,callback}`.
- Provider registry: `google` (built-in) + **OIDC generik** (`sso`) yang auto-aktif kalau env `SSO_OIDC_*` diisi — colokan SSO enterprise tanpa ubah kode.
- `findOrCreateOAuthUser` di `auth.ts`: match (provider,subject) → email (link akun lama) → create. User OAuth `passwordHash=""` (kolom legacy, NOT NULL).
- Env: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`. Tutorial: `docs/AUTH-GOOGLE-SETUP.md`. Redirect URI: `${APP_URL}/api/auth/oauth/google/callback`.
- ⚠️ Password per-link (link dilindungi sandi) **TETAP ada** & pakai bcrypt — itu beda dari login user.

**Sessions:** (tidak berubah — tetap dipakai setelah OAuth callback)
- Cookie name: `linky_session`
- httpOnly, sameSite=lax, secure di prod
- Default expiry: 30 hari
- JWT (jose, HS256) — payload `{ sid, uid, iat, exp }`
- Server-side validation cek DB `sessions` row + expiry — JWT alone tidak cukup
- Setiap request update `sessions.last_seen_at`

**API keys:**
- Format: `lnk_<24-byte-base64url>`
- Storage: SHA-256 hash di `api_keys.key_hash` (unique). Token mentah tidak pernah disimpan.
- Prefix 10 char ditampilkan untuk identify
- Optional expiry (`expiresInDays` di form)
- Revoke = delete row, langsung berlaku

**Webhook secrets:**
- Format: `whsec_<20-byte-base64url>`
- Disimpan plaintext (untuk HMAC), tidak hashable
- Display di UI hanya saat dibuat + via tombol "Lihat" eksplisit

**Rate limit:**
- API v1: 120 req/menit/key via in-memory Map (per process — kalau scale ke multi-instance perlu Redis)
- ⚠️ `ANON_DAILY_LIMIT` **tidak dipakai** di kode (nol referensi di `src/`). `/api/shorten` saat ini authed-only (butuh login), bukan anonim. Lihat catatan di Roadmap.

**Headers (next.config.ts):**
- Standard security headers (X-Content-Type-Options, Referrer-Policy, dll.)

**Safe Browsing:**
- File: `src/lib/safe-browsing.ts`
- Heuristic check (suspicious TLD, punycode, internal IPs, phishing patterns) — selalu jalan
- Google Safe Browsing v4 API — opsional via `GOOGLE_SAFE_BROWSING_API_KEY` env
- 24h cache di tabel `safe_browsing_cache`

---

## ENV Variables

Lihat `.env.example` dan `.env.production.example`.

**WAJIB di production:**
- `AUTH_SECRET` — min 24 char random (gen via `openssl rand -base64 32`)
- `NEXT_PUBLIC_APP_URL` — base URL absolut (mis. `https://linky.agentbuff.id`)

**Opsional:**
- `DATABASE_URL` — default `file:./linky.db`
- `REDIS_URL` — graceful fallback kalau kosong
- `GOOGLE_SAFE_BROWSING_API_KEY` — heuristic-only kalau kosong

**Dev:** `.env.local` dengan `AUTH_SECRET=dev-secret-linky-local-only-32-characters-minimum-ok`

---

## Scripts

```bash
npm run dev            # Turbopack dev di :1709
npm run build          # Production build
npm start              # Run production build di :1709
npm run typecheck      # tsc --noEmit
npm run lint           # next lint
npm test               # node:test via scripts/run-tests.mjs (119 tests)
npm run test:watch     # tsx --test --watch (watch mode)
npm run db:migrate     # Auto-dispatch migrate (scripts/migrate.ts → sqlite/pg by DATABASE_URL); juga jalan via postinstall
npm run db:generate    # drizzle-kit generate (gen migration dari schema)
npm run db:studio      # drizzle-kit studio (GUI inspect DB)
# npm run db:seed      # ⚠️ terdaftar di package.json tapi scripts/seed.ts BELUM ADA — akan gagal
```

**Jalankan satu test file saja:** `npx tsx --test src/lib/<nama>.test.ts` (atau `--test --watch` untuk loop). `npm test` selalu jalankan semua via `scripts/run-tests.mjs`.

---

## CI/CD

`.github/workflows/ci.yml` — jalan di setiap push/PR. Jobs:
- Lint (`npm run lint`)
- Typecheck (`npm run typecheck`)
- Test (`npm test`)
- Build (`npm run build`)
- Security: gitleaks + `npm audit`

---

## Production Deploy Notes

Two paths (lihat README + `docker-compose.yml`):

**1. Self-host VPS:**
- Caddy reverse-proxy dengan auto-TLS → `:1709`
- Docker Compose: linky-app container + Caddy + volumes untuk `linky.db` dan logs
- Dockerfile multi-stage (node:22-alpine builder + runner)

**2. Vercel:**
- Push ke GitHub → import repo
- Set env: `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, dan optional ones
- Untuk DB persistent perlu swap SQLite → Postgres (Supabase/Neon). Schema sudah ada di `src/lib/db/schema-pg.ts`, migrator di `scripts/migrate-pg.ts`. Tapi semua call site Drizzle masih sync — perlu refactor ke async dulu.

VPS pemilik: **148.230.100.170** (Hostinger), banyak project lain co-hosted di sana — jangan sentuh.
**Postgres khusus Linky sudah disediakan (2026-06-04):** container **`linky_postgres`** (postgres:18, terisolasi, BUKAN `postgres_container` bersama), docker network **`linky-net`**, volume `linky_pgdata`, DB `linky`, role `linky_user`, bind `127.0.0.1:5434`. Schema sudah dimigrasikan penuh (18 tabel via `migrate-pg.ts` 0000+0001). Akses dari lokal: `ssh -L 5434:127.0.0.1:5434 agentbuff-vps`. App container harus join `linky-net` untuk konek `linky_postgres:5432`. **Runtime masih SQLite** sampai refactor sync→async call-site selesai (lihat Roadmap).

---

## Roadmap

### ✅ Done (v0.5.x)
- MVP: shorten, redirect, QR, basic analytics, auth
- Phase 1 foundation: Postgres prep, Redis, tests, CI
- Phase 3 expansion: folders, tags, search, CSV import/export, UTM recipes, bulk ops
- Phase 4-10: targeting, Linky Pages, REST API, deploy artifacts
- REST API v1 lengkap + webhooks dengan HMAC + delivery log
- Public docs `/docs/api` + OpenAPI spec
- Settings page redesign (6 tab functional)
- CSV migration real-world (Bit.ly/Rebrandly/TinyURL/Dub.co/Short.io)

### 🔜 Next
- A/B testing UI (schema sudah ada, butuh editor)
- Real-time analytics (SSE)
- Webhook retry policy (exp-backoff: 1m → 5m → 30m → 2h, max 4 attempts)
- ClickHouse migration (saat >1M clicks/bulan/workspace)
- Cloudflare Workers redirect layer (p95 <80ms global)
- Official SDKs (TypeScript + Python)
- Multi-domain support UI
- Geo targeting rules editor UI (schema sudah ada)
- Mobile app (React Native via Expo, share `lib/`)
- Postgres adapter actually switched on (perlu async migration; `schema-pg.ts`/`migrate-pg.ts` masih incomplete — 13 dari 18 tabel)

### ❌ DITOLAK
- **Anonymous shorten (tanpa login)** — **DITOLAK secara sengaja** (keputusan owner 2026-06-04): membuat link **wajib punya akun** dulu — "harus dapet data dia siapa dulu, gaboleh asal dipake bebas sama orang yang datanya belum kita dapat". Maka `/api/shorten` memang authed-only (401 tanpa session) — itu **benar by design**, bukan bug. `ANON_DAILY_LIMIT` tidak dipakai. `src/components/shorten-form.tsx` adalah dead code (tidak dirender) — boleh dihapus atau dipakai ulang sebagai quick-shorten untuk user yang **sudah login**. Kolom `is_anonymous`/`anon_owner_ip` + index `links_anon_owner_idx` vestigial (bisa di-drop via migrasi 0012 nanti). Jangan re-introduce shorten anonim.
- **Multi-user workspaces / Tim feature** — pernah dibangun lalu dihapus total (commit `46758c1`). Linky sekarang single-user product. Setiap user = 1 personal workspace. Jangan re-introduce tanpa diskusi.

---

## Workflow untuk Sesi Baru

Kalau kamu Claude Code yang baru join sesi:

1. **Baca CLAUDE.md (file ini) sampai habis** sebelum melakukan apa-apa.
2. **Lalu baca [docs/SESSION-LOG.md](docs/SESSION-LOG.md)** untuk konteks user + timeline keputusan + audit trail.
3. **Skim [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** untuk tahu apa yang ada — baca section spesifik saat menyentuh kode terkait.
4. Cek `git log --oneline -10` untuk lihat commit terakhir.
5. Cek `git status` untuk lihat ada perubahan uncommitted.
6. Kalau user minta fitur baru, lihat dulu apakah ada konflik dengan keputusan di tiga file dokumentasi.
7. Untuk fitur besar: bikin plan komprehensif → user approve → implement → verify e2e → commit dengan message detail → push.

**Verifikasi sebelum claim "done":**
```bash
npm run typecheck    # WAJIB zero error
npm test             # WAJIB 119/119 pass
npm run build        # WAJIB sukses (next build / webpack — Turbopack HANYA untuk dev)
# Smoke test endpoint utama via curl kalau fitur API
```

**Saat commit:**
- Conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- Body detail dengan apa yang berubah + bukti verifikasi
- Co-Authored-By trailer untuk Claude

**Saat push:**
- Pakai credential local yang sudah ada di git config — JANGAN minta token user
- Kalau ada conflict, fetch + rebase dulu

---

## Filosofi & Tone Project

- **Free forever, no paywall** — semua fitur unlocked, hosted SaaS juga tetap gratis dengan quota generous
- **Mobile-first, WCAG 2.2 AA** — semua interaksi keyboard-reachable, screen reader friendly
- **Indonesian-first, English second** — UI default Bahasa Indonesia, English untuk i18n wave 2
- **Developer-friendly** — REST API + OpenAPI + webhooks sejak awal
- **Anti-abuse tanpa friksi** — Safe Browsing + rate limit + heuristic, bukan email verification massal
- **Polish UX** — empty states yang manusiawi, loading skeletons (bukan spinner), plain-language errors

---

## Hubungi (untuk konteks fitur)

User adalah **Nugraha Labib Mujaddid** (`agentbuff.id@gmail.com`). Project ini ide pribadi-nya dengan target launch publik di `linky.agentbuff.id`. Domain produksi: `linky.agentbuff.id`. Tidak ada tim, single-developer product.

Untuk konvensi: konfirmasi dulu sebelum mengubah arsitektur fundamental atau menambah dependency baru.

---

> **Akhir kata:** file ini hidup. Setiap kali ada keputusan arsitektur baru, update file ini (+ ARCHITECTURE.md / SESSION-LOG.md sesuai aturan di Reading Order). Setiap kali bikin sesi baru, baca CLAUDE.md → SESSION-LOG.md → skim ARCHITECTURE.md. Jangan sampai sesi berikutnya bingung soal kenapa SQLite sync atau kenapa tidak vitest — semua jawaban harusnya ada di tiga file ini.
