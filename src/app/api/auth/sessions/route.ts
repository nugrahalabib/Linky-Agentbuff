import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth";

function parseUa(ua: string | null): { device: string; os: string; browser: string } {
  if (!ua) return { device: "Unknown", os: "Unknown", browser: "Unknown" };
  const lower = ua.toLowerCase();
  const device = /mobile|android|iphone/i.test(ua) ? "Mobile" : /ipad|tablet/i.test(ua) ? "Tablet" : "Desktop";
  const os = /windows nt/i.test(ua)
    ? "Windows"
    : /mac os x/i.test(ua)
    ? "macOS"
    : /android/i.test(ua)
    ? "Android"
    : /iphone|ipad|ios/i.test(ua)
    ? "iOS"
    : /linux/i.test(ua)
    ? "Linux"
    : "Unknown";
  const browser = /edg\//i.test(lower)
    ? "Edge"
    : /chrome\//i.test(lower)
    ? "Chrome"
    : /firefox\//i.test(lower)
    ? "Firefox"
    : /safari\//i.test(lower)
    ? "Safari"
    : "Unknown";
  return { device, os, browser };
}

export async function GET() {
  const ctx = await getSessionUser();
  if (!ctx) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const rows = db
    .select()
    .from(sessions)
    .where(eq(sessions.userId, ctx.user.id))
    .orderBy(desc(sessions.lastSeenAt))
    .all();
  const out = rows.map((s) => ({
    id: s.id,
    isCurrent: s.id === ctx.session.id,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
    lastSeenAt: s.lastSeenAt,
    ...parseUa(s.userAgent),
  }));
  return NextResponse.json({ sessions: out });
}
