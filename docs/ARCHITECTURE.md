# Linky — Architecture Reference

> Deep technical reference. Complements **CLAUDE.md** (which is the onboarding doc). This file goes into the *why* behind each layer and the *how* of every critical flow.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Model — Every Table Explained](#2-data-model--every-table-explained)
3. [Request Lifecycles](#3-request-lifecycles)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [REST API v1 Internal Design](#5-rest-api-v1-internal-design)
6. [Webhook Delivery System](#6-webhook-delivery-system)
7. [CSV Import Pipeline](#7-csv-import-pipeline)
8. [Analytics & Click Tracking](#8-analytics--click-tracking)
9. [QR Code Generation](#9-qr-code-generation)
10. [Linky Pages (Link-in-Bio)](#10-linky-pages-link-in-bio)
11. [Safe Browsing & Anti-Abuse](#11-safe-browsing--anti-abuse)
12. [Frontend Patterns](#12-frontend-patterns)
13. [Testing Infrastructure](#13-testing-infrastructure)
14. [Performance Targets & Bottlenecks](#14-performance-targets--bottlenecks)
15. [Deployment Topology](#15-deployment-topology)
16. [Migration Strategy (SQLite → Postgres)](#16-migration-strategy-sqlite--postgres)

---

## 1. System Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                          PUBLIC WEB (HTTPS)                         │
│  https://linky.agentbuff.id                                         │
└────────────────────────────────────┬───────────────────────────────┘
                                     │
                  ┌──────────────────┴──────────────────┐
                  │       Caddy (auto-TLS)              │
                  │       Reverse proxy → :1709         │
                  └──────────────────┬──────────────────┘
                                     ▼
        ┌────────────────────────────────────────────────────────┐
        │  Next.js 15 App (Node 22, App Router, Turbopack)       │
        │  ┌──────────────────────────────────────────────────┐  │
        │  │  Public surface                                   │  │
        │  │  - Landing /                                      │  │
        │  │  - Docs /docs/api, /docs/openapi.json             │  │
        │  │  - Auth /signin, /signup                          │  │
        │  │  - Redirect /[slug] (HOT PATH)                    │  │
        │  │  - Linky Pages /u/[username]                      │  │
        │  └──────────────────────────────────────────────────┘  │
        │  ┌──────────────────────────────────────────────────┐  │
        │  │  Dashboard (auth-gated)                           │  │
        │  │  - /dashboard/* (RSC + client islands)            │  │
        │  └──────────────────────────────────────────────────┘  │
        │  ┌──────────────────────────────────────────────────┐  │
        │  │  Route Handlers                                   │  │
        │  │  - /api/* (session-cookie auth, JSON internal)    │  │
        │  │  - /api/v1/* (Bearer auth, CORS, rate-limited)    │  │
        │  └──────────────────────────────────────────────────┘  │
        └────────────────────────────┬───────────────────────────┘
                                     │ sync better-sqlite3
                                     ▼
                        ┌────────────────────────┐
                        │  SQLite file           │
                        │  linky.db (WAL mode)   │
                        └────────────────────────┘
                                     │ (planned, not active)
                                     ▼
                        ┌────────────────────────┐
                        │  Postgres (Hostinger)  │
                        │  148.230.100.170:5432  │
                        └────────────────────────┘

  ┌────────────────────────────┐    ┌────────────────────────────┐
  │  Optional Redis             │    │  Optional Google Safe       │
  │  (rate limit, cache)        │    │  Browsing v4 API            │
  │  ioredis graceful fallback  │    │  Heuristic-only kalau kosong │
  └────────────────────────────┘    └────────────────────────────┘
```

### Boundary rules

| From | Can call | Cannot call |
|---|---|---|
| Server Component | Other Server Components, `lib/*`, `lib/db` | Client-only API (`window`, `localStorage`) |
| Client Component | Other Client Components, `fetch()` to `/api/*` | `lib/db` (must go through API) |
| Route Handler | `lib/*`, `lib/db`, other route handlers via internal fetch | (jangan import client component) |
| `lib/*` | Other lib files | (no React, no Next.js APIs) |

---

## 2. Data Model — Every Table Explained

### `users`
```typescript
{
  id: text (pk, nanoid 14)
  email: text not null, unique
  password_hash: text not null (bcryptjs 10 rounds)
  name: text nullable
  email_verified_at: timestamp_ms nullable (untuk masa depan, sekarang auto-set ke now() saat signup)
  locale: text not null default 'id' ('id' | 'en')
  created_at, updated_at: timestamp_ms
}
```
**Indices:** unique email. **Note:** kolom `active_workspace_id` sempat ada di migration 0007 lalu dihapus di 0010_drop_team karena tidak diperlukan setelah single-user pivot.

### `sessions`
```typescript
{
  id: text (pk, nanoid 32)
  user_id: text FK users(id) ON DELETE CASCADE
  expires_at: timestamp_ms not null
  user_agent: text nullable (max 250 char, populated saat createSession dari headers)
  ip_hash: text nullable (sha256 dengan AUTH_SECRET sebagai salt)
  last_seen_at: timestamp_ms nullable (updated tiap request via getSessionUser)
  created_at, updated_at: timestamp_ms
}
```
**Indices:** user_id, expires_at. **JWT** disimpan di httpOnly cookie sebagai bearer-ish auth — `sid` payload ditegakkan via DB lookup, jadi revocation langsung berlaku.

### `workspaces`
```typescript
{
  id: text (pk, nanoid 12)
  slug: text not null, unique (untuk display dan masa depan)
  name: text not null
  owner_id: text FK users(id) ON DELETE CASCADE
  plan: text 'free' | 'self_hosted' default 'free'
  created_at, updated_at: timestamp_ms
}
```
**1:1 dengan user.** Auto-created di `getActiveWorkspace()` kalau user belum punya. Tidak ada members (deprecated).

### `domains`
```typescript
{
  id: text (pk, nanoid 14)
  workspace_id: text FK workspaces(id) ON DELETE CASCADE
  hostname: text not null, unique
  verified: boolean default false
  ssl_status: 'pending' | 'active' | 'failed' default 'pending'
  is_default: boolean default false
  verification_token: text nullable
}
```
**Belum dipakai aktif.** Untuk masa depan: user bisa custom domain (`go.brand.com` → workspace mereka). Sekarang semua link pakai default domain (NEXT_PUBLIC_APP_URL).

### `folders` & `tags`
```typescript
folders: {
  id, workspace_id, parent_id (self-FK untuk nested), name, color (#hex), timestamps
}
tags: {
  id, workspace_id, name, color, timestamps
  unique(workspace_id, name)
}
link_tags: {
  link_id FK CASCADE
  tag_id FK CASCADE
  pk composite (link_id, tag_id)
}
```
Folder bisa nested 3 level (UI enforced, schema doesn't enforce depth). Tag many-to-many.

### `links` (tabel paling kompleks)
```typescript
{
  id: text (pk, nanoid 14)
  workspace_id: text FK workspaces(id) ON DELETE CASCADE
  domain_id: text FK domains(id) ON DELETE SET NULL (nullable = default domain)
  slug: text not null
  destination_url: text not null
  title, description, favicon_url: text nullable
  folder_id: text FK folders(id) ON DELETE SET NULL
  password_hash: text nullable (bcryptjs)
  expires_at: timestamp_ms nullable
  click_limit: integer nullable
  ios_url, android_url: text nullable (deep link override per UA)
  utm_params: jsonb<Record<string,string>> nullable
  geo_rules: jsonb<Array<{country, url}>> nullable
  ab_variants: jsonb<Array<{url, weight, label?}>> nullable
  og_title, og_description, og_image: text nullable
  cloak: boolean default false
  click_count: integer default 0 (denormalized counter, updated by recordClick)
  archived: boolean default false
  is_anonymous: boolean default false (anonymous shortener)
  anon_owner_ip: text nullable (untuk anon link retention)
  created_by: text FK users(id) ON DELETE SET NULL
  created_at, updated_at: timestamp_ms
}
```
**Critical indices:**
- `unique(domain_id, slug)` — slug unique per domain
- Partial unique `slug WHERE domain_id IS NULL` — untuk default domain
- `workspace_id`, `folder_id`, `created_at`, `anon_owner_ip`

### `clicks` (high-volume table)
```typescript
{
  id: integer (autoincrement)
  link_id: text FK links(id) ON DELETE CASCADE
  ts: timestamp_ms default now
  country, region, city: text nullable
  device, os, browser: text nullable
  referrer: text nullable
  ip_hash: text nullable
  is_bot: boolean default false
  utm_source, utm_medium, utm_campaign: text nullable
  ab_variant: text nullable
}
```
**Indices:** `(link_id, ts)`, `ts`, `(link_id, ab_variant)`. **Pertumbuhan:** ini tabel yang paling cepat berkembang. Saat scale ke 1M+ clicks/bulan/workspace, migrate ke ClickHouse atau Tinybird sebagai kolom (TimescaleDB juga opsi).

### `api_keys`
```typescript
{
  id, workspace_id, user_id (FK CASCADE)
  name: text not null (display only)
  key_hash: text not null, unique (sha256 dari token)
  key_prefix: text not null (10 char prefix untuk display)
  last_used_at: timestamp_ms nullable (updated di authenticateApiKey)
  expires_at: timestamp_ms nullable
  timestamps
}
```
**Token format:** `lnk_<24 byte base64url>` (~32 char). **Storage:** hanya hash. Token mentah cuma muncul sekali saat dibuat.

### `webhooks` & `webhook_deliveries`
```typescript
webhooks: {
  id, workspace_id (FK CASCADE)
  url: text not null
  secret: text not null ('whsec_<20 byte base64url>')
  events: jsonb<string[]> default '["link.clicked"]'
  active: boolean default true
  last_delivery_at, last_status_code, failure_count
  timestamps
}

webhook_deliveries: {
  id: text (whd_<10 byte base64url>)
  webhook_id FK CASCADE
  event: text
  status_code: integer nullable
  success: boolean
  duration_ms: integer
  error: text nullable
  request_body: text (max 4000 char)
  response_snippet: text (max 500 char)
  ts: timestamp_ms
}
```
**Auto-prune:** setelah insert, run `DELETE ... WHERE id NOT IN (SELECT id ... ORDER BY ts DESC LIMIT 50)` — keep last 50 per webhook.

### `linky_pages` & `linky_page_clicks`
```typescript
linky_pages: {
  id, workspace_id (FK CASCADE)
  slug: text unique
  title: text not null
  bio, avatar_url: text nullable
  theme: jsonb<{preset, primary, background, font, buttonStyle}>
  background: text nullable
  blocks: jsonb<LinkyPageBlock[]> default '[]'
  views: integer default 0
  published: boolean default true
  created_by FK SET NULL
}

LinkyPageBlock {
  id: string
  kind: 'header' | 'link' | 'social' | 'text' | 'divider' | 'youtube' | 'image' | 'countdown'
  data: Record<string, unknown>
}
```
**Public access:** `/u/<slug>` (was `@<slug>` but Next.js parsed as parallel route slot, jadi diubah ke `/u/`).

### `safe_browsing_cache`
```typescript
{
  url_hash: text (pk, sha256 dari URL)
  verdict: 'safe' | 'suspicious' | 'malicious'
  threat_types: text nullable (comma-separated)
  checked_at, expires_at: timestamp_ms
}
```
**TTL:** 24 jam default.

---

## 3. Request Lifecycles

### A. Anonymous shorten (landing page)

```
1. Browser POSTs /api/shorten { destinationUrl, customSlug? }
2. Route handler:
   - getClientIp() → hash with AUTH_SECRET
   - Check anon_daily_limit (count links WHERE anon_owner_ip = hash AND created_at > 24h ago)
   - validate Zod shortenAnonSchema
   - normalizeUrl + isValidUrl
   - checkUrlSafety() → if malicious, reject
   - generateSlug or validate customSlug
   - INSERT links { is_anonymous: true, anon_owner_ip: hash, workspace_id: null }
   - return { shortUrl, slug, destinationUrl }
3. Client displays card with copy button + "Save forever? [Email]" CTA
```

### B. Authenticated shorten (dashboard)

Similar to anon but:
- getSessionUser() required
- ensureWorkspace() to get workspace
- workspace_id populated, is_anonymous: false
- Optional fields (folder, tag, password, expires, UTM, OG, deep link, cloak) from form
- After create: fireWebhooks(workspaceId, 'link.created', {...})

### C. Redirect hot path (most critical)

File: `src/app/[slug]/route.ts`

```
1. GET /:slug arrives
2. params.slug → resolveLinkBySlug(slug):
   - db.select().from(links).where(eq(slug, ...) AND isNull(domain_id))
   - returns Link | null
3. If !link → redirect /not-found
4. checkLinkStatus(link):
   - if expires_at < now → 'expired'
   - if click_limit && click_count >= click_limit → 'click_limit'
   - if password_hash → 'password_required'
   - else 'redirect'
5. If expired/limit → redirect /expired
6. If password_required → redirect /p/:slug (gate page)
7. pickTargetUrl(link, ua, country, clientIp):
   - if iosUrl && UA matches iOS → use iosUrl
   - if androidUrl && UA matches Android → use androidUrl
   - if geo_rules && country match → use geo_rules[country]
   - if ab_variants → hash(ip+slug) % totalWeight → sticky variant
   - else → destination_url
   - append utm_params as query string
   - return { url, variant? }
8. If cloak → redirect to /c/:slug (iframe page) instead of target
9. If !isBot(ua) → recordClick({...}) (sync, no await)
10. NextResponse.redirect(target, 302, { Cache-Control: 'private, no-store' })
```

### D. Password gate

File: `src/app/p/[slug]/page.tsx`

```
1. GET /p/:slug → server component renders form
2. Form server action unlockAction(formData):
   - resolveLinkBySlug
   - bcrypt.compare(password, passwordHash)
   - if !ok → redirect /p/:slug?error=1
   - recordClick({ ... workspaceId, slug, destinationUrl })
   - redirect to target URL
```

### E. API v1 Create Link

File: `src/app/api/v1/links/route.ts`

```
1. POST /api/v1/links with Authorization: Bearer lnk_...
2. withApiAuth(req):
   - authenticateApiKey() → sha256 token → lookup → check expiry
   - rateLimitCheck() → 120/min per key (in-memory Map)
   - return { ok, auth: { workspace, key, rateHeaders } }
3. readJson<unknown>(req) → parse JSON
4. createLinkSchema.safeParse(body) → validate
5. normalizeUrl + isValidUrl + checkUrlSafety
6. Slug handling (custom or generate)
7. db.insert(links).values({ workspace_id: auth.workspace.id, ... })
8. fireWebhooks(auth.workspace.id, 'link.created', { link_id, slug, destination_url, ... })
9. apiOk({ data: serializeLink(created) }, { status: 201, extraHeaders: rateHeaders })
```

---

## 4. Authentication & Authorization

### Session creation flow

```typescript
// src/lib/auth.ts createSession()
1. sessionId = nanoid(32)
2. expiresAt = now + 30 days
3. Try to get request headers (userAgent, IP)
4. ipHash = sha256(ip + AUTH_SECRET)
5. INSERT INTO sessions { id, user_id, expires_at, user_agent, ip_hash, last_seen_at: now }
6. token = SignJWT({ sid: sessionId, uid: userId }).HS256(AUTH_SECRET)
7. Set httpOnly cookie 'linky_session' with token
8. return sessionId
```

### Session validation (every request)

```typescript
// src/lib/auth.ts getSessionUser()
1. Get cookie 'linky_session'
2. jwtVerify(token, AUTH_SECRET) → { sid, uid }
3. db.select sessions WHERE id = sid
4. If !session || expires_at < now → return null (also delete row if expired)
5. db.select users WHERE id = session.user_id
6. UPDATE sessions SET last_seen_at = now WHERE id = sid (best-effort)
7. return { user, session }
```

### API key validation (`/api/v1/*`)

```typescript
// src/lib/api-auth.ts authenticateApiKey()
1. Parse 'Authorization: Bearer lnk_xxx' header
2. Regex validate format
3. hash = sha256(token)
4. db.select api_keys WHERE key_hash = hash AND (expires_at IS NULL OR expires_at > now)
5. If !key → null
6. db.select workspaces WHERE id = key.workspace_id
7. UPDATE api_keys SET last_used_at = now
8. return { key, workspace }
```

### Workspace isolation

All authenticated queries filter by `workspace_id`:

```typescript
// Example: GET /api/v1/links/{id}
db.select().from(links)
  .where(and(
    eq(links.id, id),
    eq(links.workspaceId, auth.workspace.id)  // ← critical
  ))
  .get()
// If not found → 404 (don't leak existence in other workspace)
```

**Tested:** session-tested cross-workspace pen test (Audit 4 di session log). Workspace A 100% tidak bisa lihat/edit/hapus link workspace B.

---

## 5. REST API v1 Internal Design

### Response format

**Success:**
```json
{
  "data": { ... }  // single resource
  // OR
  "data": [ ... ], "count": N  // list
}
```

**Error:**
```json
{
  "error": { "code": "validation_error", "message": "..." },
  "request_id": "nanoid12"
}
```

### Code stability

These codes are part of the public contract. **Never rename them:**

| HTTP | code | When |
|---|---|---|
| 400 | `invalid_json` | Body bukan JSON valid |
| 400 | `validation_error` | Zod schema fail |
| 400 | `invalid_url` | URL bukan http/https |
| 400 | `invalid_slug` | Slug format / reserved |
| 401 | `unauthorized` | Token kosong/invalid/expired |
| 404 | `not_found` | Resource tidak ada di workspace |
| 409 | `slug_taken` | customSlug bentrok |
| 422 | `unsafe_url` | Safe Browsing flag |
| 429 | `rate_limited` | 120 req/menit terlewati |

### Rate limit headers (always present on success)

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 117
X-RateLimit-Reset: 1745601923  (unix seconds)
```

### CORS

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With
Access-Control-Max-Age: 86400
Vary: Origin
```

Setiap endpoint v1 expose handler `OPTIONS` yang return `apiOptions()` (204).

### Serializer pattern

```typescript
// src/lib/api-serializers.ts
serializeLink(drizzleRow) → PublicLink {
  id, slug, short_url, destination_url, title, description, favicon_url,
  folder_id, click_count, archived, cloak, has_password (boolean!),
  expires_at (ISO), click_limit, ios_url, android_url, utm_params,
  og: { title, description, image },
  created_by, created_at (ISO), updated_at (ISO)
}
```

`has_password` adalah computed `Boolean(passwordHash)` — kita tidak expose hash.

---

## 6. Webhook Delivery System

### Fire flow

```typescript
// src/lib/webhooks.ts fireWebhooks(workspaceId, event, data)
1. db.select webhooks WHERE workspace_id = workspaceId
2. filter where active && events.includes(event)
3. If empty → return early
4. For each webhook:
   - deliveryId = whd_<10 byte base64url>
   - payload = { event, workspace_id, data, delivery_id, timestamp }
   - body = JSON.stringify(payload)
   - void deliverOne(...) (fire and forget, async)
5. Caller does NOT await
```

### deliverOne()

```typescript
1. sig = createHmac('sha256', secret).update(body).digest('hex')
2. AbortController with 5s timeout
3. fetch(url, {
     method: POST,
     headers: {
       'Content-Type': 'application/json',
       'User-Agent': 'Linky-Webhook/1.0',
       'X-Linky-Event': event,
       'X-Linky-Signature': `sha256=${sig}`,
       'X-Linky-Delivery-Id': deliveryId
     },
     body,
     signal: ctrl.signal
   })
4. Capture: statusCode, success (2xx), responseSnippet (first 500 char)
5. On exception: error message
6. Calculate durationMs = now - startedAt
7. INSERT webhook_deliveries
8. UPDATE webhooks SET last_delivery_at, last_status_code, failure_count
9. Auto-prune: DELETE webhook_deliveries WHERE webhook_id = X AND id NOT IN
   (SELECT id ... ORDER BY ts DESC LIMIT 50)
```

### Receiver verification (documented in /docs/api)

Node.js example:
```javascript
import crypto from 'node:crypto';
export function verify(rawBody, header, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const got = (header || '').replace(/^sha256=/, '');
  if (got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}
```

### Retry policy

**Saat ini: single attempt, no retry.** Failure tercatat di `webhook_deliveries.success = false`. `webhooks.failure_count` increment, status pill di UI berubah ke "failing" kalau >3 consecutive fails.

**Roadmap:** exp-backoff 1m → 5m → 30m → 2h, max 4 attempts. Akan butuh persistent queue (Postgres LISTEN/NOTIFY atau Redis Streams).

---

## 7. CSV Import Pipeline

### parseCsv() detection sniff

```typescript
detectDelimiter(input):
  sample = first non-empty line
  for delim in [',', ';', '\t']:
    count occurrences outside quotes
  return delim with highest count (tie-break: ',' > ';' > '\t' if equal-low)
```

### autoMap() field resolution

```typescript
ALIASES = {
  destination_url: ['destination_url', 'long_url', 'original_url', 'url', 'destination', 'target', ...],
  slug: ['slug', 'key', 'slashtag', 'path', 'alias', 'custom_bitlink', 'back_half'],
  title: ['title', 'name', 'label'],
  tags: ['tags', 'tag', 'labels'],
  // ... 15 fields total
}

autoMap(headers) → Record<FieldKey, number | null>
  for each FieldKey:
    for each alias:
      if normalized(headers).indexOf(normalized(alias)) >= 0:
        return that index
    return null
```

`normalized` = lowercase, trim, replace whitespace+hyphen with underscore.

### detectProvider() heuristic

```typescript
detectProvider(headers):
  set = headers.map(normalize)
  if set has 'long_url' and 'link' and 'title' → 'bitly'
  if set has 'slashtag' or ('destination' and 'created') → 'rebrandly'
  if set has 'originalurl' and 'path' → 'shortio'
  if set has 'key' and ('url' or 'destination_url') → 'dubco'
  if set has 'originalurl' → 'tinyurl'
  if set has 'destination_url' or 'slug' → 'linky'
  else → 'unknown'
```

### Endpoint flow

```
POST /api/links/import body { csv, commit?, mapping?, conflict?, defaultFolderId?, defaultTagIds? }

1. Auth + workspace
2. parseCsv → { headers, rows, delimiter }
3. detectProvider(headers) → provider
4. autoMap(headers) + override with body.mapping → final mapping
5. If destination_url not mapped → 400 with suggestion
6. Validate defaultFolderId belongs to workspace
7. Validate defaultTagIds all belong to workspace
8. For each row:
   - extract destination_url, normalize, validate
   - extract slug, validate isValidSlug, check conflict:
     - 'fail' → push issue
     - 'skip' → continue silently
     - 'rename' → try slug-1, slug-2, ... up to 50
   - If slug empty → generateSlug() unique
   - Extract date/limit/utm/tags
   - Push prepared { rowIndex, slug, destinationUrl, ..., tags[] }
9. If !commit → return preview with sample (10), issues (100 max), provider, mapping
10. If commit:
    - Resolve/create tags by name (case-insensitive)
    - db.transaction:
      - INSERT links
      - INSERT link_tags for each (link_id, tag_id) combo + defaultTagIds
    - return { committed: true, created, skipped, total, tags_created }
```

### UI wizard

3 steps controlled by `step: 1 | 2 | 3 | 4` state in `csv-importer.tsx`:

- **Step 1:** Upload (drag-drop atau paste textarea) → POST commit:false → detect provider+mapping → step 2
- **Step 2:** Show table "Field Linky → Kolom CSV" with dropdown override per field + conflict/folder/tag controls → POST commit:false with overrides → step 3
- **Step 3:** Review sample + issues + tags-to-create count → POST commit:true → step 4 (success card)
- **Step 4:** Success with "Lihat semua link", "Unduh laporan error", "Import lagi"

---

## 8. Analytics & Click Tracking

### Click recording

```typescript
// src/lib/clicks.ts recordClick(ctx)
1. parseUa(ua) → { device, os, browser } from src/lib/resolve-link.ts
2. isBot(ua) check
3. INSERT clicks { link_id, country, region, city, device, os, browser, referrer, ip_hash, is_bot, ab_variant }
4. If !bot:
   - UPDATE links SET click_count = click_count + 1 WHERE id = link_id
   - If workspaceId provided → fireWebhooks(workspaceId, 'link.clicked', { link_id, slug, ... })
   - Else fetch link → workspace_id → fire
```

### Workspace analytics query

```typescript
// src/lib/analytics.ts getWorkspaceAnalytics(workspaceId, days, linkId?)
- conds = [eq(links.workspace_id, ws), eq(clicks.is_bot, false), gte(clicks.ts, daysAgo(days))]
- if linkId → push eq(clicks.link_id, linkId)
- Total clicks
- Unique visitors (count distinct ip_hash)
- Daily trend (group by date)
- Top 10 countries / referrers / devices / browsers
- avgPerDay = totalClicks / days
- totalLinks (non-archived in workspace)
```

### Top links with delta + sparkline

```typescript
// getTopLinks(workspaceId, days, limit=10)
1. Join links LEFT clicks (ts within period) GROUP BY link_id ORDER BY count DESC LIMIT N
2. For each row:
   - Get prev period count (between days*2 ago and days ago)
   - Get 7-day sparkline (fill missing days with 0)
   - delta% = (cur - prev) / prev * 100 (or 100 if prev=0 and cur>0)
3. Return TopLinkRow[]
```

---

## 9. QR Code Generation

`src/lib/qr.ts` exports:
- `qrToSvg(text, config)` — plain QR
- `qrToPngBuffer(text, config)` — PNG bytes
- `brandedQrSvg(text, { fg, bg, size, margin, shape, frameText, logoDataUrl, gradient })` — fancy

**Two endpoints:**
- `/api/qr` — plain QR with simple config
- `/api/qr-branded` — POST with logo upload + gradient

**Public API:** `/api/v1/qr?text=...&format=svg/png&size=...&fg=...&bg=...`

**Branded options:**
- shape: square / rounded / dots (eye styles)
- gradient: { from: hex, to: hex } linear
- frameText: CTA text below QR
- logoDataUrl: base64 data URI (server doesn't fetch external)

Auto-applies error correction level H when logo present.

---

## 10. Linky Pages (Link-in-Bio)

Schema: `linky_pages.blocks` is JSON array of `LinkyPageBlock`. Editor (`linky-page-editor.tsx`):

- Split-view: phone preview iframe + block inspector panel
- Block types: header, link, social, text, divider, youtube, image, countdown
- Theme presets: creator, minimal, neon, student, umkm
- Button styles: filled, outline, soft, glass

**Public render:** `/u/[username]` → `linky-page-renderer.tsx` (Server Component) reads page by slug, increments views (best-effort UPDATE), renders blocks via switch statement.

**Click tracking:** each block has `id`, clicks to external URLs send beacon to `/api/linky-pages/[id]/click` with `{ blockId }`. Tracked in `linky_page_clicks`.

---

## 11. Safe Browsing & Anti-Abuse

```typescript
// src/lib/safe-browsing.ts checkUrlSafety(url)
1. Heuristic checks (always):
   - URL parses?
   - hostname suspicious TLD (zip, mov, kim, work, ...)
   - hostname punycode (xn--) or homograph
   - hostname is internal IP (10.*, 192.168.*, ...)
   - path contains phishing patterns (wp-admin, login, secure, ...) over HTTP
   - excessive subdomains (>4 dots)
2. If heuristic = malicious → return early
3. If GOOGLE_SAFE_BROWSING_API_KEY:
   - Check safe_browsing_cache (24h TTL)
   - If miss: POST safebrowsing.googleapis.com/v4/threatMatches:find
   - Cache result
4. Combine: API verdict trumps if malicious, else heuristic verdict wins
```

**Output:** `{ verdict: 'safe' | 'suspicious' | 'malicious', threatTypes: string[], source: 'api' | 'cache' | 'heuristic' | 'skipped' | 'safe' }`

**Called from:** POST `/api/links`, POST `/api/v1/links`, POST `/api/shorten`.

---

## 12. Frontend Patterns

### Server Component → Client Component data flow

```tsx
// Server (gets initial data)
export default async function FoldersPage() {
  const ws = await ensureWorkspace((await requireUser()).id);
  const all = db.select().from(folders).where(eq(folders.workspaceId, ws.id)).all();
  return <FolderManager initial={all} />;
}

// Client (handles mutations)
'use client';
export function FolderManager({ initial }) {
  const [list, setList] = useState(initial);
  const create = async () => {
    const res = await fetch('/api/folders', { method: 'POST', ... });
    const { folder } = await res.json();
    setList([folder, ...list]);
  };
  return <div>...</div>;
}
```

### Toast notifications

`src/components/ui/toast.tsx` provides context. Use `const { push } = useToast()` and `push({ title, description?, variant: 'success' | 'danger' })`.

### Search trigger + Cmd+K

`SearchTrigger` (sidebar) opens the same modal as Cmd+K via shared event. `command-palette.tsx` listens for `(Cmd|Ctrl)+K` keydown.

### Dark mode

CSS variables defined in `globals.css` with `@theme`. Dark variant via `.dark` class on `<html>`. Preferences section in settings toggles via `localStorage.linky_theme`.

### Density mode

`<html data-density="compact">` or `"comfortable"`. CSS uses `[data-density="compact"]` selectors for tighter spacing.

---

## 13. Testing Infrastructure

**Why not vitest:** Vitest uses rolldown which has a native binding (`@rolldown/binding-win32-x64-msvc.node`). Windows App Control on owner's machine blocks unsigned native binaries → vitest fails to start.

**What we use:**

```javascript
// scripts/run-tests.mjs
// Walks src/ for *.test.ts, runs each via `tsx --test <file>`
```

```typescript
// src/lib/test-shim.ts
// Maps vitest-style API to node:test
export { describe, it } from 'node:test';
export const expect = (actual) => ({
  toBe, toEqual, toBeNull, toBeUndefined, toBeTruthy, toBeFalsy,
  toBeGreaterThan, toBeLessThan, toContain,
  toThrow, // wraps with assert.throws
  not: { toBe, toEqual, ... }
});
```

**Current count:** 119 tests across 13 files. All pass.

**Coverage areas:**
- `utils.test.ts` — URL utils, formatters
- `slug.test.ts` — slug generation + validation + reserved words
- `hash.test.ts` — sha256, hashIp
- `clicks.test.ts` — isBot patterns
- `resolve-link.test.ts` — UA parsing, target picking, A/B variant assignment
- `analytics.test.ts` — aggregation queries
- `safe-browsing.test.ts` — heuristic patterns
- `qr.test.ts` — SVG output validity
- `auth.test.ts` — session validation
- `cache/redis.test.ts` — graceful degraded mode
- `csv.test.ts` — parseCsv (BOM, delimiters, quotes)
- `csv-mapping.test.ts` — autoMap, detectProvider, parseTagsCell

---

## 14. Performance Targets & Bottlenecks

### Targets

| Metric | Target | Current |
|---|---|---|
| Redirect p95 (`/[slug]`) | <100ms | ~30-50ms local |
| Dashboard cold load | <2s | ~1.2s prod build |
| API v1 list | <100ms | ~10-30ms |
| Build time | <60s | ~25-30s |
| Test suite | <30s | ~2s |

### Current bottlenecks

1. **SQLite sync** — fine for single-instance. Migrate ke async Drizzle (Postgres pool) saat scale ke multi-instance behind LB.
2. **In-memory rate limit Map** — per-process, not cluster-aware. Migrate ke Redis untuk horizontal scale.
3. **In-memory webhook delivery promises** — kalau process crash di tengah delivery, log delivery hilang. Roadmap: persistent queue.
4. **Click writes blocking redirect** — saat ini sync. Untuk skala besar, push ke queue (Redis Streams atau CF Queues) async.

### Quick wins jika perlu scale

- Add Redis untuk cache resolved links (KV-style)
- Move clicks insert to async queue
- Edge runtime untuk `/[slug]` (perlu remove better-sqlite3 dep dari hot path → cache or KV)

---

## 15. Deployment Topology

### Path A: Self-host VPS (current production)

```
Domain (linky.agentbuff.id) → DNS A record → Hostinger VPS (148.230.100.170)
  └── Caddy 2.x (autoTLS via Let's Encrypt)
      └── reverse_proxy localhost:1709
          └── docker compose:
              ├── linky-app (Node 22, next start, /app/data/linky.db volume)
              └── (postgres_container — for future migration)
```

**Files:**
- `Dockerfile` — multi-stage build (deps → builder → runner)
- `docker-compose.yml` — linky + Caddy + volumes
- `Caddyfile` — autoTLS + HSTS + security headers
- `.env.production.example` — template untuk env

**Persistent volumes:**
- `linky-db:/app/data` — SQLite database file
- `caddy-data:/data` — TLS certs
- `caddy-config:/config`

### Path B: Vercel (one-click)

Push to GitHub → import in Vercel → set env vars. Limitation: SQLite tidak persist between deployments. Need Postgres swap.

### Path C: Cloudflare Workers + R2 (future)

For sub-50ms global p95 on `/[slug]`. Will require:
- Move redirect logic to Worker (separate `redirect/` app)
- KV cache untuk link lookup
- Origin shield ke Next.js for write paths
- Wrangler config

---

## 16. Migration Strategy (SQLite → Postgres)

### What's ready

- `src/lib/db/schema-pg.ts` — Postgres-flavored Drizzle schema (camelCase column names, jsonb instead of text mode json)
- `scripts/migrate-pg.ts` — Postgres migration runner using `node-postgres`
- VPS has Postgres container running with `linky` DB and `linky_user` role
- Connection string ready (in vault, not in git)

### What's NOT ready

- Every call site uses sync Drizzle API (`.get()`, `.all()`, `.run()`)
- Postgres adapter is async (`.then()`)
- ~150 call sites across `src/` need refactor
- Tests reference SQLite-specific timestamp semantics

### Migration plan

1. **Phase 1:** Add `db` factory that auto-detects `DATABASE_URL` (`file:` → SQLite, `postgres://` → Postgres). Export both `dbSync` (SQLite only) and `db` (async).
2. **Phase 2:** Refactor non-critical routes (folders, tags, settings) to async — verify still works on SQLite via async wrapper.
3. **Phase 3:** Refactor hot path (`/[slug]`, `recordClick`) — measure latency impact.
4. **Phase 4:** Switch `DATABASE_URL` in prod, run pg migrations, copy data.
5. **Phase 5:** Drop SQLite code paths.

**Estimated effort:** 2-3 days dedicated work. Not blocker for current scale.

---

## Appendix A: Common Pitfalls

### "Hydration mismatch" from browser extensions

Some extensions inject attributes like `__processed_xxx="true"`. Fixed by adding `suppressHydrationWarning` to `<body>` in `src/app/layout.tsx`.

### "d.getTime is not a function" runtime error

Drizzle returns timestamps as `Date | number` depending on row source (SELECT vs serialized JSON). Always pass through `toDate()` helper in `src/lib/utils.ts` before calling Date methods.

### Vitest install fails

Don't try to install vitest. App Control will block rolldown. Use `node:test` via tsx (already configured).

### `better-sqlite3` won't load

App Control blocked the .node file. Copy from another working project (see CLAUDE.md "Lingkungan Khusus") or restart Windows.

### Next.js complains about parallel route slot

Don't use `[username]` as top-level route segment — Next.js parses bracket-syntax as a parallel route slot in some contexts. Use a parent path like `/u/[username]`.

### Sessions not invalidated after revoke

Make sure `getSessionUser()` does the DB lookup. JWT-only check would allow revoked tokens until expiry.

---

## Appendix B: Glossary

- **Workspace** — Container for links/tags/folders/pages. 1:1 with user (single-user product).
- **Slug** — short identifier in URL (`/promo` → slug = "promo"). Reserved words enforced by `isValidSlug`.
- **Anonymous link** — created without signup. Limited daily per IP. Stored with `is_anonymous: true`.
- **Cloak** — show short URL in address bar instead of destination (uses iframe via `/c/<slug>`).
- **Linky Page** — link-in-bio page, like Linktree. Path `/u/<username>`.
- **Branded QR** — QR with logo/colors/gradient/frame (not basic monochrome).
- **A/B variants** — multiple destination URLs with weights. Sticky per IP via hash.
- **Deep link** — different URL for iOS/Android based on UA detection.

---

> Last updated: session ending 2026-06-04. See `docs/SESSION-LOG.md` for what changed in that session.
