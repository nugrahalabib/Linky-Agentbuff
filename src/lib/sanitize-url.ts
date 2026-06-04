/**
 * Isomorphic URL / CSS sanitizers. Used on BOTH sides of the Linky Page trust boundary:
 *  - write side (API routes) normalizes data at rest, and
 *  - read side (public renderer) is the authoritative guard against stored XSS.
 * Pure functions only (no node/browser APIs) so they bundle safely in client components.
 */

/** Allow only protocols that cannot execute script. Rejects javascript:/data:/vbscript:/etc. */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const t = String(url).trim();
  return /^(https?:|mailto:|tel:)/i.test(t) ? t : undefined;
}

/** Image sources: http(s) or data:image only (data:text/html etc. blocked). */
export function safeImageSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const t = String(url).trim();
  return /^(https?:\/\/|data:image\/)/i.test(t) ? t : undefined;
}

export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v.trim());
}

// Backgrounds legitimately hold gradients (linear-gradient(...)), so we can't restrict to hex — but
// we must block anything that can fetch/execute or escape the single inline property.
const CSS_BG_BLOCKLIST = /url\(|expression|javascript|@import|[<>{};]|\/\*/i;
export function safeCssBackground(v: string | null | undefined): string | undefined {
  if (!v) return undefined;
  const t = String(v).trim();
  if (!t || t.length > 500 || CSS_BG_BLOCKLIST.test(t)) return undefined;
  return t;
}

export const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Normalize Linky Page blocks at rest: drop unsafe hrefs/srcs, invalid YouTube ids, etc. The shape
 * is loose (data: Record<string, unknown>), so we copy defensively and only touch known fields.
 */
export function sanitizeLinkyPageBlocks(
  blocks: Array<{ id: string; kind: string; data: Record<string, unknown> }>,
): Array<{ id: string; kind: string; data: Record<string, unknown> }> {
  return blocks.map((b) => {
    const data: Record<string, unknown> = { ...b.data };
    if (b.kind === "link") {
      data.url = safeHref(data.url as string | undefined) ?? "";
    } else if (b.kind === "social") {
      if (Array.isArray(data.items)) {
        data.items = (data.items as Array<Record<string, unknown>>).map((it) => ({
          ...it,
          url: safeHref(it.url as string | undefined),
        }));
      }
    } else if (b.kind === "youtube") {
      const v = data.videoId;
      data.videoId = typeof v === "string" && YT_ID.test(v) ? v : "";
    } else if (b.kind === "image") {
      data.url = safeImageSrc(data.url as string | undefined) ?? "";
    }
    return { ...b, data };
  });
}
