# CLAUDE.md — Linky Codebase Conventions

> **For Claude Code and future contributors.** Keep this file updated when you change architecture or conventions.

## What this is

**Linky** — URL shortener dengan branded QR, analitik real-time, dan targeting cerdas. Production domain: `linky.agentbuff.id`. Written in TypeScript + Next.js 15.

## Stack (Phase 1 complete, v0.2.0)

- **Framework:** Next.js 15 (App Router, React 19, Turbopack)
- **Language:** TypeScript strict mode, `moduleResolution: bundler`
- **DB:** SQLite via `better-sqlite3` + Drizzle ORM (sync API). A Postgres adapter + schema + migration runner are prepared (`schema-pg.ts`, `scripts/migrate-pg.ts`) and a dedicated DB `linky` exists on the VPS Postgres (`postgres_container`, role `linky_user`). Switching runtime to Postgres requires converting all sync drizzle calls to async and is tracked as a follow-up.
- **Cache:** `ioredis` client with graceful degraded mode (works without `REDIS_URL` set)
- **Logging:** `pino` (`src/lib/logger.ts`)
- **Auth:** custom session with `jose` (HS256 JWT in httpOnly cookie) + `bcryptjs` for password hashing
- **Styling:** Tailwind CSS v4 (CSS-first config via `@theme` in `globals.css`)
- **UI primitives:** Radix UI + local shadcn-style components in `src/components/ui/`
- **Charts:** Recharts
- **QR:** `qrcode` (server-side SVG/PNG via `/api/qr`)
- **Icons:** Lucide React
- **Validation:** Zod (schemas in `src/lib/validators.ts`)
- **Slug generation:** `nanoid` with Crockford-like alphabet
- **Tests:** Node's built-in `node:test` runner via `tsx` (zero native deps, Windows App Control compatible). Vitest-style API via `src/lib/test-shim.ts`. 86 tests across 10 suites.
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) runs lint + typecheck + tests + build + security (gitleaks + npm audit) on every push/PR.

## Phase 1 Foundation Upgrade — done

- Postgres DB `linky` + role `linky_user` created on VPS (`148.230.100.170:5432`), credentials in vault (not in git)
- Postgres migration script tested against VPS DB
- Dual-dialect DB layer prepared (runtime still SQLite; migration of call sites to async is tracked for a later phase)
- Redis client with graceful fallback — no crash if `REDIS_URL` unset
- Logger + healthcheck `/api/health` reporting db + redis state
- Unit tests: 86 tests covering utils, slug, hash, validators, clicks, analytics, qr, resolve-link, auth, redis degraded mode
- GitHub Actions CI: quality (lint+typecheck+test), build (Next.js prod), security (audit+gitleaks)

## Architecture

Single Next.js app (not monorepo) to minimize build complexity for MVP. Structure:

```
src/
├── app/                       # Next.js App Router
│   ├── page.tsx               # Landing with anonymous shorten
│   ├── layout.tsx             # Root layout + global Toast provider
│   ├── globals.css            # Tailwind + design tokens
│   ├── [slug]/route.ts        # Hot path: redirect handler
│   ├── p/[slug]/page.tsx      # Password gate page (server action)
│   ├── expired/page.tsx       # 410 Gone equivalent
│   ├── not-found.tsx          # 404 for unknown slugs
│   ├── signin/, signup/       # Auth pages
│   ├── dashboard/             # Authenticated app
│   │   ├── layout.tsx         # Sidebar + mobile bottom nav (auth-guarded)
│   │   ├── page.tsx           # Dashboard home (stats, recent links)
│   │   ├── links/             # List, [id] detail (Tabs), new
│   │   ├── analytics/         # Workspace-wide analytics
│   │   ├── qr/                # Standalone QR studio
│   │   └── settings/          # Profile + workspace + sponsor
│   └── api/                   # Route handlers (REST)
│       ├── shorten/           # POST anonymous or authed shorten
│       ├── auth/              # signup / login / logout
│       ├── links/             # GET list, POST create, [id] GET/PATCH/DELETE, [id]/analytics
│       ├── analytics/workspace/
│       ├── qr/                # GET QR SVG/PNG
│       └── slug-check/        # GET availability check
├── components/
│   ├── ui/                    # Base primitives (button, input, card, tabs, badge, toast, skeleton)
│   ├── brand/logo.tsx
│   ├── site-header.tsx
│   ├── shorten-form.tsx       # Anonymous shortener (landing)
│   ├── create-link-form.tsx   # Full link CRUD form
│   ├── link-list-item.tsx, links-table.tsx
│   ├── analytics-panel.tsx
│   ├── qr-studio.tsx
│   └── copy-button.tsx, delete-link-button.tsx, sparkline-chart.tsx
└── lib/
    ├── db/                    # Drizzle schema + client
    ├── auth.ts                # Session management
    ├── validators.ts          # Zod schemas
    ├── slug.ts, hash.ts, resolve-link.ts, clicks.ts
    ├── analytics.ts, qr.ts, i18n.ts, utils.ts
```

## Key conventions

- **Paths:** import from `@/…` (alias for `src/…`)
- **Server Components by default.** Mark `"use client"` only when needed.
- **Database access on server only.** Never import `@/lib/db` inside a client component.
- **Route handlers** validate via Zod first. Error messages in Bahasa Indonesia.
- **Session secret:** must be set via `AUTH_SECRET` env var, min 24 chars.
- **Slug uniqueness:** enforced per-domain via partial unique index.
- **Bot filtering:** `isBot(ua)` regex; click count only increments for non-bots.
- **Anonymous links:** tracked via hashed IP, daily limit configurable.

## Running

```bash
npm install            # installs deps + runs migrations via postinstall
npm run dev            # dev server on :1709
npm run typecheck      # strict TS check (no emit)
npm run lint           # next lint
npm run build          # production build
npm run db:migrate     # re-run migrations manually
```

DB file is `linky.db` at repo root. Delete to reset.

## Tests before claiming "done"

1. `npm run typecheck` zero errors
2. `npm run build` succeeds
3. `npm run dev` then verify on :1709:
   - Anonymous shorten works (landing)
   - Signup → Dashboard redirect
   - Create link with all options (password, expires, clickLimit, UTM, deep links)
   - Link detail page: Analytics / QR / Settings / Danger tabs all render
   - Redirect at `/<slug>` works and increments `click_count`
   - Password gate at `/p/<slug>` accepts correct password
   - Expired & not-found pages render

## Security notes

- Passwords bcrypt hashed (10 rounds)
- Sessions server-side table + signed JWT in httpOnly cookie
- IPs hashed with `AUTH_SECRET` as salt
- Destination URL validated (http/https only)
- SQL via Drizzle parametrized queries
- Security headers set in `next.config.ts`
- Rate limit: anonymous shortening capped by IP per-day

## Roadmap beyond MVP

Full v1.0/v2.0 in `~/.claude/plans/aku-ingin-membuat-web-sunny-hanrahan.md`. Next:
- Folders + tags + search
- Branded QR with logo upload
- UTM builder with recipes
- Bulk CSV import
- REST API with keys, webhooks
- Linky Page (link-in-bio)
- ClickHouse migration
- Cloudflare Workers redirect layer
