import { describe, expect, it } from "./test-shim";
import { generateSlug, isReservedSlug, isValidSlug } from "./slug";

describe("slug", () => {
  describe("generateSlug", () => {
    it("generates 7 chars", () => {
      const s = generateSlug();
      expect(s).toHaveLength(7);
    });
    it("uses safe alphabet (no confusing chars)", () => {
      for (let i = 0; i < 50; i++) {
        const s = generateSlug();
        expect(s).not.toMatch(/[0-1oli]/);
      }
    });
    it("is unique across calls", () => {
      const seen = new Set<string>();
      for (let i = 0; i < 500; i++) seen.add(generateSlug());
      expect(seen.size).toBeGreaterThan(495);
    });
  });

  describe("isReservedSlug", () => {
    it("recognizes reserved words", () => {
      expect(isReservedSlug("api")).toBe(true);
      expect(isReservedSlug("admin")).toBe(true);
      expect(isReservedSlug("dashboard")).toBe(true);
      expect(isReservedSlug("API")).toBe(true);
    });
    it("allows non-reserved", () => {
      expect(isReservedSlug("promo")).toBe(false);
      expect(isReservedSlug("my-slug")).toBe(false);
    });
  });

  describe("isValidSlug", () => {
    it("accepts 2-50 chars alphanum + - _", () => {
      expect(isValidSlug("ab")).toBe(true);
      expect(isValidSlug("my-slug")).toBe(true);
      expect(isValidSlug("promo_2026")).toBe(true);
    });
    it("rejects short or empty", () => {
      expect(isValidSlug("")).toBe(false);
    });
    it("rejects too long", () => {
      expect(isValidSlug("a".repeat(51))).toBe(false);
    });
    it("rejects reserved", () => {
      expect(isValidSlug("api")).toBe(false);
      expect(isValidSlug("admin")).toBe(false);
    });
    it("rejects special chars", () => {
      expect(isValidSlug("my slug")).toBe(false);
      expect(isValidSlug("my.slug")).toBe(false);
      expect(isValidSlug("my/slug")).toBe(false);
      expect(isValidSlug("my#slug")).toBe(false);
    });
    it("rejects leading/trailing dash/underscore", () => {
      expect(isValidSlug("-bad")).toBe(false);
      expect(isValidSlug("bad-")).toBe(false);
      expect(isValidSlug("_bad")).toBe(false);
    });
  });
});
