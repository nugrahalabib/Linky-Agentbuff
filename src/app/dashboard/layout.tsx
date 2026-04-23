import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Home, LinkIcon, LogOut, QrCode, Settings } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Beranda", icon: Home, exact: true },
  { href: "/dashboard/links", label: "Link", icon: LinkIcon },
  { href: "/dashboard/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/dashboard/qr", label: "Studio QR", icon: QrCode },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionUser();
  if (!ctx) redirect("/signin");
  return (
    <div className="min-h-screen flex bg-[color:var(--background)]">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[color:var(--border)] bg-[color:var(--card)] sticky top-0 h-screen">
        <div className="px-5 py-5">
          <Link href="/dashboard" className="inline-flex">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[color:var(--border)] p-3">
          <div className="mb-2 px-3 py-2">
            <div className="text-xs text-[color:var(--muted-foreground)]">Masuk sebagai</div>
            <div className="text-sm font-medium truncate">{ctx.user.email}</div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b border-[color:var(--border)] bg-[color:var(--card)]/90 backdrop-blur">
          <Link href="/dashboard"><Logo /></Link>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm font-medium text-[color:var(--muted-foreground)]" type="submit">
              Keluar
            </button>
          </form>
        </header>

        <main className="flex-1">{children}</main>

        <nav
          aria-label="Navigasi utama"
          className="md:hidden sticky bottom-0 z-20 border-t border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur grid grid-cols-5"
        >
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
