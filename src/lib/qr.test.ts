import { describe, expect, it } from "./test-shim";
import { qrToDataUrl, qrToPngBuffer, qrToSvg } from "./qr";

describe("qr", () => {
  it("generates SVG", async () => {
    const svg = await qrToSvg("https://example.com");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });
  it("generates PNG data URL", async () => {
    const url = await qrToDataUrl("test");
    expect(url.startsWith("data:image/png;base64,")).toBe(true);
  });
  it("generates PNG buffer", async () => {
    const buf = await qrToPngBuffer("hello", { size: 256 });
    expect(buf.length).toBeGreaterThan(100);
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });
  it("respects custom colors in SVG", async () => {
    const svg = await qrToSvg("x", { fg: "#FF0000", bg: "#00FF00" });
    expect(svg.toLowerCase()).toContain("#ff0000");
  });
});
