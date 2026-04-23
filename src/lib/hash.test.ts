import { describe, expect, it, beforeEach } from "./test-shim";
import { hashIp, sha256 } from "./hash";

describe("hash", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-for-hashing-stability-1234";
  });

  describe("hashIp", () => {
    it("produces 24-char hex", () => {
      const h = hashIp("1.2.3.4");
      expect(h).toHaveLength(24);
      expect(h).toMatch(/^[0-9a-f]+$/);
    });
    it("deterministic", () => {
      expect(hashIp("1.2.3.4")).toBe(hashIp("1.2.3.4"));
    });
    it("different IPs differ", () => {
      expect(hashIp("1.2.3.4")).not.toBe(hashIp("1.2.3.5"));
    });
    it("salt changes output", () => {
      const a = hashIp("1.2.3.4");
      process.env.AUTH_SECRET = "different-salt-00000000000000000000";
      const b = hashIp("1.2.3.4");
      expect(a).not.toBe(b);
    });
  });

  describe("sha256", () => {
    it("produces 64-char hex", () => {
      const h = sha256("hello");
      expect(h).toHaveLength(64);
      expect(h).toMatch(/^[0-9a-f]+$/);
    });
    it("known value", () => {
      expect(sha256("hello")).toBe(
        "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
      );
    });
  });
});
