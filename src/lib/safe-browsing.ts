/**
 * Google Safe Browsing v4 Lookup API integration with cache.
 * https://developers.google.com/safe-browsing/v4/lookup-api
 *
 * Set GOOGLE_SAFE_BROWSING_API_KEY in env to activate.
 * Without key, all checks return "safe" with verdict "skipped".
 */
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { safeBrowsingCache } from "@/lib/db/schema";
import { sha256 } from "@/lib/hash";

export type Verdict = "safe" | "suspicious" | "malicious";
export interface CheckResult {
  verdict: Verdict;
  threatTypes: string[];
  source: "cache" | "api" | "skipped" | "heuristic";
}

const SAFE_BROWSING_ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CLIENT_ID = "linky-agentbuff";
const CLIENT_VERSION = "1.0";

const SUSPICIOUS_TLDS = new Set(["zip", "mov", "country", "kim", "work", "support", "click"]);
const PHISHING_KEYWORDS = ["wp-admin", "login", "signin", "verify", "secure", "account", "update"];
const HOMOGRAPH_RE = /[ɐ-ʯͰ-ϿЀ-ӿ֐-׿؀-ۿ]/;

function isInternalIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 127) return true; // loopback 127.0.0.0/8
  if (a === 10) return true; // private
  if (a === 169 && b === 254) return true; // link-local + cloud metadata 169.254.0.0/16
  if (a === 192 && b === 168) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  return false;
}

/**
 * True if a hostname points at a loopback/private/link-local/metadata target.
 * Handles IPv6 ([::1], fc00::/7 ULA, fe80::/10 link-local), full 127.0.0.0/8 and 0.0.0.0,
 * and decimal/hex integer IPv4 encodings (e.g. 2130706433, 0x7f000001 = 127.0.0.1).
 * Note: does NOT resolve DNS — a public name resolving to a private IP (DNS rebinding) is not caught.
 */
export function isInternalHost(hostname: string): boolean {
  let host = hostname.toLowerCase().trim();
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1); // strip IPv6 brackets

  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::" || host === "::1" || host === "0.0.0.0") return true;
  if (/^f[cd][0-9a-f]*:/.test(host)) return true; // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]*:/.test(host)) return true; // fe80::/10 link-local

  if (/^\d+$/.test(host)) {
    const n = Number(host);
    if (Number.isFinite(n) && n >= 0 && n <= 0xffffffff) {
      return isInternalIpv4([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."));
    }
  }
  if (/^0x[0-9a-f]+$/.test(host)) {
    const n = parseInt(host, 16);
    if (Number.isFinite(n) && n >= 0 && n <= 0xffffffff) {
      return isInternalIpv4([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join("."));
    }
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return isInternalIpv4(host);

  return false;
}

/**
 * True if a URL is unsafe to fetch server-side: non-http(s) scheme, unparseable, or an internal host.
 * Used to block SSRF via user-supplied webhook URLs.
 */
export function isUnsafeRequestUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    return isInternalHost(u.hostname);
  } catch {
    return true;
  }
}

/**
 * DNS-rebinding-aware SSRF check for server-side requests (e.g. webhook delivery). In addition to
 * the string-based isUnsafeRequestUrl(), this RESOLVES the hostname and rejects if ANY resolved IP
 * is internal — catching the classic attack where a public domain that passed registration later
 * repoints its A/AAAA record at 127.0.0.1 / 169.254.169.254 / a private range.
 *
 * Caveat: a tiny TOCTOU window remains between this lookup and fetch()'s own resolution; fully
 * closing it needs a pinned-IP dispatcher. This raises the bar substantially for the common case.
 * Fails CLOSED (returns true) on resolution error.
 */
export async function isUnsafeRequestUrlResolved(rawUrl: string): Promise<boolean> {
  if (isUnsafeRequestUrl(rawUrl)) return true;
  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    return true;
  }
  // Already-literal IPs were covered by isInternalHost above; only DNS names need resolution.
  try {
    const { lookup } = await import("node:dns/promises");
    const records = await lookup(hostname, { all: true });
    return records.some((r) => isInternalHost(r.address));
  } catch {
    // Resolution failed — be conservative and block (the delivery would fail anyway).
    return true;
  }
}

function heuristicCheck(url: string): { verdict: Verdict; reasons: string[] } {
  const reasons: string[] = [];
  let verdict: Verdict = "safe";
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const tld = host.split(".").pop() ?? "";

    if (SUSPICIOUS_TLDS.has(tld)) {
      reasons.push(`suspicious_tld:${tld}`);
      verdict = "suspicious";
    }

    if (host.startsWith("xn--") || HOMOGRAPH_RE.test(host)) {
      reasons.push("homograph_or_punycode");
      verdict = "suspicious";
    }

    // Internal/private/loopback/link-local/metadata hosts blocked (IPv4/IPv6 + numeric encodings)
    if (isInternalHost(host)) {
      reasons.push("internal_ip");
      verdict = "malicious";
    }

    // Suspicious path patterns + non-https
    const lowerPath = u.pathname.toLowerCase();
    const phishCount = PHISHING_KEYWORDS.filter((k) => lowerPath.includes(k)).length;
    if (phishCount >= 2 && u.protocol !== "https:") {
      reasons.push("phishing_pattern_http");
      verdict = "suspicious";
    }

    // Excessive subdomains
    const dotCount = (host.match(/\./g) ?? []).length;
    if (dotCount > 4) {
      reasons.push("excessive_subdomains");
      verdict = "suspicious";
    }
  } catch {
    return { verdict: "malicious", reasons: ["malformed_url"] };
  }
  return { verdict, reasons };
}

async function getCached(urlHash: string): Promise<CheckResult | null> {
  try {
    const row = (await db
      .select()
      .from(safeBrowsingCache)
      .where(and(eq(safeBrowsingCache.urlHash, urlHash), gt(safeBrowsingCache.expiresAt, new Date()))))[0];
    if (!row) return null;
    return {
      verdict: row.verdict,
      threatTypes: row.threatTypes ? row.threatTypes.split(",") : [],
      source: "cache",
    };
  } catch {
    return null;
  }
}

async function setCached(urlHash: string, result: CheckResult): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    // upsert
    await db.delete(safeBrowsingCache).where(eq(safeBrowsingCache.urlHash, urlHash));
    await db.insert(safeBrowsingCache)
      .values({
        urlHash,
        verdict: result.verdict,
        threatTypes: result.threatTypes.length > 0 ? result.threatTypes.join(",") : null,
        expiresAt,
      });
  } catch {
    /* non-fatal */
  }
}

async function callGoogleApi(url: string, apiKey: string): Promise<CheckResult> {
  try {
    const body = {
      client: { clientId: CLIENT_ID, clientVersion: CLIENT_VERSION },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      console.warn(`[safe-browsing] API ${res.status}`);
      return { verdict: "safe", threatTypes: [], source: "api" };
    }
    const data = (await res.json()) as { matches?: Array<{ threatType: string }> };
    const matches = data.matches ?? [];
    if (matches.length === 0) {
      return { verdict: "safe", threatTypes: [], source: "api" };
    }
    return {
      verdict: "malicious",
      threatTypes: Array.from(new Set(matches.map((m) => m.threatType))),
      source: "api",
    };
  } catch (e) {
    console.warn("[safe-browsing] fetch failed:", (e as Error).message);
    return { verdict: "safe", threatTypes: [], source: "api" };
  }
}

export async function checkUrlSafety(url: string): Promise<CheckResult> {
  // Heuristic check first (free, fast, always runs)
  const heuristic = heuristicCheck(url);
  if (heuristic.verdict === "malicious") {
    return { verdict: "malicious", threatTypes: heuristic.reasons, source: "heuristic" };
  }

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    // No API key — return heuristic verdict only (safe or suspicious)
    return {
      verdict: heuristic.verdict,
      threatTypes: heuristic.reasons,
      source: heuristic.verdict === "safe" ? "skipped" : "heuristic",
    };
  }

  const urlHash = sha256(url);
  const cached = await getCached(urlHash);
  if (cached) return cached;

  const apiResult = await callGoogleApi(url, apiKey);
  // Combine: API verdict wins; if API says safe but heuristic says suspicious, mark suspicious
  const finalVerdict: Verdict =
    apiResult.verdict === "malicious"
      ? "malicious"
      : heuristic.verdict === "suspicious"
        ? "suspicious"
        : "safe";
  const finalThreats =
    finalVerdict === "malicious"
      ? apiResult.threatTypes
      : finalVerdict === "suspicious"
        ? heuristic.reasons
        : [];

  const result: CheckResult = { verdict: finalVerdict, threatTypes: finalThreats, source: "api" };
  await setCached(urlHash, result);
  return result;
}
