import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";

export async function SiteHeader() {
  const ctx = await getSessionUser();
  const signedIn = Boolean(ctx);
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[color:var(--border)]/60 bg-[color:var(--background)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--background)]/60">
      <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Linky home" className="flex items-center">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Buka dashboard</Link>
              </Button>
              <form action="/api/auth/logout" method="POST">
                <Button type="submit" variant="ghost" size="sm">
                  Keluar
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/signin">Masuk</Link>
              </Button>
              <Button asChild size="sm" variant="gradient">
                <Link href="/signup">Mulai gratis</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
