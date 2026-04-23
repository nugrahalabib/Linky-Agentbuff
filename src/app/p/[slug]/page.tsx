import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { resolveLinkBySlug, checkLinkStatus, pickTargetUrl } from "@/lib/resolve-link";
import { recordClick } from "@/lib/clicks";
import { headers } from "next/headers";

async function unlockAction(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");
  const link = resolveLinkBySlug(slug);
  if (!link || !link.passwordHash) redirect("/not-found");

  const ok = await bcrypt.compare(password, link.passwordHash);
  if (!ok) {
    redirect(`/p/${encodeURIComponent(slug)}?error=1`);
  }

  const h = await headers();
  const ua = h.get("user-agent");
  const target = pickTargetUrl(link, ua, h.get("x-vercel-ip-country"));
  recordClick({
    linkId: link.id,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0",
    ua,
    referrer: h.get("referer"),
    country: h.get("x-vercel-ip-country"),
    region: h.get("x-vercel-ip-country-region"),
    city: h.get("x-vercel-ip-city"),
  });
  redirect(target);
}

export default async function PasswordGatePage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await props.params;
  const { error } = await props.searchParams;
  const link = resolveLinkBySlug(slug);
  if (!link) redirect("/not-found");
  const status = checkLinkStatus(link);
  if (status.kind === "expired" || status.kind === "click_limit") redirect("/expired");
  if (status.kind === "redirect") redirect(status.url);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-[color:var(--background)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex"><Logo /></div>
        </div>
        <Card>
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[color:var(--primary)]/10 flex items-center justify-center text-[color:var(--primary)]">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold">Link ini dilindungi.</h1>
              <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">
                Masukkan kata sandi untuk melanjutkan.
              </p>
            </div>
            <form action={unlockAction} className="mt-6 space-y-3">
              <input type="hidden" name="slug" value={slug} />
              <Input
                type="password"
                name="password"
                autoFocus
                required
                placeholder="Kata sandi"
                aria-label="Kata sandi"
                className="h-11"
              />
              {error && (
                <p className="text-sm text-[color:var(--danger)]" role="alert">
                  Kata sandi salah. Coba lagi.
                </p>
              )}
              <Button type="submit" className="w-full h-11">
                Buka
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
