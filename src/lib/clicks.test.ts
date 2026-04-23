import { describe, expect, it } from "./test-shim";
import { isBot } from "./clicks";

describe("clicks", () => {
  describe("isBot", () => {
    it("detects googlebot", () => {
      expect(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    });
    it("detects crawler keywords", () => {
      expect(isBot("Mozilla/5.0 crawler/1.0")).toBe(true);
      expect(isBot("Mozilla/5.0 spider")).toBe(true);
    });
    it("detects social media preview bots", () => {
      expect(isBot("facebookexternalhit/1.1")).toBe(true);
      expect(isBot("WhatsApp/2.0")).toBe(true);
      expect(isBot("TelegramBot (like TwitterBot)")).toBe(true);
    });
    it("does NOT flag real browsers", () => {
      expect(
        isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
      ).toBe(false);
      expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(false);
    });
    it("flags empty/null as bot (safety default)", () => {
      expect(isBot(null)).toBe(true);
      expect(isBot(undefined)).toBe(true);
      expect(isBot("")).toBe(true);
    });
  });
});
