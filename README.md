<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/banner-dark.svg"><img src="docs/readme/banner-light.svg" width="100%" alt="Linky. Open-source link shortener and link-in-bio pages, with branded QR codes, click analytics, an API and webhooks."></picture>

<p align="center"><a href="#getting-started">Getting started</a> · <a href="https://github.com/nugrahalabib">More of my work</a> · <a href="https://nugrahalabib.com">nugrahalabib.com</a></p>

## Overview

Linky shortens links, makes branded QR codes and builds link-in-bio pages, with click analytics for every link. It is written for Indonesian creators, marketers, students and small businesses, and its interface is in Bahasa Indonesia.

Popular link shorteners keep custom slugs, analytics or branded QR codes behind paid plans. Linky is MIT licensed and has no plan tiers in its code: every workspace gets the same features, and the app can be self-hosted with Docker and PostgreSQL.

For developers there is a REST API with hashed Bearer keys and an OpenAPI 3.1 file, and webhooks signed with HMAC-SHA256 with a delivery log, so links can be created and tracked from other systems.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/features-dark.svg"><img src="docs/readme/features-light.svg" width="100%" alt="What Linky does: Short links with custom slugs, Password, expiry and limits, Device, country and A/B routing, QR studio, Click analytics, Linky Page, link in bio, REST API and webhooks, CSV import and organisation."></picture>

## Why it exists

Linky is an open-source link shortener and link-in-bio tool that Nugraha Labib Mujaddid designed and built in the AgentBuff family. A shop, creator or campaign team pastes a long URL, gets a short link and a branded QR code, and then sees how many people clicked, from which country, on which device and from which site. The same workspace builds a public link-in-bio page, and other systems can create links and receive click events through a REST API and signed webhooks. The code is MIT licensed and has no plan tiers, so every workspace gets every feature.

Small businesses, creators and students share links all day: in an Instagram bio, a WhatsApp broadcast, a TikTok profile or a printed flyer. A long URL looks untidy, cannot be changed once it is printed, and says nothing about who opened it.

Hosted link shorteners solve part of this, but custom slugs, detailed analytics, branded QR codes and link-in-bio pages often sit in different tools or behind paid plans. Moving away from one shortener also means retyping every old link.

Developers who want to create links from their own systems, or react when a link is clicked, need an API and webhooks rather than a dashboard-only tool.

| Who | What they do with it |
| --- | --- |
| **Shop or creator** | Signs in with Google, makes short links and QR codes for menus, promos and events, and builds one link-in-bio page for social profiles. |
| **Marketer** | Organises campaign links with folders, tags and saved UTM recipes, tests two landing pages with an A/B split, and reads clicks by country, device and referrer. |
| **Developer** | Creates an API key, calls the REST API from a script or backend, and receives signed webhook events when links are created or clicked. |
| **Visitor** | Opens a short link and lands on the right page for their phone, country or variant, or meets a password gate or an expiry page. |
| **Self-hoster** | Runs the Docker image with PostgreSQL and a Google OAuth client on their own server and domain. |

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/before-after-dark.svg"><img src="docs/readme/before-after-light.svg" width="100%" alt="Before and after"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/journey-dark.svg"><img src="docs/readme/journey-light.svg" width="100%" alt="How it works, step by step"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/value-dark.svg"><img src="docs/readme/value-light.svg" width="100%" alt="What it changes"></picture>

## Tour

### 1. Analytics

The analytics page shows a workspace or a single link over 7, 30 or 90 days. It opens with totals, unique visitors and the daily average, then a click trend, the top 10 links and the breakdown by country, referrer, device and browser. Bot clicks are never counted.

- Unique visitors are counted from salted IP hashes, never raw IP addresses.
- Top links show the change against the previous period and a 7-day sparkline.
- A recent activity list shows the latest 15 clicks with country, device and browser.
- The same breakdown exists per link and through the REST API.

<img src="docs/readme/screens/01-analytics.jpg" width="100%" alt="Workspace analytics for the last 7 days on invented demo data.">

<sub>Workspace analytics for the last 7 days on invented demo data.</sub>

<p><img src="docs/readme/screens/02-top-links.jpg" width="49%" alt="Top 10 links with clicks, change against the previous week and a 7-day sparkline."> <img src="docs/readme/screens/03-traffic-breakdown.jpg" width="49%" alt="Clicks by country, referrer, device and browser."></p>

<sub>Left: Top 10 links with clicks, change against the previous week and a 7-day sparkline. · Right: Clicks by country, referrer, device and browser.</sub>

<p><img src="docs/readme/screens/18-dark-mode.jpg" width="100%" alt="The same page in the dark theme, which follows the system setting."></p>

<sub>The same page in the dark theme, which follows the system setting.</sub>

### 2. Dashboard and links

The home screen sums up today's clicks, the last 30 days and the newest links, with shortcuts to create a link or a QR code. The links page lists every link with its folder, tags, password badge and click count, with search and filters by folder and tag.

- Search by slug, URL or title, and filter by folder and tag.
- Select several links to archive, delete or move them to a folder.
- Export all links to CSV.
- On a phone the sidebar becomes a bottom tab bar.

<img src="docs/readme/screens/04-dashboard.jpg" width="100%" alt="Home dashboard of the invented Kedai Rasa workspace.">

<sub>Home dashboard of the invented Kedai Rasa workspace.</sub>

<p><img src="docs/readme/screens/05-links.jpg" width="100%" alt="Links list with colour-coded folders, tags and click counts."></p>

<sub>Links list with colour-coded folders, tags and click counts.</sub>

### 3. Creating a link

A link needs only a destination. Everything else is optional: a custom slug, title, folder and tags, then folded sections for security and limits, app deep links, and UTM parameters that can be filled from a saved recipe.

- Password protection with a bcrypt hash and a gate page for visitors.
- Expiry by date and time or after a number of clicks.
- Separate iOS and Android destinations, chosen from the visitor's user agent.
- Open Graph title, description and image override, and a cloaking option that keeps the short URL in the address bar.

<img src="docs/readme/screens/06-create-link.jpg" width="100%" alt="New link form with a custom slug, title and folder.">

<sub>New link form with a custom slug, title and folder.</sub>

<p><img src="docs/readme/screens/07-link-analytics.jpg" width="100%" alt="Link detail with tabs for analytics, QR code, targeting and settings."></p>

<sub>Link detail with tabs for analytics, QR code, targeting and settings.</sub>

### 4. Targeting

The targeting tab adds rules on top of the destination. An A/B split sends visitors to up to 4 weighted variants, and the same visitor always gets the same variant. Country rules, up to 20, send visitors from a given country to a different URL.

- A/B results per variant come from the clicks table.
- The variant is chosen from a hash of the link and the visitor's IP, so it stays the same across visits.
- Order of rules: A/B split, then country, then iOS or Android link, then the main destination.

<img src="docs/readme/screens/08-ab-targeting.jpg" width="100%" alt="A/B split with two weighted variants for one link.">

<sub>A/B split with two weighted variants for one link.</sub>

### 5. QR studio

Each link has a QR tab, and a standalone studio makes a QR code for any text. Five presets give a starting look, then colours, gradient, module shape, a centre logo, a frame text and the size can be changed.

- Square, rounded or dotted modules, with a linear gradient.
- Codes use the highest error correction level, so a centre logo still scans.
- Download as PNG or SVG; SVG responses carry a strict sandboxing CSP.
- QR codes are also available from the REST API.

<img src="docs/readme/screens/09-qr-studio.jpg" width="100%" alt="QR studio with the Sunset preset, rounded modules and a frame text.">

<sub>QR studio with the Sunset preset, rounded modules and a frame text.</sub>

### 6. Linky Page

A Linky Page is a public link-in-bio page at /u/username, also reachable as /@username. The editor sets the title, bio, avatar and theme, and stacks blocks while a phone preview updates beside it.

- 8 block types: header, link button, social icons, text, divider, YouTube embed, image and countdown.
- 5 theme presets (Creator, Minimal, Neon, Student, UMKM) and 4 button styles.
- Page views and clicks per block are recorded; bot clicks and draft pages are ignored.
- Links, images, colours and backgrounds are sanitised when saved and when shown.

<img src="docs/readme/screens/10-linky-page-editor.jpg" width="100%" alt="Linky Page editor with the UMKM theme and a live phone preview.">

<sub>Linky Page editor with the UMKM theme and a live phone preview.</sub>

<p><img src="docs/readme/screens/11-linky-page-phone.jpg" width="100%" alt="The published page on a phone, for an invented coffee shop."></p>

<sub>The published page on a phone, for an invented coffee shop.</sub>

### 7. CSV import

The import wizard moves links in from other shorteners in three steps: upload, map columns, review and import. It detects the provider from the CSV headers, maps more than 50 column names to Linky fields, and lets the user fix the mapping.

- Recognises exports from Bit.ly, Rebrandly, TinyURL, Dub.co and Short.io, plus a Linky template.
- Handles Excel byte-order marks and comma, semicolon or tab separators.
- Slug conflicts can be skipped, renamed with a suffix, or fail the import.
- Missing tags are created, and an error report can be downloaded as CSV.

<img src="docs/readme/screens/12-csv-import.jpg" width="100%" alt="Step 2 of the import: a Bit.ly export detected and its columns mapped.">

<sub>Step 2 of the import: a Bit.ly export detected and its columns mapped.</sub>

### 8. Developer tools

The developer page holds API keys, webhooks and a test console. A key is shown in full once and stored only as a SHA-256 hash. Webhooks are signed with HMAC-SHA256, retried on failure, and every delivery is logged. Public docs at /docs/api include five recipes and signature checks in Node.js, Python and PHP.

- REST API v1: 9 operations for links, analytics, QR codes and key introspection, described in an OpenAPI 3.1 file.
- Keys can expire and are rate limited to 120 requests per minute.
- Webhook events: link.clicked, link.created, link.updated, link.deleted.
- Failed deliveries are retried after 1, 5 and 30 minutes, at most 4 attempts.

<img src="docs/readme/screens/13-api-keys.jpg" width="100%" alt="API keys, shown by prefix only, with last use and expiry.">

<sub>API keys, shown by prefix only, with last use and expiry.</sub>

<p><img src="docs/readme/screens/14-webhooks.jpg" width="49%" alt="A webhook with its masked signing secret and delivery log (synthetic deliveries)."> <img src="docs/readme/screens/15-api-docs.jpg" width="49%" alt="Public API documentation with the table of contents."></p>

<sub>Left: A webhook with its masked signing secret and delivery log (synthetic deliveries). · Right: Public API documentation with the table of contents.</sub>

### 9. Account and sign-in

Sign-in is Google only, using the authorization code flow with PKCE. Settings cover the profile, active sessions, workspace name and slug, theme and density, a JSON export of the account, and a danger zone.

- Each device session is listed and can be signed out, or all others at once.
- Sessions are server-side rows with a signed cookie, valid for 30 days.
- Deleting the account or wiping all links needs a typed confirmation.

<img src="docs/readme/screens/16-sessions.jpg" width="100%" alt="Active sessions in the security settings.">

<sub>Active sessions in the security settings.</sub>

<p><img src="docs/readme/screens/17-landing.jpg" width="100%" alt="The public landing page."></p>

<sub>The public landing page.</sub>

## How it is built

Linky is a single Next.js 15 App Router app written in strict TypeScript. Pages are server components by default, client components fetch from route handlers under /api, and the public REST API lives under /api/v1. Business logic sits in src/lib as small modules with tests beside them.

The redirect at /[slug] is a route handler that resolves the link for the request host, checks its status, picks the target, records the click without waiting for it, and answers with a 302 and no-store caching. Cloaked links go through a framed page, and password links through a gate page.

Data lives in PostgreSQL through Drizzle ORM and the pure JavaScript postgres-js driver. The project started on SQLite and moved its runtime to PostgreSQL; the old SQLite schema is kept for reference only. Redis is optional for rate limits and cache, and the app falls back to memory without it.

Sessions are custom: a row in the sessions table plus an HS256 JWT in an httpOnly cookie, so a session can be revoked server-side. API keys and webhook secrets are separate credentials scoped to one workspace.

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/architecture-dark.svg"><img src="docs/readme/architecture-light.svg" width="100%" alt="How Linky is built."></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/data-model-dark.svg"><img src="docs/readme/data-model-light.svg" width="100%" alt="Data model"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-1-dark.svg"><img src="docs/readme/flow-1-light.svg" width="100%" alt="A visitor opens a short link"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-2-dark.svg"><img src="docs/readme/flow-2-light.svg" width="100%" alt="Signing in with Google"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-3-dark.svg"><img src="docs/readme/flow-3-light.svg" width="100%" alt="Creating a link through the API"></picture>

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/flow-4-dark.svg"><img src="docs/readme/flow-4-light.svg" width="100%" alt="Delivering a webhook"></picture>

### Security

- Pages get a Content-Security-Policy with a per-request nonce and strict-dynamic in production, set in middleware.
- Link-in-bio content is sanitised when saved and when shown: links must be http(s), mailto or tel, images http(s) or data images, colours hex only.
- QR endpoints accept only raster data images as logos and send a sandboxing CSP with every SVG response.
- Webhook URLs pointing to loopback, private, link-local or cloud metadata addresses are refused at registration and again at delivery after DNS resolution.
- An OAuth identity is linked to an existing account only when the provider marks the email as verified, and session JWTs are pinned to HS256.
- In production the app refuses an AUTH_SECRET that is shorter than 32 characters or matches a known placeholder.
- IP addresses are stored only as salted hashes, and API responses never include password hashes.

### Decisions

| Decision | Why |
| --- | --- |
| PostgreSQL with postgres-js | The runtime moved from SQLite to PostgreSQL. postgres-js is pure JavaScript, so there is no native binding to build or block. |
| Own sessions instead of an auth framework | A sessions table plus a signed cookie keeps the code small and lets the user see and revoke each device. |
| Google sign-in only | Every link belongs to a known account, so abuse can be traced; there is no password to store or reset. |
| No anonymous shortening | The owner chose to require an account before any link is created. |
| node:test instead of Vitest | The test runner needs no native binaries, which kept tests running on a locked-down Windows machine. |
| Click recording not awaited | The redirect answers first and the click insert finishes in the background, so logging never slows the visitor. |
| One app, no monorepo | Dashboard, redirect, public pages and API share one build and one deploy. |

<picture><source media="(prefers-color-scheme: dark)" srcset="docs/readme/stack-dark.svg"><img src="docs/readme/stack-light.svg" width="100%" alt="Linky stack."></picture>

### Highlights

- 146 unit tests on Node's built-in test runner cover slugs, link resolution, CSV mapping, QR output, OAuth, URL safety and validators.
- Webhook delivery resolves the target host again before each request and never follows redirects, which blocks SSRF through DNS rebinding.
- Pages get a Content-Security-Policy with a per-request nonce and strict-dynamic in production, set in middleware.
- Linky Page content is sanitised when it is saved and when it is shown: links must be http(s), mailto or tel, and images http(s) or data images.
- An OAuth identity is linked to an existing account by email only when the provider marks that email as verified, and session JWTs are pinned to HS256.

## Getting started

Linky is one Next.js 15 app. It needs Node.js 22, a PostgreSQL database and a Google OAuth client, because sign-in is Google only. Redis and Google Safe Browsing are optional.

Three things in the old README are out of date: the runtime database is PostgreSQL only (the SQLite default `file:./linky.db` no longer works), there is no email and password login, and `npm install` does not run migrations any more.

## Requirements

- Node.js 22 (`engines` is `>=22.0.0 <23`, `.nvmrc` is `22`) and npm. The repo ships a `package-lock.json`.
- PostgreSQL. Any recent version; the local run below used `postgres:16-alpine`.
- A Google OAuth client ID and secret. `docs/AUTH-GOOGLE-SETUP.md` walks through the Google Cloud Console. The redirect URI to register is `<NEXT_PUBLIC_APP_URL>/api/auth/oauth/google/callback`.

## Run it locally

```bash
git clone https://github.com/nugrahalabib/Linky-Agentbuff.git
cd Linky-Agentbuff
npm ci
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Required. A `postgres://` URL. Replace the `file:./linky.db` value from `.env.example`. |
| `AUTH_SECRET` | Required. Random string, at least 24 characters in development. Production needs 32 or more and refuses known placeholders. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Required to sign in. Without them the sign-in page says Google login is not configured. |
| `NEXT_PUBLIC_APP_URL` | Base URL used in short links. Defaults to `http://localhost:1709`. |
| `REDIS_URL` | Optional. Rate limits and cache fall back to memory without it. |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Optional. Without it, only the built-in URL heuristics run. |
| `SSO_OIDC_LABEL`, `SSO_OIDC_AUTHORIZE_URL`, `SSO_OIDC_TOKEN_URL`, `SSO_OIDC_USERINFO_URL`, `SSO_OIDC_CLIENT_ID`, `SSO_OIDC_CLIENT_SECRET`, `SSO_OIDC_SCOPE` | Optional. Fill all of them to show a generic OIDC single sign-on button. |
| `LOG_LEVEL` | Optional pino log level. |

Create the tables. The migration scripts read `DATABASE_URL` from the shell, not from `.env.local`, so export it first:

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/linky"
npm run db:migrate
```

On Windows with Node 22, `npm run db:migrate` currently exits without doing anything, because `scripts/migrate.ts` starts `tsx.cmd` without a shell. Run the Postgres migration directly there:

```bash
npx tsx scripts/migrate-pg.ts
```

Known gap: `scripts/migrate-pg.ts` does not yet add three `sessions` columns that the login code writes, so the first sign-in on a fresh database fails with `column "user_agent" does not exist`. Until the migration is fixed, add them once:

```sql
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
```

Start the dev server and open http://localhost:1709:

```bash
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server with Turbopack on port 1709 |
| `npm run build` | Production build (`next build`) |
| `npm start` | Serve the production build on port 1709 |
| `npm run lint` | ESLint through `next lint` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | 146 unit tests with `node:test` and `tsx`. Needs `AUTH_SECRET` and a `postgres://` `DATABASE_URL` in the environment; no live database is used. |
| `npm run test:watch` | Tests in watch mode |
| `npm run db:migrate` | Picks `scripts/migrate-pg.ts` for a `postgres://` URL (see the Windows note above) |
| `npm run db:generate` | `drizzle-kit generate` |
| `npm run db:studio` | `drizzle-kit studio` |

## Docker

The `Dockerfile` builds a Node 22 image that serves the app on port 1709 and has a health check on `/api/health`. `docker-compose.yml` runs that image next to Caddy, which terminates TLS using the `Caddyfile`. Two things to know before using them:

- The compose file does not start a database. It joins an external Docker network named `linky-net` and expects a PostgreSQL container you run yourself on that network. Create the network once with `docker network create linky-net`.
- `AUTH_SECRET` and `DATABASE_URL` must be set (the compose file stops if they are missing).
- The `Caddyfile`, the compose default for `NEXT_PUBLIC_APP_URL` and the `Dockerfile` build stage all name the project's own domain. Change them to yours before building: Next.js copies `NEXT_PUBLIC_` values into the build, so the value set in the `Dockerfile` is the one short links will use.

Run migrations in the container with `docker compose run --rm linky npm run db:migrate`. This is what `.github/workflows/deploy.yml` does, after a `pg_dump` backup and before a health check that rolls the app back if it fails.

## Project structure

```text
src/
  app/
    [slug]/            redirect route: resolve, check, record the click, 302
    c/  p/  u/         cloaked frame, password gate, public Linky Page
    dashboard/         links, analytics, QR studio, Linky Pages, folders, tags,
                       UTM recipes, domains, CSV import, developer, settings
    api/               dashboard route handlers
    api/v1/            public REST API (links, analytics, QR, me)
    docs/api/          public API docs page; docs/openapi.json serves the spec
  components/          UI, including the Linky Page editor and renderer
  lib/                 auth, OAuth, slugs, link resolution, clicks, analytics,
                       QR, CSV mapping, webhooks, URL safety; *.test.ts beside them
  lib/db/schema.ts     Drizzle schema (PostgreSQL, 18 tables)
  middleware.ts        nonce-based Content-Security-Policy
scripts/               migrations (migrate.ts, migrate-pg.ts), test runner, backup
docs/                  architecture reference, Google login setup
```

## What was actually run

On 26 Nov 2026 the public repo (last commit `94bfa63`) was copied to a temp folder and run on Windows 11 with Node 22.16:

1. `npm ci` (532 packages). No migration ran during install.
2. `npm test` with a local `AUTH_SECRET` and a dummy `postgres://` URL: 146 tests in 51 suites, 146 passed, 0 failed.
3. A `postgres:16-alpine` container, then `npm run db:migrate`, which did nothing on Windows, then `npx tsx scripts/migrate-pg.ts`, which applied 2 migrations and created 18 tables.
4. Signing in failed until the three `sessions` columns above were added by hand.
5. `DATABASE_URL=file:./linky.db` was also tried: the runtime client still treats it as PostgreSQL and cannot connect.
6. `next dev` with invented demo data for the screenshots. `/dashboard/developer` returned a server error on PostgreSQL (its 7-day counters compare timestamps with a number and a boolean with `0`); the screenshots of that page come from a copy with those two lines fixed.

## License

MIT. Copyright (c) 2026 Nugraha Labib Mujaddid. See `LICENSE`.

---

<sub>Made by [Nugraha Labib Mujaddid](https://github.com/nugrahalabib) · [nugrahalabib.com](https://nugrahalabib.com) · [nugrahalabib@gmail.com](mailto:nugrahalabib@gmail.com)</sub>
