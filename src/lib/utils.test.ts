import { describe, expect, it } from "./test-shim";
import {
  cn,
  formatNumber,
  getFaviconUrl,
  hostOf,
  isValidUrl,
  normalizeUrl,
  safeJson,
  truncate,
} from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("merges classes", () => {
      expect(cn("a", "b")).toBe("a b");
    });
    it("dedupes tailwind conflicts", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
    });
    it("handles falsy", () => {
      expect(cn("a", false, null, "b")).toBe("a b");
    });
  });

  describe("formatNumber", () => {
    it("under 1000", () => expect(formatNumber(42)).toBe("42"));
    it("thousands", () => {
      expect(formatNumber(1500)).toBe("1.5K");
      expect(formatNumber(12000)).toBe("12K");
    });
    it("millions", () => expect(formatNumber(2500000)).toBe("2.5M"));
  });

  describe("isValidUrl", () => {
    it("valid http/https", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://example.com")).toBe(true);
    });
    it("invalid", () => {
      expect(isValidUrl("ftp://x.com")).toBe(false);
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("")).toBe(false);
      expect(isValidUrl("javascript:alert(1)")).toBe(false);
    });
  });

  describe("normalizeUrl", () => {
    it("adds https if missing", () => {
      expect(normalizeUrl("example.com")).toBe("https://example.com");
    });
    it("preserves http", () => {
      expect(normalizeUrl("http://example.com")).toBe("http://example.com");
    });
    it("trims whitespace", () => {
      expect(normalizeUrl("  example.com  ")).toBe("https://example.com");
    });
  });

  describe("hostOf", () => {
    it("extracts host", () => expect(hostOf("https://www.example.com/path")).toBe("www.example.com"));
    it("empty on invalid", () => expect(hostOf("not a url")).toBe(""));
  });

  describe("getFaviconUrl", () => {
    it("returns google s2 favicon", () => {
      expect(getFaviconUrl("https://example.com/a")).toContain("google.com/s2/favicons");
      expect(getFaviconUrl("https://example.com/a")).toContain("example.com");
    });
    it("empty on invalid", () => expect(getFaviconUrl("bad")).toBe(""));
  });

  describe("truncate", () => {
    it("shorter than max", () => expect(truncate("hello", 10)).toBe("hello"));
    it("longer than max", () => expect(truncate("hello world", 8)).toBe("hello w…"));
  });

  describe("safeJson", () => {
    it("parses valid JSON", () => expect(safeJson('{"a":1}', {})).toEqual({ a: 1 }));
    it("returns fallback on invalid", () => expect(safeJson("not json", { ok: true })).toEqual({ ok: true }));
    it("returns fallback on null/undefined", () => {
      expect(safeJson(null, 42)).toBe(42);
      expect(safeJson(undefined, "x")).toBe("x");
    });
  });
});
