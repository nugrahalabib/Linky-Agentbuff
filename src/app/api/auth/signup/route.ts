import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession, ensureWorkspace, hashPassword } from "@/lib/auth";
import { signupSchema } from "@/lib/validators";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase();
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });

  const id = nanoid(14);
  const passwordHash = await hashPassword(parsed.data.password);
  db.insert(users)
    .values({
      id,
      email,
      passwordHash,
      name: parsed.data.name ?? null,
      emailVerifiedAt: new Date(),
    })
    .run();

  await ensureWorkspace(id, parsed.data.name?.split(" ")[0] || "Pribadi");
  await createSession(id);

  return NextResponse.json({ ok: true });
}
