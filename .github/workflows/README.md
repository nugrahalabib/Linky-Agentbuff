# CI/CD Workflows

## `ci.yml`
Runs on every push to `main` and all PRs:
- **quality**: lint + typecheck + unit tests (86+ tests via `node --test`)
- **build**: Next.js production build succeeds
- **security**: `npm audit` + gitleaks

Protected main branch is expected to require all three to pass.
