import { describe, expect, it, beforeAll } from "./test-shim";
import { hashPassword, verifyPassword } from "./auth";

describe("auth", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret-minimum-24-chars-placeholder-xxx";
    process.env.DATABASE_URL = "file:./test-auth.db";
  });

  describe("hashPassword / verifyPassword", () => {
    it("hashes then verifies", async () => {
      const hash = await hashPassword("super-secret");
      expect(hash).not.toBe("super-secret");
      expect(await verifyPassword("super-secret", hash)).toBe(true);
    });
    it("rejects wrong password", async () => {
      const hash = await hashPassword("correct");
      expect(await verifyPassword("wrong", hash)).toBe(false);
    });
    it("produces different hash for same input (salt)", async () => {
      const a = await hashPassword("x");
      const b = await hashPassword("x");
      expect(a).not.toBe(b);
    });
  });
});
