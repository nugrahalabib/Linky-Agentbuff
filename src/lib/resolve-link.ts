import { and, eq, isNull } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import { db } from "@/lib/db";
import { links, type Link } from "@/lib/db/schema";

export type ResolveResult =
  | { kind: "not_found" }
  | { kind: "expired"; link: Link }
  | { kind: "click_limit"; link: Link }
  | { kind: "password_required"; link: Link }
  | { kind: "redirect"; url: string; link: Link };

export function parseUa(ua: string | null | undefined) {
  const parser = new UAParser(ua ?? "");
  const r = parser.getResult();
  return {
    device: r.device.type ?? "desktop",
    os: r.os.name ?? "unknown",
    browser: r.browser.name ?? "unknown",
  };
}

export function pickTargetUrl(link: Link, ua: string | null | undefined, country?: string | null): string {
  const { os } = parseUa(ua);
  if (link.geoRules && country) {
    const rule = link.geoRules.find((r) => r.country.toUpperCase() === country.toUpperCase());
    if (rule?.url) return appendUtm(rule.url, link.utmParams);
  }
  if (os === "iOS" && link.iosUrl) return appendUtm(link.iosUrl, link.utmParams);
  if (os === "Android" && link.androidUrl) return appendUtm(link.androidUrl, link.utmParams);
  return appendUtm(link.destinationUrl, link.utmParams);
}

export function appendUtm(url: string, params?: Record<string, string> | null): string {
  if (!params || Object.keys(params).length === 0) return url;
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) {
      if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    return url;
  }
}

export function resolveLinkBySlug(slug: string): Link | null {
  return (
    db
      .select()
      .from(links)
      .where(and(eq(links.slug, slug), isNull(links.domainId), eq(links.archived, false)))
      .get() ?? null
  );
}

export function checkLinkStatus(link: Link): ResolveResult {
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return { kind: "expired", link };
  }
  if (link.clickLimit != null && link.clickCount >= link.clickLimit) {
    return { kind: "click_limit", link };
  }
  if (link.passwordHash) {
    return { kind: "password_required", link };
  }
  return { kind: "redirect", url: link.destinationUrl, link };
}
