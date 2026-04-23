import { NextResponse } from "next/server";
import { qrToSvg, qrToPngBuffer, brandedQrSvg } from "@/lib/qr";
import { qrConfigSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get("text");
  if (!text) return NextResponse.json({ error: "Param `text` wajib." }, { status: 400 });
  const format = url.searchParams.get("format") ?? "svg";
  const shape = (url.searchParams.get("shape") ?? "square") as "square" | "rounded" | "dots";
  const gradFrom = url.searchParams.get("gradFrom");
  const gradTo = url.searchParams.get("gradTo");
  const frameText = url.searchParams.get("frameText") ?? undefined;
  const logoDataUrl = url.searchParams.get("logo") ?? undefined;

  const cfg = qrConfigSchema.parse({
    fg: url.searchParams.get("fg") ?? undefined,
    bg: url.searchParams.get("bg") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
    margin: url.searchParams.get("margin") ?? undefined,
  });

  const wantsBranded = Boolean(gradFrom || gradTo || frameText || logoDataUrl || shape !== "square");

  if (format === "png") {
    const buf = await qrToPngBuffer(text, cfg);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
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
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
