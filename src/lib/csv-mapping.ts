export type FieldKey =
  | "destination_url"
  | "slug"
  | "title"
  | "description"
  | "tags"
  | "password"
  | "expires_at"
  | "click_limit"
  | "ios_url"
  | "android_url"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content";

export const FIELD_LABELS: Record<FieldKey, string> = {
  destination_url: "URL tujuan (wajib)",
  slug: "Slug",
  title: "Judul",
  description: "Deskripsi",
  tags: "Tags (comma/pipe)",
  password: "Password",
  expires_at: "Tanggal kadaluwarsa",
  click_limit: "Batas klik",
  ios_url: "iOS deep link",
  android_url: "Android deep link",
  utm_source: "UTM source",
  utm_medium: "UTM medium",
  utm_campaign: "UTM campaign",
  utm_term: "UTM term",
  utm_content: "UTM content",
};

const ALIASES: Record<FieldKey, string[]> = {
  destination_url: [
    "destination_url",
    "destinationurl",
    "long_url",
    "longurl",
    "original_url",
    "originalurl",
    "target_url",
    "targeturl",
    "url",
    "destination",
    "target",
  ],
  slug: ["slug", "key", "slashtag", "path", "alias", "short_path", "shortpath", "custom_bitlink", "back_half", "backhalf"],
  title: ["title", "name", "label"],
  description: ["description", "notes", "note", "comment", "comments"],
  tags: ["tags", "tag", "labels"],
  password: ["password", "pwd"],
  expires_at: ["expires_at", "expiresat", "expiration", "expires", "expiry", "expire_date", "expiredate"],
  click_limit: ["click_limit", "clicklimit", "max_clicks", "maxclicks", "limit"],
  ios_url: ["ios_url", "iosurl", "ios", "deeplink_ios", "apple_url", "deeplinks_ios_app_uri", "ios_deeplink"],
  android_url: [
    "android_url",
    "androidurl",
    "android",
    "deeplink_android",
    "google_url",
    "deeplinks_android_app_uri",
    "android_deeplink",
  ],
  utm_source: ["utm_source", "utmsource", "source"],
  utm_medium: ["utm_medium", "utmmedium", "medium"],
  utm_campaign: ["utm_campaign", "utmcampaign", "campaign"],
  utm_term: ["utm_term", "utmterm", "term"],
  utm_content: ["utm_content", "utmcontent", "content"],
};

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/[\s\-]+/g, "_");
}

export function autoMap(headers: string[]): Record<FieldKey, number | null> {
  const out: Record<FieldKey, number | null> = {} as Record<FieldKey, number | null>;
  const normalized = headers.map(norm);
  for (const key of Object.keys(ALIASES) as FieldKey[]) {
    let found: number | null = null;
    for (const alias of ALIASES[key]) {
      const i = normalized.indexOf(norm(alias));
      if (i >= 0) {
        found = i;
        break;
      }
    }
    out[key] = found;
  }
  return out;
}

export type Provider =
  | "bitly"
  | "rebrandly"
  | "tinyurl"
  | "dubco"
  | "shortio"
  | "linky"
  | "unknown";

export function detectProvider(headers: string[]): Provider {
  const set = new Set(headers.map(norm));
  if (set.has("long_url") && set.has("link") && set.has("title")) return "bitly";
  if (set.has("slashtag") || (set.has("destination") && set.has("created"))) return "rebrandly";
  if (set.has("originalurl") && set.has("path")) return "shortio";
  if (set.has("key") && (set.has("url") || set.has("destination_url"))) return "dubco";
  if (set.has("originalurl") || (set.has("shorturl") && set.has("originalurl"))) return "tinyurl";
  if (set.has("destination_url") || set.has("slug")) return "linky";
  return "unknown";
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  bitly: "Bit.ly",
  rebrandly: "Rebrandly",
  tinyurl: "TinyURL",
  dubco: "Dub.co",
  shortio: "Short.io",
  linky: "Linky (template)",
  unknown: "Custom / tidak dikenali",
};

export function parseTagsCell(cell: string | undefined | null): string[] {
  if (!cell) return [];
  return cell
    .split(/[,|]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 50);
}
