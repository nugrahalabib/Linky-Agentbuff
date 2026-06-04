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

  // PROD: strict nonce + strict-dynamic (the nonce'd Next bootstrap loads the rest of the graph).
  //       'unsafe-inline' is a legacy fallback that strict-dynamic-aware browsers IGNORE.
  // DEV:  Turbopack HMR, React Refresh and the error overlay inject un-nonced inline scripts and use
  //       eval — strict-dynamic would BLOCK them and break the dev server. So dev gets a permissive
  //       script-src (no strict-dynamic). Dev is local-only and not a security boundary.
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`;

  // 'self' covers the same-origin HMR socket per CSP3, but add ws:/wss: in dev for older targets.
  const connectSrc = isDev ? "'self' ws: wss:" : "'self'";

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
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
