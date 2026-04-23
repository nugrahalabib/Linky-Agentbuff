import { NextResponse } from "next/server";
import { dbKind, pingDb } from "@/lib/db";
import { pingRedis } from "@/lib/cache/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const [db, redis] = await Promise.all([pingDb(), pingRedis()]);
  const healthy = db; // redis optional
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      uptime_sec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: { kind: dbKind, ok: db },
        redis: { ok: redis, configured: Boolean(process.env.REDIS_URL) },
      },
      latency_ms: Date.now() - started,
      version: process.env.npm_package_version ?? "0.1.0",
    },
    { status: healthy ? 200 : 503 },
  );
}
