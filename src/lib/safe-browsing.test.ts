import { describe, expect, it, beforeEach } from "./test-shim";
import { checkUrlSafety, isInternalHost, isUnsafeRequestUrl } from "./safe-browsing";

describe("safe-browsing (heuristic-only mode, no API key)", () => {
  beforeEach(() => {
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    process.env.AUTH_SECRET = "test-secret-minimum-24-chars-placeholder-xx";
    process.env.DATABASE_URL = "file:./test-sb.db";
  });

  it("safe URL passes", async () => {
    const r = await checkUrlSafety("https://github.com/anthropics/claude-code");
    expect(r.verdict).toBe("safe");
  });

  it("internal IP blocked as malicious", async () => {
    const r = await checkUrlSafety("http://127.0.0.1:8080/admin");
    expect(r.verdict).toBe("malicious");
  });

  it("private 192.168 blocked", async () => {
    const r = await checkUrlSafety("http://192.168.1.1/router");
    expect(r.verdict).toBe("malicious");
  });

  it("suspicious .zip TLD flagged", async () => {
    const r = await checkUrlSafety("https://example.zip");
    expect(r.verdict).toBe("suspicious");
  });

  it("punycode URL flagged", async () => {
    const r = await checkUrlSafety("https://xn--80ak6aa92e.com");
    expect(r.verdict).toBe("suspicious");
  });

  it("excessive subdomains flagged", async () => {
    const r = await checkUrlSafety("https://a.b.c.d.e.evil.com");
    expect(r.verdict).toBe("suspicious");
  });

  it("normal HTTPS site passes", async () => {
    const r = await checkUrlSafety("https://google.com");
    expect(r.verdict).toBe("safe");
  });

  it("malformed URL = malicious", async () => {
    const r = await checkUrlSafety("not-a-real-url");
    expect(r.verdict).toBe("malicious");
  });

  it("IPv6 loopback [::1] blocked", async () => {
    const r = await checkUrlSafety("http://[::1]:3000/x");
    expect(r.verdict).toBe("malicious");
  });

  it("127.0.0.2 (rest of loopback /8) blocked", async () => {
    const r = await checkUrlSafety("http://127.0.0.2/x");
    expect(r.verdict).toBe("malicious");
  });

  it("decimal-encoded 127.0.0.1 blocked", async () => {
    const r = await checkUrlSafety("http://2130706433/x");
    expect(r.verdict).toBe("malicious");
  });

  it("hex-encoded 127.0.0.1 blocked", async () => {
    const r = await checkUrlSafety("http://0x7f000001/x");
    expect(r.verdict).toBe("malicious");
  });

  it("cloud metadata 169.254.169.254 blocked", async () => {
    const r = await checkUrlSafety("http://169.254.169.254/latest/meta-data");
    expect(r.verdict).toBe("malicious");
  });
});

describe("isInternalHost / isUnsafeRequestUrl", () => {
  it("flags loopback, private, link-local, IPv6, and encoded IPs", () => {
    for (const h of ["localhost", "app.localhost", "127.0.0.1", "127.0.0.2", "0.0.0.0", "10.0.0.5", "192.168.1.1", "172.16.0.1", "169.254.169.254", "[::1]", "::1", "fd00::1", "fe80::1", "2130706433", "0x7f000001"]) {
      expect(isInternalHost(h)).toBe(true);
    }
  });

  it("allows normal public hosts", () => {
    for (const h of ["example.com", "github.com", "8.8.8.8", "203.0.113.7"]) {
      expect(isInternalHost(h)).toBe(false);
    }
  });

  it("isUnsafeRequestUrl rejects internal + non-http schemes", () => {
    expect(isUnsafeRequestUrl("http://127.0.0.1/x")).toBe(true);
    expect(isUnsafeRequestUrl("https://169.254.169.254/")).toBe(true);
    expect(isUnsafeRequestUrl("ftp://example.com")).toBe(true);
    expect(isUnsafeRequestUrl("not-a-url")).toBe(true);
    expect(isUnsafeRequestUrl("https://hooks.example.com/abc")).toBe(false);
  });
});
