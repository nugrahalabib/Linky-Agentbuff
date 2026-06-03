import { and, eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { sessions, users, workspaces, type Session, type User } from "@/lib/db/schema";
import { getActiveWorkspace as resolveActiveWorkspace } from "@/lib/workspace";
import { hashIp } from "@/lib/hash";
import type { OAuthProfile } from "@/lib/oauth";

const SESSION_COOKIE = "linky_session";
const SESSION_DAYS = 30;

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 24) {
    throw new Error("AUTH_SECRET environment variable must be set and at least 24 chars.");
  }
  return new TextEncoder().encode(s);
}

/**
 * Resolve (or create) a local user from an OAuth profile. Matching order:
 * 1) by (provider, subject) — the stable identity, 2) by email — links an existing account to
 * the OAuth identity, 3) create a fresh user. Password login is removed, so new users get an
 * empty password_hash (column is legacy/NOT NULL at the DB level).
 */
export async function findOrCreateOAuthUser(provider: string, profile: OAuthProfile): Promise<User> {
  const bySubject = db
    .select()
    .from(users)
    .where(and(eq(users.oauthProvider, provider), eq(users.oauthSubject, profile.subject)))
    .get();
  if (bySubject) return bySubject;

  if (profile.email) {
    const byEmail = db.select().from(users).where(eq(users.email, profile.email)).get();
    if (byEmail) {
      db.update(users)
        .set({
          oauthProvider: provider,
          oauthSubject: profile.subject,
          image: byEmail.image ?? profile.image,
          name: byEmail.name ?? profile.name,
          emailVerifiedAt: byEmail.emailVerifiedAt ?? (profile.emailVerified ? new Date() : null),
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail.id))
        .run();
      return db.select().from(users).where(eq(users.id, byEmail.id)).get() as User;
    }
  }

  const id = nanoid(14);
  db.insert(users)
    .values({
      id,
      email: profile.email,
      passwordHash: "", // password login removed; OAuth users have no password
      name: profile.name,
      image: profile.image,
      oauthProvider: provider,
      oauthSubject: profile.subject,
      emailVerifiedAt: profile.emailVerified ? new Date() : null,
      locale: "id",
    })
    .run();
  return db.select().from(users).where(eq(users.id, id)).get() as User;
}

async function signSessionToken(sessionId: string, userId: string, expSec: number): Promise<string> {
  return new SignJWT({ sid: sessionId, uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expSec)
    .sign(getSecret());
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  let userAgent: string | null = null;
  let ipHash: string | null = null;
  try {
    const h = await headers();
    userAgent = (h.get("user-agent") ?? "").slice(0, 250) || null;
    const ip =
      h.get("cf-connecting-ip") ??
      h.get("x-real-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "0.0.0.0";
    ipHash = hashIp(ip);
  } catch {
    /* not in request scope */
  }
  db.insert(sessions)
    .values({ id: sessionId, userId, expiresAt, userAgent, ipHash, lastSeenAt: new Date() })
    .run();
  const token = await signSessionToken(sessionId, userId, Math.floor(expiresAt.getTime() / 1000));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return sessionId;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const sid = payload.sid as string | undefined;
      if (sid) db.delete(sessions).where(eq(sessions.id, sid)).run();
    } catch {
      /* ignore */
    }
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<{ user: User; session: Session } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sid = payload.sid as string;
    const session = db.select().from(sessions).where(eq(sessions.id, sid)).get();
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      db.delete(sessions).where(eq(sessions.id, sid)).run();
      return null;
    }
    const user = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!user) return null;
    try {
      db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, sid)).run();
    } catch {
      /* non-fatal */
    }
    return { user, session };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const ctx = await getSessionUser();
  if (!ctx) throw new Error("UNAUTHORIZED");
  return ctx.user;
}

export async function getDefaultWorkspace(userId: string) {
  return db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).get() ?? null;
}

export async function ensureWorkspace(userId: string, _name = "Pribadi") {
  const r = await resolveActiveWorkspace(userId);
  return r.workspace;
}

export async function getSessionUserWithWorkspace() {
  const ctx = await getSessionUser();
  if (!ctx) return null;
  const r = await resolveActiveWorkspace(ctx.user.id);
  return { ...ctx, workspace: r.workspace };
}
