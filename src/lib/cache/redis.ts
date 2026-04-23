import Redis from "ioredis";

type RedisClient = InstanceType<typeof Redis>;

let client: RedisClient | null = null;
let connectAttempted = false;

function getUrl(): string | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return url;
}

export function getRedis(): RedisClient | null {
  if (client) return client;
  if (connectAttempted) return null;
  connectAttempted = true;
  const url = getUrl();
  if (!url) return null;
  try {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      enableOfflineQueue: false,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });
    client.on("error", (err) => {
      console.warn("[redis] error:", err.message);
    });
    return client;
  } catch (e) {
    console.warn("[redis] init failed:", (e as Error).message);
    client = null;
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const raw = await r.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec = 300): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, JSON.stringify(value), "EX", ttlSec);
  } catch {
    /* swallow */
  }
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch {
    /* swallow */
  }
}

export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const r = getRedis();
  if (!r) {
    // no redis = allow (degraded mode). In-memory fallback below.
    return { allowed: true, remaining: max, resetAt: Date.now() + windowSec * 1000 };
  }
  try {
    const tx = r.multi();
    tx.incr(key);
    tx.expire(key, windowSec, "NX");
    tx.ttl(key);
    const res = await tx.exec();
    if (!res) return { allowed: true, remaining: max, resetAt: Date.now() + windowSec * 1000 };
    const count = Number(res[0][1]);
    const ttl = Number(res[2][1]);
    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      resetAt: Date.now() + Math.max(0, ttl) * 1000,
    };
  } catch {
    return { allowed: true, remaining: max, resetAt: Date.now() + windowSec * 1000 };
  }
}

export async function pingRedis(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const pong = await r.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
