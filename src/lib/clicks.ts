import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";
import { hashIp } from "@/lib/hash";
import { parseUa } from "@/lib/resolve-link";

export interface ClickContext {
  linkId: string;
  ip: string;
  ua: string | null;
  referrer: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|embedly|vkshare|w3c_validator|qwantify/i;

export function isBot(ua: string | null | undefined): boolean {
  if (!ua) return true;
  return BOT_RE.test(ua);
}

export function recordClick(ctx: ClickContext): void {
  try {
    const { device, os, browser } = parseUa(ctx.ua);
    const bot = isBot(ctx.ua);
    db.insert(clicks)
      .values({
        linkId: ctx.linkId,
        country: ctx.country ?? null,
        region: ctx.region ?? null,
        city: ctx.city ?? null,
        device,
        os,
        browser,
        referrer: ctx.referrer ?? null,
        ipHash: hashIp(ctx.ip),
        isBot: bot,
      })
      .run();
    if (!bot) {
      db.update(links)
        .set({ clickCount: sql`${links.clickCount} + 1` })
        .where(eq(links.id, ctx.linkId))
        .run();
    }
  } catch (e) {
    console.error("[clicks] record failed", e);
  }
}
