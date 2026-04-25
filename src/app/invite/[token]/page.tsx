import Link from "next/link";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, workspaces, workspaceInvitations } from "@/lib/db/schema";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { AcceptInviteButton } from "@/components/accept-invite-button";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = db
    .select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
      token: workspaceInvitations.token,
      workspaceName: workspaces.name,
      invitedByName: users.name,
      invitedByEmail: users.email,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .leftJoin(users, eq(users.id, workspaceInvitations.invitedBy))
    .where(and(eq(workspaceInvitations.token, token), isNull(workspaceInvitations.acceptedAt)))
    .get();

  const ctx = await getSessionUser();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6"><Link href="/" className="inline-flex"><Logo /></Link></div>
        <Card>
          <CardContent className="pt-8 pb-6 text-center">
            {!invite ? (
              <>
                <h1 className="text-xl font-semibold">Undangan tidak valid.</h1>
                <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                  Link mungkin sudah kadaluarsa, sudah diterima, atau salah ketik.
                </p>
                <Button asChild className="mt-6" variant="outline">
                  <Link href="/">Kembali ke beranda</Link>
                </Button>
              </>
            ) : invite.expiresAt.getTime() < Date.now() ? (
              <>
                <h1 className="text-xl font-semibold">Undangan kadaluarsa.</h1>
                <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                  Mintalah pengirim untuk mengirim ulang undangan.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold">Bergabung ke workspace</h1>
                <p className="mt-2 text-base font-medium">{invite.workspaceName}</p>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  Diundang oleh {invite.invitedByName ?? invite.invitedByEmail ?? "anggota"}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                  Untuk: <code>{invite.email}</code> · Role: <code>{invite.role}</code>
                </p>

                {!ctx ? (
                  <div className="mt-6 space-y-2">
                    <p className="text-sm">Masuk dulu dengan email <strong>{invite.email}</strong> untuk menerima.</p>
                    <Button asChild className="w-full">
                      <Link href={`/signin?next=/invite/${token}`}>Masuk</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/signup?next=/invite/${token}`}>Daftar baru</Link>
                    </Button>
                  </div>
                ) : ctx.user.email.toLowerCase() !== invite.email.toLowerCase() ? (
                  <div className="mt-6 space-y-2">
                    <p className="text-sm text-[color:var(--danger)]">
                      Kamu masuk sebagai <strong>{ctx.user.email}</strong> — undangan ini untuk{" "}
                      <strong>{invite.email}</strong>. Keluar dulu lalu masuk dengan email yang benar.
                    </p>
                    <form action="/api/auth/logout" method="POST">
                      <Button type="submit" className="w-full" variant="outline">Keluar</Button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-6">
                    <AcceptInviteButton token={token} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
