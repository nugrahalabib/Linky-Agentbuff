import { NextResponse } from "next/server";
import { resolveLinkBySlug, checkLinkStatus, pickTargetUrl } from "@/lib/resolve-link";
import { recordClick, isBot } from "@/lib/clicks";

function getClientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = resolveLinkBySlug(slug);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  if (!link) {
    return NextResponse.redirect(new URL("/not-found", appUrl), 302);
  }

  const status = checkLinkStatus(link);
  if (status.kind === "expired" || status.kind === "click_limit") {
    return NextResponse.redirect(new URL("/expired", appUrl), 302);
  }
  if (status.kind === "password_required") {
    return NextResponse.redirect(new URL(`/p/${encodeURIComponent(slug)}`, appUrl), 302);
  }

  const ua = req.headers.get("user-agent");
  const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country");
  const target = pickTargetUrl(link, ua, country);

  if (!isBot(ua)) {
    recordClick({
      linkId: link.id,
      ip: getClientIp(req),
      ua,
      referrer: req.headers.get("referer"),
      country,
      region: req.headers.get("x-vercel-ip-country-region") ?? null,
      city: req.headers.get("x-vercel-ip-city") ?? null,
    });
  }

  return NextResponse.redirect(target, {
    status: 302,
    headers: {
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer-when-downgrade",
    },
  });
}
