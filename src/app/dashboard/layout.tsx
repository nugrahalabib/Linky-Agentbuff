import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Code2,
  Download,
  Folder,
  Home,
  Layout,
  Link as LinkIcon,
  LogOut,
  QrCode,
  Settings,
  Tag,
  Upload,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth";
import { CommandPalette } from "@/components/command-palette";
import { SearchTrigger } from "@/components/search-trigger";

const primary = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/dashboard/links", label: "Link", icon: LinkIcon },
  { href: "/dashboard/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/dashboard/qr", label: "QR Studio", icon: QrCode },
  { href: "/dashboard/pages", label: "Linky Pages", icon: Layout },
];

const secondary = [
  { href: "/dashboard/folders", label: "Folder", icon: Folder },
  { href: "/dashboard/tags", label: "Tag", icon: Tag },
  { href: "/dashboard/utm-recipes", label: "UTM Recipes", icon: Zap },
  { href: "/dashboard/import", label: "Import CSV", icon: Upload },
  { href: "/dashboard/developer", label: "Developer", icon: Code2 },
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
        <div className="px-3 pb-2">
          <SearchTrigger />
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
          {primary.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {n.label}
            </Link>
          ))}
          <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Kelola
          </div>
          {secondary.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {n.label}
            </Link>
          ))}
          <Link
            href="/api/links/export"
            prefetch={false}
            className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
          >
            <Download className="h-4 w-4 shrink-0" />
            Export CSV
          </Link>
        </nav>
        <div className="border-t border-[color:var(--border)] p-3">
          <div className="mb-2 px-3 py-2">
            <div className="text-xs text-[color:var(--muted-foreground)]">Masuk sebagai</div>
            <div className="text-sm font-medium truncate">{ctx.user.email}</div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] transition-colors"
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
          {[
            primary[0],
            primary[1],
            primary[3],
            primary[4],
            { href: "/dashboard/settings", label: "Lainnya", icon: Settings },
          ].map((n) => (
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

      <CommandPalette />
    </div>
  );
}
