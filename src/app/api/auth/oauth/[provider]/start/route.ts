import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildAuthorizeUrl,
  getProvider,
  pkceChallenge,
  randomToken,
  redirectUriFor,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const provider = getProvider(providerId);
  if (!provider || !provider.configured) {
    return NextResponse.redirect(new URL("/signin?error=provider_unavailable", appUrl));
  }

  const state = randomToken(16);
  const codeVerifier = randomToken(32);
  const codeChallenge = pkceChallenge(codeVerifier);
  const redirectUri = redirectUriFor(providerId);
  const authorizeUrl = buildAuthorizeUrl(provider, redirectUri, state, codeChallenge);

  const jar = await cookies();
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 min
  };
  jar.set(`oauth_state_${providerId}`, state, opts);
  jar.set(`oauth_verifier_${providerId}`, codeVerifier, opts);

  return NextResponse.redirect(authorizeUrl);
}
