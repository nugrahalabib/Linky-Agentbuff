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

    // Internal/private IPs blocked
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host)
    ) {
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

function getCached(urlHash: string): CheckResult | null {
  try {
    const row = db
      .select()
      .from(safeBrowsingCache)
      .where(and(eq(safeBrowsingCache.urlHash, urlHash), gt(safeBrowsingCache.expiresAt, new Date())))
      .get();
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

function setCached(urlHash: string, result: CheckResult): void {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    // upsert
    db.delete(safeBrowsingCache).where(eq(safeBrowsingCache.urlHash, urlHash)).run();
    db.insert(safeBrowsingCache)
      .values({
        urlHash,
        verdict: result.verdict,
        threatTypes: result.threatTypes.length > 0 ? result.threatTypes.join(",") : null,
        expiresAt,
      })
      .run();
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
  const cached = getCached(urlHash);
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
  setCached(urlHash, result);
  return result;
}
