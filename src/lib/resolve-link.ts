import { and, eq, isNull } from "drizzle-orm";
import { UAParser } from "ua-parser-js";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { links, type Link } from "@/lib/db/schema";

export type ResolveResult =
  | { kind: "not_found" }
  | { kind: "expired"; link: Link }
  | { kind: "click_limit"; link: Link }
  | { kind: "password_required"; link: Link }
  | { kind: "redirect"; url: string; link: Link; variant?: string };

export function parseUa(ua: string | null | undefined) {
  const parser = new UAParser(ua ?? "");
  const r = parser.getResult();
  return {
    device: r.device.type ?? "desktop",
    os: r.os.name ?? "unknown",
    browser: r.browser.name ?? "unknown",
  };
}

export function pickAbVariant(
  link: Link,
  ipHashSource: string,
): { url: string; variant: string } | null {
  const variants = link.abVariants;
  if (!variants || variants.length === 0) return null;
  const totalWeight = variants.reduce((sum, v) => sum + (v.weight > 0 ? v.weight : 0), 0);
  if (totalWeight <= 0) return null;

  // Sticky hash — same IP always gets the same variant for this link
  const hash = crypto.createHash("sha256").update(`${link.id}:${ipHashSource}`).digest();
  const bucket = hash.readUInt32BE(0) % totalWeight;

  let acc = 0;
  for (let i = 0; i < variants.length; i++) {
    acc += Math.max(0, variants[i].weight);
    if (bucket < acc) {
      return { url: variants[i].url, variant: variants[i].label || `variant-${i + 1}` };
    }
  }
  return { url: variants[0].url, variant: variants[0].label || "variant-1" };
}

export function pickTargetUrl(
  link: Link,
  ua: string | null | undefined,
  country?: string | null,
  ipHashSource?: string,
): { url: string; variant?: string } {
  const { os } = parseUa(ua);

  if (link.abVariants && link.abVariants.length > 0 && ipHashSource) {
    const ab = pickAbVariant(link, ipHashSource);
    if (ab) return { url: appendUtm(ab.url, link.utmParams), variant: ab.variant };
  }

  if (link.geoRules && country) {
    const rule = link.geoRules.find((r) => r.country.toUpperCase() === country.toUpperCase());
    if (rule?.url) return { url: appendUtm(rule.url, link.utmParams) };
  }
  if (os === "iOS" && link.iosUrl) return { url: appendUtm(link.iosUrl, link.utmParams) };
  if (os === "Android" && link.androidUrl) return { url: appendUtm(link.androidUrl, link.utmParams) };
  return { url: appendUtm(link.destinationUrl, link.utmParams) };
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
