# Contributing to Linky

Terima kasih atas kontribusimu! Linky adalah proyek open-source MIT milik Nugraha Labib Mujaddid.

## Getting started

```bash
git clone https://github.com/nugrahalabib/Linky-Agentbuff.git
cd Linky-Agentbuff
npm install        # auto-runs migrations
cp .env.example .env.local
# edit AUTH_SECRET to something random (openssl rand -base64 32)
npm run dev
```

Buka http://localhost:1709.

## Branching & commits

- Branch: `feature/<nama>`, `fix/<nama>`, `docs/<nama>`
- Commits: conventional — `feat(scope):`, `fix:`, `chore:`, `docs:`, `refactor:`
- PR ke `main`, CI hijau wajib

## Scripts

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server port 1709 |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (node --test via tsx) |
| `npm run db:migrate` | Jalankan migrasi DB |

## Code style

- TypeScript strict, `moduleResolution: bundler`
- Server Components by default — `"use client"` only bila butuh state/effect
- Jangan import `@/lib/db` di Client Component
- Route handler: validasi via Zod, error message Bahasa Indonesia
- Path alias: `@/...` untuk `src/...`

## Testing

- Unit tests di `src/lib/**/*.test.ts` pakai Vitest-style shim → `node --test`
- Cover setiap pure function baru di `src/lib/`

## Pull Request checklist

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Added CHANGELOG entry under `## [Unreleased]`
- [ ] Updated CLAUDE.md / README if architecture changed
- [ ] No secrets committed

## License

Contributions licensed under MIT. You agree your contributions can be distributed under the project license.
