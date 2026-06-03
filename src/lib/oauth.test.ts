import { describe, expect, it, beforeEach } from "./test-shim";
import {
  buildAuthorizeUrl,
  getProvider,
  listConfiguredProviders,
  pkceChallenge,
  randomToken,
  redirectUriFor,
} from "./oauth";

describe("oauth", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_APP_URL = "https://linky.agentbuff.id";
    delete process.env.SSO_OIDC_AUTHORIZE_URL;
  });

  describe("getProvider", () => {
    it("returns configured google provider", () => {
      const p = getProvider("google");
      expect(p?.id).toBe("google");
      expect(p?.configured).toBe(true);
    });
    it("returns null for unknown provider", () => {
      expect(getProvider("nope")).toBeNull();
    });
    it("google is unconfigured without client id/secret", () => {
      delete process.env.GOOGLE_CLIENT_ID;
      expect(getProvider("google")?.configured).toBe(false);
    });
  });

  describe("listConfiguredProviders", () => {
    it("lists google when configured", () => {
      const list = listConfiguredProviders();
      expect(list.some((p) => p.id === "google")).toBe(true);
    });
    it("includes generic SSO only when its env is set", () => {
      expect(listConfiguredProviders().some((p) => p.id === "sso")).toBe(false);
      process.env.SSO_OIDC_AUTHORIZE_URL = "https://idp.example.com/authorize";
      process.env.SSO_OIDC_TOKEN_URL = "https://idp.example.com/token";
      process.env.SSO_OIDC_USERINFO_URL = "https://idp.example.com/userinfo";
      process.env.SSO_OIDC_CLIENT_ID = "x";
      process.env.SSO_OIDC_CLIENT_SECRET = "y";
      expect(listConfiguredProviders().some((p) => p.id === "sso")).toBe(true);
    });
  });

  describe("google mapProfile", () => {
    it("maps OIDC userinfo to a normalized profile", () => {
      const p = getProvider("google")!;
      const profile = p.mapProfile({
        sub: "12345",
        email: "User@Example.com",
        name: "User Example",
        picture: "https://img/x.png",
        email_verified: true,
      });
      expect(profile.subject).toBe("12345");
      expect(profile.email).toBe("user@example.com"); // lowercased
      expect(profile.name).toBe("User Example");
      expect(profile.image).toBe("https://img/x.png");
      expect(profile.emailVerified).toBe(true);
    });
  });

  describe("pkce + authorize url", () => {
    it("pkceChallenge is deterministic base64url", () => {
      const a = pkceChallenge("verifier-123");
      const b = pkceChallenge("verifier-123");
      expect(a).toBe(b);
      expect(a).not.toContain("+");
      expect(a).not.toContain("/");
      expect(a).not.toContain("=");
    });
    it("randomToken produces distinct values", () => {
      expect(randomToken(16)).not.toBe(randomToken(16));
    });
    it("redirectUriFor uses the app url + provider path", () => {
      expect(redirectUriFor("google")).toBe(
        "https://linky.agentbuff.id/api/auth/oauth/google/callback",
      );
    });
    it("buildAuthorizeUrl includes required oauth params", () => {
      const p = getProvider("google")!;
      const url = buildAuthorizeUrl(p, redirectUriFor("google"), "state123", "challenge123");
      const parsed = new URL(url);
      expect(parsed.searchParams.get("response_type")).toBe("code");
      expect(parsed.searchParams.get("state")).toBe("state123");
      expect(parsed.searchParams.get("code_challenge")).toBe("challenge123");
      expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
      expect(parsed.searchParams.get("scope")).toContain("email");
    });
  });
});
