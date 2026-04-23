import { customAlphabet } from "nanoid";

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export const generateSlug = customAlphabet(ALPHABET, 7);

const RESERVED = new Set<string>([
  "api",
  "admin",
  "app",
  "assets",
  "auth",
  "blog",
  "dashboard",
  "dev",
  "docs",
  "help",
  "images",
  "img",
  "legal",
  "login",
  "logout",
  "mail",
  "new",
  "p",
  "preview",
  "public",
  "pricing",
  "privacy",
  "report",
  "root",
  "settings",
  "signup",
  "signin",
  "static",
  "status",
  "support",
  "terms",
  "tos",
  "www",
  "_next",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug.toLowerCase());
}

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,48}[a-zA-Z0-9]$|^[a-zA-Z0-9]{1,2}$/;

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length > 50) return false;
  if (!SLUG_RE.test(slug)) return false;
  if (isReservedSlug(slug)) return false;
  return true;
}
