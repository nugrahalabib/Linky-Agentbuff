import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listConfiguredProviders } from "@/lib/oauth";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  provider_unavailable: "Metode login belum dikonfigurasi. Hubungi admin / set GOOGLE_CLIENT_ID.",
  oauth_denied: "Login dibatalkan.",
  oauth_state: "Sesi login kedaluwarsa atau tidak cocok. Coba lagi.",
  oauth_failed: "Gagal login. Coba lagi sebentar lagi.",
  no_email: "Akun penyedia tidak memberikan email — tidak bisa lanjut.",
  email_unverified:
    "Email dari penyedia login belum terverifikasi, jadi kami tidak bisa menautkannya ke akun yang sudah ada. Login dengan akun yang emailnya sudah terverifikasi.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const providers = listConfiguredProviders();

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex"><Logo /></Link>
        </div>
        <Card>
          <CardContent className="pt-8 pb-6">
            <h1 className="text-2xl font-bold tracking-tight">Masuk ke Linky</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Login pakai akun Google-mu — cepat dan aman, tanpa kata sandi.
            </p>

            {error && (
              <p className="mt-4 text-sm text-[color:var(--danger)]" role="alert">
                {ERRORS[error] ?? "Terjadi kesalahan. Coba lagi."}
              </p>
            )}

            {providers.length === 0 ? (
              <div className="mt-6 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--muted)]/40 p-4 text-sm text-[color:var(--muted-foreground)]">
                Login Google belum dikonfigurasi. Set <code>GOOGLE_CLIENT_ID</code> dan{" "}
                <code>GOOGLE_CLIENT_SECRET</code> (lihat <code>docs/AUTH-GOOGLE-SETUP.md</code>), lalu restart.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {providers.map((p) => (
                  <Button key={p.id} asChild variant="outline" className="w-full h-11">
                    <a href={`/api/auth/oauth/${p.id}/start`}>
                      {p.id === "google" && <GoogleMark />}
                      Lanjutkan dengan {p.label}
                    </a>
                  </Button>
                ))}
              </div>
            )}

            <p className="mt-6 text-center text-[11px] text-[color:var(--muted-foreground)]">
              Dengan masuk, kamu setuju pada Ketentuan & Kebijakan Privasi Linky.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
