import { describe, expect, it } from "./test-shim";
import {
  createLinkSchema,
  loginSchema,
  qrConfigSchema,
  shortenAnonSchema,
  signupSchema,
} from "./validators";

describe("validators", () => {
  describe("signupSchema", () => {
    it("accepts valid", () => {
      const r = signupSchema.safeParse({ email: "a@b.com", password: "password123" });
      expect(r.success).toBe(true);
    });
    it("rejects short password", () => {
      const r = signupSchema.safeParse({ email: "a@b.com", password: "short" });
      expect(r.success).toBe(false);
    });
    it("rejects invalid email", () => {
      const r = signupSchema.safeParse({ email: "notanemail", password: "password123" });
      expect(r.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("accepts valid", () => {
      expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    });
    it("rejects empty password", () => {
      expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
    });
  });

  describe("shortenAnonSchema", () => {
    it("accepts URL only", () => {
      expect(shortenAnonSchema.safeParse({ destinationUrl: "https://x.com" }).success).toBe(true);
    });
    it("accepts with slug", () => {
      expect(
        shortenAnonSchema.safeParse({ destinationUrl: "https://x.com", customSlug: "my-slug" })
          .success,
      ).toBe(true);
    });
  });

  describe("createLinkSchema", () => {
    it("accepts minimal", () => {
      expect(createLinkSchema.safeParse({ destinationUrl: "https://x.com" }).success).toBe(true);
    });
    it("accepts full", () => {
      const r = createLinkSchema.safeParse({
        destinationUrl: "https://x.com",
        customSlug: "my-slug",
        title: "Title",
        description: "Desc",
        password: "secret",
        expiresAt: new Date().toISOString(),
        clickLimit: 100,
        iosUrl: "https://apps.apple.com/x",
        androidUrl: "https://play.google.com/x",
        utmSource: "fb",
      });
      expect(r.success).toBe(true);
    });
    it("rejects invalid password length", () => {
      const r = createLinkSchema.safeParse({ destinationUrl: "https://x.com", password: "abc" });
      expect(r.success).toBe(false);
    });
  });

  describe("qrConfigSchema", () => {
    it("accepts valid", () => {
      const r = qrConfigSchema.parse({ fg: "#000000", bg: "#FFFFFF", size: 512, margin: 2 });
      expect(r.fg).toBe("#000000");
    });
    it("applies defaults", () => {
      const r = qrConfigSchema.parse({});
      expect(r.fg).toBe("#18181B");
      expect(r.bg).toBe("#FFFFFF");
      expect(r.size).toBe(512);
    });
    it("rejects non-hex color", () => {
      expect(qrConfigSchema.safeParse({ fg: "red" }).success).toBe(false);
    });
  });
});
