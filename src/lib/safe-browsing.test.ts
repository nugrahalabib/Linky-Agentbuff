import { describe, expect, it, beforeEach } from "./test-shim";
import { checkUrlSafety } from "./safe-browsing";

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
});
