import type { Link } from "@/lib/db/schema";

function ts(v: Date | number | null | undefined): string | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  return d.toISOString();
}

export interface PublicLink {
  id: string;
  slug: string;
  short_url: string;
  destination_url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  folder_id: string | null;
  click_count: number;
  archived: boolean;
  cloak: boolean;
  has_password: boolean;
  expires_at: string | null;
  click_limit: number | null;
  ios_url: string | null;
  android_url: string | null;
  utm_params: Record<string, string> | null;
  og: { title: string | null; description: string | null; image: string | null };
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function publicShortBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
}

export function serializeLink(l: Link): PublicLink {
  const base = publicShortBase().replace(/\/+$/, "");
  return {
    id: l.id,
    slug: l.slug,
    short_url: `${base}/${l.slug}`,
    destination_url: l.destinationUrl,
    title: l.title,
    description: l.description,
    favicon_url: l.faviconUrl,
    folder_id: l.folderId,
    click_count: l.clickCount,
    archived: l.archived,
    cloak: l.cloak,
    has_password: Boolean(l.passwordHash),
    expires_at: ts(l.expiresAt),
    click_limit: l.clickLimit,
    ios_url: l.iosUrl,
    android_url: l.androidUrl,
    utm_params: l.utmParams ?? null,
    og: { title: l.ogTitle, description: l.ogDescription, image: l.ogImage },
    created_by: l.createdBy,
    created_at: ts(l.createdAt),
    updated_at: ts(l.updatedAt),
  };
}
