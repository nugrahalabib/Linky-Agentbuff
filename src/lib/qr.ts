import QRCode from "qrcode";
import type { QrConfig } from "./validators";

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
