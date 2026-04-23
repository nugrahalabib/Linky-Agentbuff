# Linky — Link pendek. Cerita panjang.

> Open-source, free-forever URL shortener. MIT licensed. All features unlocked.

Linky adalah alternatif Bit.ly yang 100% gratis dan terbuka. Custom slug, QR code branded, analitik lengkap, password, kedaluwarsa, deep link — semua tersedia tanpa paywall.

## Fitur (MVP v0.1)

- ✅ **Shorten instan** — tempel URL, dapat link pendek, tanpa signup (limit 5/IP/hari untuk anonim)
- ✅ **Custom slug** — `linky.agentbuff.id/kampanye-ramadan`
- ✅ **QR code studio** — warna bebas, unduh PNG/SVG
- ✅ **Analitik** — total klik, pengunjung unik, geo, device, browser, referrer, chart per-hari
- ✅ **Password protection** — bcrypt-hashed gate page
- ✅ **Kedaluwarsa** — tanggal/waktu atau batas klik
- ✅ **Deep link** — URL berbeda untuk iOS/Android
- ✅ **UTM builder** — tambahkan source/medium/campaign/term/content otomatis
- ✅ **Auth** — email + password, session cookie httpOnly
- ✅ **Dashboard responsif** — sidebar desktop + bottom tab bar mobile
- ✅ **Dark mode** — otomatis ikut sistem (`prefers-color-scheme`)
- ✅ **Aksesibilitas** — WCAG focus ring, `prefers-reduced-motion`, semantic HTML
- ✅ **Bahasa Indonesia** + English (i18n ready di `lib/i18n.ts`)

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
| `npm run db:migrate` | Jalankan migrasi DB manual |
| `npm run db:studio` | Drizzle Studio UI |

## Environment variables

Lihat `.env.example`. Yang penting:

- `AUTH_SECRET` — wajib di production, minimal 24 karakter random
- `DATABASE_URL` — default `file:./linky.db` (SQLite lokal)
- `NEXT_PUBLIC_APP_URL` — base URL aplikasi untuk short link (default `http://localhost:1709`)
- `ANON_DAILY_LIMIT` — quota link anonim per IP per hari (default `5`)

## Deployment

### Vercel

1. Push repo ke GitHub
2. Import di Vercel
3. Set env: `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`
4. Untuk produksi, swap `DATABASE_URL` ke Postgres (Supabase/Neon) — pola schema sama.

### Self-host (VPS)

```bash
git clone <repo>
cd linky
npm install
npm run build
NODE_ENV=production npm start
```

Gunakan Caddy/Nginx untuk TLS + reverse proxy ke `:1709`.

## Arsitektur

Lihat [CLAUDE.md](./CLAUDE.md) untuk konvensi codebase dan struktur lengkap.

## Roadmap

MVP v0.1 sudah siap pakai. Berikutnya:

- [ ] Folders + tags + search lanjutan
- [ ] Branded QR dengan logo upload
- [ ] Bulk CSV import/export
- [ ] REST API + API keys
- [ ] Webhooks
- [ ] A/B testing (Linky Split)
- [ ] Geo targeting rules UI
- [ ] Real-time analytics (SSE)
- [ ] Linky Page (link-in-bio)
- [ ] ClickHouse migration untuk analytics skala besar
- [ ] Cloudflare Workers redirect layer

## Lisensi

MIT © 2026 Nugraha Labib Mujaddid. Lihat [LICENSE](./LICENSE).

---

Dibuat dengan ❤️ untuk semua orang — creator, marketer, pelajar, UMKM, developer. Semoga bermanfaat!
