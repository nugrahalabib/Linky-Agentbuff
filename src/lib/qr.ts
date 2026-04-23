import QRCode from "qrcode";
import type { QrConfig } from "./validators";

export interface BrandedQrConfig extends Partial<QrConfig> {
  logoDataUrl?: string;
  logoSizeRatio?: number;
  gradient?: { from: string; to: string; angle?: number };
  frameText?: string;
  shape?: "square" | "rounded" | "dots";
}

export async function qrToSvg(text: string, cfg: Partial<QrConfig> = {}): Promise<string> {
  const { fg = "#18181B", bg = "#FFFFFF", margin = 2 } = cfg;
  return QRCode.toString(text, {
    type: "svg",
    color: { dark: fg, light: bg },
    margin,
    errorCorrectionLevel: "H",
  });
}

export async function qrToDataUrl(text: string, cfg: Partial<QrConfig> = {}): Promise<string> {
  const { fg = "#18181B", bg = "#FFFFFF", margin = 2, size = 512 } = cfg;
  return QRCode.toDataURL(text, {
    color: { dark: fg, light: bg },
    margin,
    width: size,
    errorCorrectionLevel: "H",
  });
}

export async function qrToPngBuffer(text: string, cfg: Partial<QrConfig> = {}): Promise<Buffer> {
  const { fg = "#18181B", bg = "#FFFFFF", margin = 2, size = 512 } = cfg;
  return QRCode.toBuffer(text, {
    color: { dark: fg, light: bg },
    margin,
    width: size,
    errorCorrectionLevel: "H",
  });
}

/**
 * Build a branded QR as SVG — supports gradient fill, rounded modules,
 * center logo (via data URI), and frame with CTA text.
 */
export async function brandedQrSvg(text: string, cfg: BrandedQrConfig = {}): Promise<string> {
  const {
    fg = "#18181B",
    bg = "#FFFFFF",
    margin = 2,
    size = 640,
    gradient,
    logoDataUrl,
    logoSizeRatio = 0.22,
    frameText,
    shape = "square",
  } = cfg;

  // Generate as segments matrix for custom rendering
  const seg = await QRCode.create(text, { errorCorrectionLevel: "H" });
  const modules = seg.modules;
  const moduleCount = modules.size;
  const totalModules = moduleCount + margin * 2;
  const moduleSize = size / totalModules;
  const topPad = frameText ? Math.round(moduleSize * 3.5) : 0;
  const bottomPad = frameText ? Math.round(moduleSize * 5) : 0;
  const w = size;
  const h = size + topPad + bottomPad;

  const gradientId = "lnk-grad";
  const useGradient = Boolean(gradient);
  const fill = useGradient ? `url(#${gradientId})` : fg;

  const rects: string[] = [];
  for (let y = 0; y < moduleCount; y++) {
    for (let x = 0; x < moduleCount; x++) {
      if (!modules.get(x, y)) continue;
      const px = (x + margin) * moduleSize;
      const py = (y + margin) * moduleSize + topPad;
      if (shape === "dots") {
        rects.push(
          `<circle cx="${px + moduleSize / 2}" cy="${py + moduleSize / 2}" r="${moduleSize * 0.45}" fill="${fill}"/>`,
        );
      } else if (shape === "rounded") {
        const r = moduleSize * 0.25;
        rects.push(`<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" rx="${r}" fill="${fill}"/>`);
      } else {
        rects.push(`<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="${fill}"/>`);
      }
    }
  }

  // Optional logo overlay in center (with white safe-zone)
  let logoOverlay = "";
  if (logoDataUrl) {
    const logoW = size * logoSizeRatio;
    const pad = logoW * 0.1;
    const cx = size / 2;
    const cy = size / 2 + topPad;
    const bgSize = logoW + pad * 2;
    logoOverlay = `
      <rect x="${cx - bgSize / 2}" y="${cy - bgSize / 2}" width="${bgSize}" height="${bgSize}" rx="${bgSize * 0.15}" fill="${bg}"/>
      <image href="${logoDataUrl}" x="${cx - logoW / 2}" y="${cy - logoW / 2}" width="${logoW}" height="${logoW}" preserveAspectRatio="xMidYMid meet"/>
    `;
  }

  let frameTop = "";
  let frameBottom = "";
  if (frameText) {
    const safeText = frameText.replace(/[&<>"']/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
    );
    frameTop = `<rect x="0" y="0" width="${w}" height="${topPad}" fill="${fg}"/>
      <text x="${w / 2}" y="${topPad / 2 + 5}" text-anchor="middle" fill="${bg}" font-size="${topPad * 0.4}" font-family="Inter, sans-serif" font-weight="700">Linky</text>`;
    const bTop = size + topPad;
    frameBottom = `<rect x="0" y="${bTop}" width="${w}" height="${bottomPad}" fill="${fg}"/>
      <text x="${w / 2}" y="${bTop + bottomPad / 2 + bottomPad * 0.15}" text-anchor="middle" fill="${bg}" font-size="${bottomPad * 0.32}" font-family="Inter, sans-serif" font-weight="700">${safeText}</text>`;
  }

  const gradAngle = gradient?.angle ?? 135;
  const gradDef = useGradient
    ? `<defs><linearGradient id="${gradientId}" gradientTransform="rotate(${gradAngle})">
        <stop offset="0%" stop-color="${gradient!.from}"/><stop offset="100%" stop-color="${gradient!.to}"/>
      </linearGradient></defs>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${gradDef}
  ${frameTop}
  ${rects.join("")}
  ${logoOverlay}
  ${frameBottom}
</svg>`;
}
