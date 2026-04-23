# Security Policy

## Reporting a vulnerability

If you find a security issue, please email **agentbuff.id@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Impact assessment (what can an attacker do?)
- (Optional) Suggested fix

We aim to acknowledge reports within **72 hours** and patch critical issues within **7 days**.

**Please do NOT open a public GitHub issue** for security vulnerabilities.

## Scope

In scope:
- Production instance at https://linky.agentbuff.id
- Source code in this repository
- REST API endpoints at `/api/**`

Out of scope:
- Social engineering
- Physical attacks
- DDoS testing (please contact us first)
- Issues in third-party services we use (report to them directly)

## Hardening in place

- All passwords hashed with bcrypt (cost 10)
- Sessions stored server-side + signed JWT (HS256) in httpOnly cookies
- Destination URLs validated (http/https only, no javascript:/file:/etc.)
- SQL via Drizzle parametrized queries — no string concatenation
- Security headers via Next.js config + Caddy (HSTS, X-Frame, CSP-adjacent)
- Rate limiting on anonymous flows (configurable per IP)
- Bot filtering on click counts
- IP addresses hashed with salt before storage
- API keys stored as SHA-256 hash — plaintext shown ONCE on creation
- Webhooks signed with HMAC-SHA256, secret per-endpoint
- Gitleaks scan in CI
- `npm audit` gating on high/critical

## Responsible disclosure

We appreciate reports made in good faith. We commit to:
- Not pursue legal action against researchers acting in good faith
- Credit you (if desired) in the release notes
- Keep you informed during triage and fix

## Contact

- Email: **agentbuff.id@gmail.com**
- Subject line: `[SECURITY] <brief summary>`
- GPG key: on request
