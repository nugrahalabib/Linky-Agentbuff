import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, ensureWorkspace, findOrCreateOAuthUser } from "@/lib/auth";
import { exchangeCode, fetchProfile, getProvider, redirectUriFor } from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const provider = getProvider(providerId);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get(`oauth_state_${providerId}`)?.value;
  const codeVerifier = jar.get(`oauth_verifier_${providerId}`)?.value;
  // One-time use: clear the temp cookies regardless of outcome.
  jar.delete(`oauth_state_${providerId}`);
  jar.delete(`oauth_verifier_${providerId}`);

  if (oauthError) return NextResponse.redirect(new URL("/signin?error=oauth_denied", appUrl));
  if (!provider || !provider.configured) {
    return NextResponse.redirect(new URL("/signin?error=provider_unavailable", appUrl));
  }
  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/signin?error=oauth_state", appUrl));
  }

  try {
    const redirectUri = redirectUriFor(providerId);
    const { accessToken } = await exchangeCode(provider, code, redirectUri, codeVerifier);
    const profile = await fetchProfile(provider, accessToken);
    if (!profile.email || !profile.subject) {
      return NextResponse.redirect(new URL("/signin?error=no_email", appUrl));
    }
    const user = await findOrCreateOAuthUser(providerId, profile);
    await ensureWorkspace(user.id);
    await createSession(user.id);
    return NextResponse.redirect(new URL("/dashboard", appUrl));
  } catch (e) {
    if (e instanceof Error && e.message === "OAUTH_EMAIL_UNVERIFIED") {
      return NextResponse.redirect(new URL("/signin?error=email_unverified", appUrl));
    }
    return NextResponse.redirect(new URL("/signin?error=oauth_failed", appUrl));
  }
}
