import { NextResponse } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import { brandedQrSvg } from "@/lib/qr";

const schema = z.object({
  text: z.string().min(1).max(2000),
  fg: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#18181B"),
  bg: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#FFFFFF"),
  size: z.number().int().min(256).max(2048).default(640),
  shape: z.enum(["square", "rounded", "dots"]).default("square"),
  gradFrom: z.string().optional().or(z.literal("")),
  gradTo: z.string().optional().or(z.literal("")),
  frameText: z.string().max(80).optional().or(z.literal("")),
  logoDataUrl: z.string().max(800_000).optional().or(z.literal("")),
  format: z.enum(["svg", "png"]).default("svg"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { text, fg, bg, size, shape, gradFrom, gradTo, frameText, logoDataUrl, format } = parsed.data;
  const gradient =
    gradFrom && gradTo && /^#[0-9a-fA-F]{6}$/.test(gradFrom) && /^#[0-9a-fA-F]{6}$/.test(gradTo)
      ? { from: gradFrom, to: gradTo }
      : undefined;

  const svg = await brandedQrSvg(text, {
    fg,
    bg,
    size,
    shape,
    gradient,
    frameText: frameText || undefined,
    logoDataUrl: logoDataUrl || undefined,
  });

  if (format === "png") {
    try {
      const png = await sharp(Buffer.from(svg)).png().toBuffer();
      return new NextResponse(new Uint8Array(png), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    } catch {
      // Fallback: return SVG if sharp fails or unavailable
      return new NextResponse(svg, { status: 200, headers: { "Content-Type": "image/svg+xml" } });
    }
  }
  return new NextResponse(svg, { status: 200, headers: { "Content-Type": "image/svg+xml" } });
}
