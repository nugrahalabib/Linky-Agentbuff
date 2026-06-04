import { NextRequest, NextResponse } from "next/server";

/**
 * Enforced, nonce-based Content-Security-Policy (replaces the old report-only header in next.config).
 *
 * Per the official Next.js pattern: we mint a per-request nonce and put the CSP on the *request*
 * headers — Next then automatically stamps that nonce onto every framework <script> it emits. With
 * `'strict-dynamic'`, those nonce'd scripts may load the rest of the chunk graph, so no host allow-
 * list is needed for JS. `'unsafe-eval'` is dropped in production (only Turbopack dev needs it).
 *
 * `'unsafe-inline'` is kept in script-src purely as a legacy fallback: any browser new enough to
 * honour `'strict-dynamic'` IGNORES it, so it does not weaken the policy there — it only keeps the
 * app from going blank on the off chance nonce propagation regresses. style-src keeps
 * `'unsafe-inline'` because React inline `style={{…}}` attributes cannot carry a nonce.
 */
export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = btoa(crypto.randomUUID());

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    // /c/[slug] cloak frames arbitrary destination sites and /u/ pages embed YouTube — allow https.
    "frame-src 'self' https:",
    "frame-ancestors 'self'",
    "form-action 'self'",
    // Don't force-upgrade in dev (would break http://localhost subresources).
    isDev ? "" : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Setting the CSP on the request is what makes Next inject the nonce into its scripts.
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // All document routes — exclude API (handlers set their own headers) and static assets.
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
