import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, links } from "@/lib/db/schema";
import { hashIp } from "@/lib/hash";
import { parseUa } from "@/lib/resolve-link";
import { fireWebhooks } from "@/lib/webhooks";

export interface ClickContext {
  linkId: string;
  ip: string;
  ua: string | null;
  referrer: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  abVariant?: string | null;
  workspaceId?: string | null;
  slug?: string | null;
  destinationUrl?: string | null;
}

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|discordbot|embedly|vkshare|w3c_validator|qwantify/i;

export function isBot(ua: string | null | undefined): boolean {
  if (!ua) return true;
  return BOT_RE.test(ua);
}

export async function recordClick(ctx: ClickContext): Promise<void> {
  try {
    const { device, os, browser } = parseUa(ctx.ua);
    const bot = isBot(ctx.ua);
    await db.insert(clicks)
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
        abVariant: ctx.abVariant ?? null,
      });
    if (!bot) {
      await db.update(links)
        .set({ clickCount: sql`${links.clickCount} + 1` })
        .where(eq(links.id, ctx.linkId));

      let workspaceId = ctx.workspaceId ?? null;
      let slug = ctx.slug ?? null;
      let destinationUrl = ctx.destinationUrl ?? null;
      if (!workspaceId) {
        const link = (await db
          .select({
            workspaceId: links.workspaceId,
            slug: links.slug,
            destinationUrl: links.destinationUrl,
          })
          .from(links)
          .where(eq(links.id, ctx.linkId)))[0];
        workspaceId = link?.workspaceId ?? null;
        slug = slug ?? link?.slug ?? null;
        destinationUrl = destinationUrl ?? link?.destinationUrl ?? null;
      }
      if (workspaceId) {
        fireWebhooks(workspaceId, "link.clicked", {
          link_id: ctx.linkId,
          slug,
          destination_url: destinationUrl,
          country: ctx.country ?? null,
          region: ctx.region ?? null,
          city: ctx.city ?? null,
          device,
          os,
          browser,
          referrer: ctx.referrer ?? null,
          ab_variant: ctx.abVariant ?? null,
          ts: new Date().toISOString(),
        });
      }
    }
  } catch (e) {
    console.error("[clicks] record failed", e);
  }
}
