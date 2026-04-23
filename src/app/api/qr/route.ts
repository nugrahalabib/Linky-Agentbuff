import { NextResponse } from "next/server";
import { qrToSvg, qrToPngBuffer } from "@/lib/qr";
import { qrConfigSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const text = url.searchParams.get("text");
  if (!text) return NextResponse.json({ error: "Param `text` wajib." }, { status: 400 });
  const format = url.searchParams.get("format") ?? "svg";

  const cfg = qrConfigSchema.parse({
    fg: url.searchParams.get("fg") ?? undefined,
    bg: url.searchParams.get("bg") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
    margin: url.searchParams.get("margin") ?? undefined,
  });

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
  const svg = await qrToSvg(text, cfg);
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
