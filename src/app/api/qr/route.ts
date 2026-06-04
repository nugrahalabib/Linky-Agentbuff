import { NextResponse } from "next/server";
import { qrToSvg, qrToPngBuffer, brandedQrSvg } from "@/lib/qr";
import { qrConfigSchema } from "@/lib/validators";
import { rateLimitCheck, rateLimitHeaders } from "@/lib/api-helpers";
import { clientIpFromHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Public, unauthenticated endpoint — cap input sizes and rate-limit per IP.
const MAX_TEXT = 2048;
const MAX_FRAME_TEXT = 80;
const QR_RATE_LIMIT = 60; // per minute per IP

// Served as image/svg+xml in our own origin — lock it down so a crafted SVG can never run script,
// regardless of what makes it through input sanitization (defense in depth for the QR XSS class).
const SVG_HEADERS = {
  "Content-Type": "image/svg+xml",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(req: Request) {
  const ip = clientIpFromHeaders((k) => req.headers.get(k));
  const rl = rateLimitCheck(`qr:${ip}`, QR_RATE_LIMIT, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: rateLimitHeaders(rl, QR_RATE_LIMIT) },
    );
  }

  const url = new URL(req.url);
  const text = url.searchParams.get("text");
  if (!text) return NextResponse.json({ error: "Param `text` wajib." }, { status: 400 });
  if (text.length > MAX_TEXT) {
    return NextResponse.json({ error: `Teks terlalu panjang (maks ${MAX_TEXT}).` }, { status: 400 });
  }
  const format = url.searchParams.get("format") ?? "svg";
  const shapeParam = url.searchParams.get("shape") ?? "square";
  const shape = (["square", "rounded", "dots"].includes(shapeParam) ? shapeParam : "square") as
    | "square"
    | "rounded"
    | "dots";
  const gradFrom = url.searchParams.get("gradFrom");
  const gradTo = url.searchParams.get("gradTo");
  const frameTextRaw = url.searchParams.get("frameText") ?? undefined;
  const frameText = frameTextRaw ? frameTextRaw.slice(0, MAX_FRAME_TEXT) : undefined;
  const logoDataUrl = url.searchParams.get("logo") ?? undefined;

  const parsed = qrConfigSchema.safeParse({
    fg: url.searchParams.get("fg") ?? undefined,
    bg: url.searchParams.get("bg") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
    margin: url.searchParams.get("margin") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter QR tidak valid." }, { status: 400 });
  }
  const cfg = parsed.data;

  const wantsBranded = Boolean(gradFrom || gradTo || frameText || logoDataUrl || shape !== "square");

  if (format === "png") {
    const buf = await qrToPngBuffer(text, cfg);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        ...rateLimitHeaders(rl, QR_RATE_LIMIT),
      },
    });
  }

  const svg = wantsBranded
    ? await brandedQrSvg(text, {
        fg: cfg.fg,
        bg: cfg.bg,
        size: cfg.size,
        margin: cfg.margin,
        shape,
        frameText,
        logoDataUrl,
        gradient:
          gradFrom && gradTo && /^#[0-9a-fA-F]{6}$/.test(gradFrom) && /^#[0-9a-fA-F]{6}$/.test(gradTo)
            ? { from: gradFrom, to: gradTo }
            : undefined,
      })
    : await qrToSvg(text, cfg);

  return new NextResponse(svg, {
    status: 200,
    headers: { ...SVG_HEADERS, ...rateLimitHeaders(rl, QR_RATE_LIMIT) },
  });
}
