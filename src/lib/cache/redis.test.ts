import { describe, expect, it, beforeEach } from "../test-shim";
import { cacheGet, cacheSet, pingRedis, rateLimit } from "./redis";

describe("redis (no REDIS_URL set — degraded mode)", () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
  });

  it("cacheGet returns null", async () => {
    expect(await cacheGet("any")).toBeNull();
  });

  it("cacheSet no-ops silently", async () => {
    await expect(cacheSet("k", "v")).resolves.toBeUndefined();
  });

  it("pingRedis returns false when not configured", async () => {
    expect(await pingRedis()).toBe(false);
  });

  it("rateLimit allows when degraded", async () => {
    const r = await rateLimit("ip:1.2.3.4", 5, 60);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(5);
  });
});
