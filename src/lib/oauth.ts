/**
 * OAuth 2.0 / OIDC login — manual implementation (no extra dependency, consistent with the
 * project's lightweight custom-auth philosophy). Authorization-code flow + PKCE + state.
 *
 * Providers are a pluggable registry: Google is built in. A generic OIDC provider is the
 * "colokan" for future SSO — it activates automatically when the SSO_OIDC_* env vars are set,
 * so connecting an enterprise IdP (Keycloak, Auth0, Azure AD, Okta, …) needs zero code changes.
 *
 * To add another first-class provider (e.g. GitHub/Microsoft), add a builder function and a
 * branch in getProvider()/listConfiguredProviders().
 */
import { createHash, randomBytes } from "node:crypto";

export interface OAuthProfile {
  subject: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
}

export interface OAuthProvider {
  id: string;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  configured: boolean;
  mapProfile: (raw: Record<string, unknown>) => OAuthProfile;
}

function googleProvider(): OAuthProvider {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return {
    id: "google",
    label: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
    mapProfile: (raw) => ({
      subject: String(raw.sub ?? ""),
      email: String(raw.email ?? "").toLowerCase(),
      name: (raw.name as string) ?? null,
      image: (raw.picture as string) ?? null,
      emailVerified: raw.email_verified === true || raw.email_verified === "true",
    }),
  };
}

/**
 * Generic OIDC provider — the SSO extension point. Disabled unless the env vars are present.
 * Set SSO_OIDC_AUTHORIZE_URL, SSO_OIDC_TOKEN_URL, SSO_OIDC_USERINFO_URL, SSO_OIDC_CLIENT_ID,
 * SSO_OIDC_CLIENT_SECRET (and optionally SSO_OIDC_LABEL / SSO_OIDC_SCOPE) to enable.
 */
function ssoOidcProvider(): OAuthProvider | null {
  const authorizeUrl = process.env.SSO_OIDC_AUTHORIZE_URL;
  const tokenUrl = process.env.SSO_OIDC_TOKEN_URL;
  const userinfoUrl = process.env.SSO_OIDC_USERINFO_URL;
  if (!authorizeUrl || !tokenUrl || !userinfoUrl) return null;
  const clientId = process.env.SSO_OIDC_CLIENT_ID;
  const clientSecret = process.env.SSO_OIDC_CLIENT_SECRET;
  return {
    id: "sso",
    label: process.env.SSO_OIDC_LABEL ?? "SSO",
    authorizeUrl,
    tokenUrl,
    userinfoUrl,
    scope: process.env.SSO_OIDC_SCOPE ?? "openid email profile",
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
    mapProfile: (raw) => ({
      subject: String(raw.sub ?? raw.id ?? ""),
      email: String(raw.email ?? "").toLowerCase(),
      name: (raw.name as string) ?? (raw.preferred_username as string) ?? null,
      image: (raw.picture as string) ?? null,
      emailVerified: raw.email_verified !== false,
    }),
  };
}

export function getProvider(id: string): OAuthProvider | null {
  if (id === "google") return googleProvider();
  const sso = ssoOidcProvider();
  if (sso && id === sso.id) return sso;
  return null;
}

/** Providers that are fully configured (have client id + secret) — used to render login buttons. */
export function listConfiguredProviders(): Array<{ id: string; label: string }> {
  const out: Array<{ id: string; label: string }> = [];
  const g = googleProvider();
  if (g.configured) out.push({ id: g.id, label: g.label });
  const sso = ssoOidcProvider();
  if (sso?.configured) out.push({ id: sso.id, label: sso.label });
  return out;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function redirectUriFor(providerId: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709").replace(/\/$/, "");
  return `${base}/api/auth/oauth/${providerId}/callback`;
}

export function buildAuthorizeUrl(
  p: OAuthProvider,
  redirectUri: string,
  state: string,
  codeChallenge: string,
): string {
  const u = new URL(p.authorizeUrl);
  u.searchParams.set("client_id", p.clientId ?? "");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", p.scope);
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("access_type", "online");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export async function exchangeCode(
  p: OAuthProvider,
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{ accessToken: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: p.clientId ?? "",
    client_secret: p.clientSecret ?? "",
    code_verifier: codeVerifier,
  });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(p.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`token exchange failed: ${res.status}`);
    const data = (await res.json()) as { access_token?: string };
    if (!data.access_token) throw new Error("missing access_token");
    return { accessToken: data.access_token };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchProfile(p: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(p.userinfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
    const raw = (await res.json()) as Record<string, unknown>;
    return p.mapProfile(raw);
  } finally {
    clearTimeout(t);
  }
}
