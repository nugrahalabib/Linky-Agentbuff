import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { authenticateApiKey } from "@/lib/api-auth";

export interface ApiErrorBody {
  error: { code: string; message: string };
  request_id: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

function mergeHeaders(
  base: Record<string, string>,
  extra?: HeadersInit | Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = { ...base };
  if (!extra) return out;
  if (extra instanceof Headers) {
    extra.forEach((v, k) => (out[k] = v));
  } else if (Array.isArray(extra)) {
    for (const [k, v] of extra) out[k] = v;
  } else {
    Object.assign(out, extra as Record<string, string>);
  }
  return out;
}

export function apiOk(data: unknown, init?: ResponseInit & { extraHeaders?: Record<string, string> }): NextResponse {
  const fromInit = mergeHeaders({}, init?.headers);
  const headers = mergeHeaders(CORS_HEADERS, mergeHeaders(fromInit, init?.extraHeaders));
  return NextResponse.json(data, { ...init, headers });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  extraHeaders?: Record<string, string>,
): NextResponse {
  const body: ApiErrorBody = { error: { code, message }, request_id: nanoid(12) };
  return NextResponse.json(body, {
    status,
    headers: mergeHeaders(CORS_HEADERS, extraHeaders),
  });
}

export function apiOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimitCheck(
  key: string,
  limit = 60,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  bucket.count++;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function rateLimitHeaders(
  rl: { remaining: number; resetAt: number },
  limit = 60,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.floor(rl.resetAt / 1000)),
  };
}

export interface AuthedRequest {
  workspace: { id: string; name: string; slug: string };
  key: { id: string; userId: string; name: string };
  rateHeaders: Record<string, string>;
}

const RATE_LIMIT_PER_MINUTE = 120;

export async function withApiAuth(
  req: Request,
): Promise<{ ok: true; auth: AuthedRequest } | { ok: false; res: NextResponse }> {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return {
      ok: false,
      res: apiError("unauthorized", "API key tidak valid atau sudah expired.", 401, {
        "WWW-Authenticate": "Bearer",
      }),
    };
  }
  const rl = rateLimitCheck(`api:${auth.key.id}`, RATE_LIMIT_PER_MINUTE);
  const rateHeaders = rateLimitHeaders(rl, RATE_LIMIT_PER_MINUTE);
  if (!rl.allowed) {
    return {
      ok: false,
      res: apiError(
        "rate_limited",
        `Lebih dari ${RATE_LIMIT_PER_MINUTE} request/menit. Coba lagi sebentar.`,
        429,
        rateHeaders,
      ),
    };
  }
  return {
    ok: true,
    auth: {
      workspace: auth.workspace,
      key: auth.key,
      rateHeaders,
    },
  };
}

export async function readJson<T>(req: Request): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> {
  try {
    const data = (await req.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, res: apiError("invalid_json", "Body request bukan JSON valid.", 400) };
  }
}
