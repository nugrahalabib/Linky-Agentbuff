import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function formatDate(ts: number | Date, locale = "id-ID"): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function relativeTime(ts: number | Date, locale = "id"): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  const diff = (Date.now() - d.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diff < 60) return rtf.format(-Math.floor(diff), "second");
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), "hour");
  if (diff < 2_592_000) return rtf.format(-Math.floor(diff / 86400), "day");
  if (diff < 31_536_000) return rtf.format(-Math.floor(diff / 2_592_000), "month");
  return rtf.format(-Math.floor(diff / 31_536_000), "year");
}

export function isValidUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeUrl(input: string): string {
  let v = input.trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function getFaviconUrl(destination: string): string {
  const host = hostOf(destination);
  if (!host) return "";
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
}

export function truncate(s: string, max = 60): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function safeJson<T>(input: string | null | undefined, fallback: T): T {
  if (!input) return fallback;
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}
