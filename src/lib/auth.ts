import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sessions, users, workspaceMembers, workspaces, type Session, type User } from "@/lib/db/schema";
import { getActiveWorkspace as resolveActiveWorkspace } from "@/lib/workspace";

const SESSION_COOKIE = "linky_session";
const SESSION_DAYS = 30;

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 24) {
    throw new Error("AUTH_SECRET environment variable must be set and at least 24 chars.");
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
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
  db.insert(sessions).values({ id: sessionId, userId, expiresAt }).run();
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

/**
 * Returns the user's ACTIVE workspace. Auto-creates personal workspace + owner
 * membership for brand-new users. Use `getSessionUserWithWorkspace` for the
 * full context (user + workspace + role).
 */
export async function ensureWorkspace(userId: string, _name = "Pribadi") {
  const r = await resolveActiveWorkspace(userId);
  return r.workspace;
}

export async function getSessionUserWithWorkspace() {
  const ctx = await getSessionUser();
  if (!ctx) return null;
  const r = await resolveActiveWorkspace(ctx.user.id);
  return { ...ctx, workspace: r.workspace, role: r.role };
}
