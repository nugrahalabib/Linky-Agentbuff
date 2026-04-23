import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase();
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
