import { describe, expect, it } from "./test-shim";
import { appendUtm, checkLinkStatus, parseUa, pickTargetUrl } from "./resolve-link";
import type { Link } from "./db/schema";

function makeLink(overrides: Partial<Link> = {}): Link {
  const base: Link = {
    id: "l1",
    workspaceId: "w1",
    domainId: null,
    slug: "test",
    destinationUrl: "https://example.com",
    title: null,
    description: null,
    faviconUrl: null,
    folderId: null,
    passwordHash: null,
    expiresAt: null,
    clickLimit: null,
    iosUrl: null,
    androidUrl: null,
    utmParams: null,
    geoRules: null,
    clickCount: 0,
    archived: false,
    isAnonymous: false,
    anonOwnerIp: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return { ...base, ...overrides };
}

describe("resolve-link", () => {
  describe("parseUa", () => {
    it("parses iPhone UA", () => {
      const r = parseUa(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      );
      expect(r.os).toMatch(/iOS|Apple/i);
    });
    it("parses Android UA", () => {
      const r = parseUa(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36",
      );
      expect(r.os).toBe("Android");
    });
    it("defaults on empty", () => {
      const r = parseUa(null);
      expect(r.device).toBeDefined();
    });
  });

  describe("appendUtm", () => {
    it("adds params", () => {
      const out = appendUtm("https://x.com/p", { utm_source: "fb", utm_medium: "cpc" });
      const u = new URL(out);
      expect(u.searchParams.get("utm_source")).toBe("fb");
      expect(u.searchParams.get("utm_medium")).toBe("cpc");
    });
    it("no-op when empty", () => {
      expect(appendUtm("https://x.com", null)).toBe("https://x.com");
      expect(appendUtm("https://x.com", {})).toBe("https://x.com");
    });
    it("preserves existing params", () => {
      const out = appendUtm("https://x.com?foo=1", { utm_source: "fb" });
      expect(out).toContain("foo=1");
      expect(out).toContain("utm_source=fb");
    });
    it("does not override existing utm", () => {
      const out = appendUtm("https://x.com?utm_source=manual", { utm_source: "fb" });
      expect(new URL(out).searchParams.get("utm_source")).toBe("manual");
    });
    it("returns input unchanged if invalid URL", () => {
      expect(appendUtm("not-a-url", { utm_source: "fb" })).toBe("not-a-url");
    });
  });

  describe("pickTargetUrl", () => {
    it("uses default URL when no rules", () => {
      const l = makeLink();
      expect(pickTargetUrl(l, null)).toBe("https://example.com");
    });
    it("redirects iOS to iosUrl", () => {
      const l = makeLink({ iosUrl: "https://apps.apple.com/x" });
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
      expect(pickTargetUrl(l, ua)).toBe("https://apps.apple.com/x");
    });
    it("redirects Android to androidUrl", () => {
      const l = makeLink({ androidUrl: "https://play.google.com/x" });
      const ua = "Mozilla/5.0 (Linux; Android 14; Pixel 8)";
      expect(pickTargetUrl(l, ua)).toBe("https://play.google.com/x");
    });
    it("applies geo rules before device rules", () => {
      const l = makeLink({
        geoRules: [{ country: "ID", url: "https://id.example.com" }],
        iosUrl: "https://apps.apple.com/x",
      });
      const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)";
      expect(pickTargetUrl(l, ua, "ID")).toBe("https://id.example.com");
    });
    it("falls through to default when geo does not match", () => {
      const l = makeLink({ geoRules: [{ country: "ID", url: "https://id.example.com" }] });
      expect(pickTargetUrl(l, null, "US")).toBe("https://example.com");
    });
  });

  describe("checkLinkStatus", () => {
    it("redirect when healthy", () => {
      const l = makeLink();
      const r = checkLinkStatus(l);
      expect(r.kind).toBe("redirect");
    });
    it("expired when past date", () => {
      const l = makeLink({ expiresAt: new Date(Date.now() - 1000) });
      expect(checkLinkStatus(l).kind).toBe("expired");
    });
    it("click_limit reached", () => {
      const l = makeLink({ clickCount: 10, clickLimit: 10 });
      expect(checkLinkStatus(l).kind).toBe("click_limit");
    });
    it("password_required when hash set", () => {
      const l = makeLink({ passwordHash: "hash" });
      expect(checkLinkStatus(l).kind).toBe("password_required");
    });
  });
});
