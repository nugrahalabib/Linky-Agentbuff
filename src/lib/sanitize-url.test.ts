import { describe, it, expect } from "@/lib/test-shim";
import {
  safeHref,
  safeImageSrc,
  isHexColor,
  safeCssBackground,
  YT_ID,
  sanitizeLinkyPageBlocks,
} from "./sanitize-url";

describe("safeHref", () => {
  it("allows http/https/mailto/tel", () => {
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("http://example.com")).toBe("http://example.com");
    expect(safeHref("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(safeHref("tel:+62123")).toBe("tel:+62123");
  });
  it("blocks script-bearing protocols", () => {
    expect(safeHref("javascript:alert(1)")).toBe(undefined);
    expect(safeHref("  javascript:alert(1)")).toBe(undefined);
    expect(safeHref("data:text/html,<script>")).toBe(undefined);
    expect(safeHref("vbscript:msgbox")).toBe(undefined);
    expect(safeHref("JaVaScRiPt:alert(1)")).toBe(undefined);
  });
  it("handles empty/nullish", () => {
    expect(safeHref(undefined)).toBe(undefined);
    expect(safeHref("")).toBe(undefined);
  });
});

describe("safeImageSrc", () => {
  it("allows http(s) and data:image", () => {
    expect(safeImageSrc("https://x/a.png")).toBe("https://x/a.png");
    expect(safeImageSrc("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });
  it("blocks data:text/html and javascript", () => {
    expect(safeImageSrc("data:text/html,<script>")).toBe(undefined);
    expect(safeImageSrc("javascript:alert(1)")).toBe(undefined);
  });
});

describe("isHexColor", () => {
  it("accepts 3/6/8-digit hex", () => {
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("#4F46E5")).toBe(true);
    expect(isHexColor("#4F46E5FF")).toBe(true);
  });
  it("rejects non-hex / CSS injection", () => {
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#fff; background:url(x)")).toBe(false);
    expect(isHexColor(undefined)).toBe(false);
  });
});

describe("safeCssBackground", () => {
  it("allows colors and gradients", () => {
    expect(safeCssBackground("#FAFAFA")).toBe("#FAFAFA");
    expect(safeCssBackground("linear-gradient(180deg, #4F46E5 0%, #06B6D4 100%)")).toBe(
      "linear-gradient(180deg, #4F46E5 0%, #06B6D4 100%)",
    );
  });
  it("blocks url(), expression, comments, and statement breakers", () => {
    expect(safeCssBackground("url(https://evil/track)")).toBe(undefined);
    expect(safeCssBackground("red; behavior: url(x)")).toBe(undefined);
    expect(safeCssBackground("expression(alert(1))")).toBe(undefined);
    expect(safeCssBackground("#fff /* comment */")).toBe(undefined);
    expect(safeCssBackground("</style><script>")).toBe(undefined);
  });
});

describe("YT_ID", () => {
  it("matches exactly 11 url-safe chars", () => {
    expect(YT_ID.test("dQw4w9WgXcQ")).toBe(true);
    expect(YT_ID.test("../../@evil")).toBe(false);
    expect(YT_ID.test("dQw4w9WgXcQ?autoplay=1")).toBe(false);
    expect(YT_ID.test("short")).toBe(false);
  });
});

describe("sanitizeLinkyPageBlocks", () => {
  it("drops javascript: in link blocks", () => {
    const out = sanitizeLinkyPageBlocks([
      { id: "1", kind: "link", data: { url: "javascript:alert(1)", label: "x" } },
    ]);
    expect(out[0].data.url).toBe("");
  });
  it("keeps safe link urls", () => {
    const out = sanitizeLinkyPageBlocks([{ id: "1", kind: "link", data: { url: "https://ok.com" } }]);
    expect(out[0].data.url).toBe("https://ok.com");
  });
  it("invalidates bad youtube ids", () => {
    const out = sanitizeLinkyPageBlocks([{ id: "1", kind: "youtube", data: { videoId: "../../x" } }]);
    expect(out[0].data.videoId).toBe("");
  });
  it("sanitizes social item urls", () => {
    const out = sanitizeLinkyPageBlocks([
      { id: "1", kind: "social", data: { items: [{ platform: "ig", handle: "@a", url: "javascript:x" }] } },
    ]);
    expect((out[0].data.items as Array<{ url?: string }>)[0].url).toBe(undefined);
  });
});
