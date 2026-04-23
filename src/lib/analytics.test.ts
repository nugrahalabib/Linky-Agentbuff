import { describe, expect, it } from "./test-shim";
import { fillMissingDays } from "./analytics";

describe("analytics", () => {
  describe("fillMissingDays", () => {
    it("fills 7 days with zeros", () => {
      const r = fillMissingDays([], 7);
      expect(r).toHaveLength(7);
      r.forEach((d) => expect(d.clicks).toBe(0));
    });
    it("keeps values for existing days", () => {
      const today = new Date().toISOString().slice(0, 10);
      const r = fillMissingDays([{ date: today, clicks: 42 }], 3);
      const todayRow = r.find((d) => d.date === today);
      expect(todayRow?.clicks).toBe(42);
    });
    it("produces ordered dates (oldest first)", () => {
      const r = fillMissingDays([], 7);
      for (let i = 1; i < r.length; i++) {
        expect(r[i].date >= r[i - 1].date).toBe(true);
      }
    });
  });
});
