import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Globe,
  KeyRound,
  Layers,
  Lock,
  MapPin,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
  Wand2,
  Link2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const bigFeatures = [
  {
    icon: BarChart3,
    badge: "Analytics",
    title: "Analitik real-time",
    desc: "Pantau setiap klik saat terjadi. Geografi, device, browser, referrer — semua ter-segment otomatis dengan filter bot bawaan.",
    bullets: ["Dashboard yang hidup", "Breakdown 6 dimensi", "Chart per-hari cantik"],
    gradient: "from-brand-500 to-brand-700",
  },
  {
    icon: QrCode,
    badge: "QR Studio",
    title: "QR Code yang cantik",
    desc: "Desain QR sesuai brand — warna gradient, latar kustom, ukuran hingga 2048px. Export PNG atau SVG siap cetak.",
    bullets: ["Warna tak terbatas", "PNG + SVG vector", "Siap scan di mana saja"],
    gradient: "from-accent-500 to-brand-500",
  },
  {
    icon: Wand2,
    badge: "Targeting",
    title: "Targeting cerdas",
    desc: "Satu link, banyak tujuan. Pengunjung iOS masuk App Store, Android ke Play Store, sisanya ke website — otomatis.",
    bullets: ["Deep link iOS + Android", "UTM builder built-in", "Geo rules per-negara"],
    gradient: "from-brand-600 to-accent-600",
  },
];

const microFeatures = [
  {
    icon: Link2,
    title: "Slug custom",
    desc: "linky.agentbuff.id/promo-spesial — diingat lebih mudah.",
  },
  {
    icon: Lock,
    title: "Password protection",
    desc: "Kunci link dengan kata sandi. bcrypt-grade secure.",
  },
  {
    icon: Clock,
    title: "Kedaluwarsa otomatis",
    desc: "Set tanggal atau batas klik. Link mati sendiri.",
  },
  {
    icon: ShieldCheck,
    title: "Bot filter",
    desc: "Klik crawler dipisahkan. Data kamu tetap bersih.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    desc: "Dashboard responsif, dark mode otomatis, touch-friendly.",
  },
  {
    icon: Layers,
    title: "Dashboard terpusat",
    desc: "Semua link kamu dalam satu tempat yang rapi.",
  },
];

const stats = [
  { value: "< 50ms", label: "Latensi redirect" },
  { value: "6", label: "Dimensi analitik" },
  { value: "2K+", label: "QR resolusi px" },
  { value: "WCAG AA", label: "Standar aksesibilitas" },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden />
          <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28">
            <div className="flex justify-center mb-6">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-1.5 text-xs font-medium text-[color:var(--muted-foreground)] shadow-sm hover:border-[color:var(--primary)]/40 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-[color:var(--primary)]" />
                Versi baru · analitik real-time + QR Studio
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Setiap klik
              <br />
              jadi <span className="gradient-text">cerita.</span>
            </h1>

            <p className="mt-6 text-center text-lg sm:text-xl text-[color:var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Link pendek yang mengerti audiensmu. Analitik real-time, QR branded, targeting cerdas, dan keamanan
              tingkat enterprise — semua dalam satu dashboard yang nyaman.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="xl" variant="gradient" className="w-full sm:w-auto">
                <Link href="/signup">
                  Mulai dalam 30 detik
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <Link href="#features">
                  Lihat fitur lengkap
                </Link>
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-[color:var(--muted-foreground)]">
              Tanpa kartu kredit · Akun aktif selamanya · Dashboardmu siap dalam sekali klik
            </p>

            {/* Product preview mockup */}
            <div className="mt-16 relative mx-auto max-w-4xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 via-accent-500/20 to-brand-500/20 rounded-3xl blur-2xl" aria-hidden />
              <div className="relative rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[color:var(--border)] bg-[color:var(--muted)]">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-4 flex-1 rounded-md bg-[color:var(--background)] px-3 py-1 text-xs font-mono text-[color:var(--muted-foreground)] truncate">
                    linky.agentbuff.id/dashboard
                  </div>
                </div>
                <div className="p-8 grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <div className="text-xs font-medium text-[color:var(--muted-foreground)] uppercase tracking-wider">
                        Klik hari ini
                      </div>
                      <div className="mt-1 text-4xl font-bold tabular-nums gradient-text">12,847</div>
                      <div className="text-xs text-[color:var(--success)] font-medium mt-1">▲ 23% vs kemarin</div>
                    </div>
                    <div className="h-24 rounded-lg bg-gradient-to-r from-brand-500/10 to-accent-500/10 flex items-end gap-1 p-2">
                      {[30, 45, 38, 62, 48, 75, 92, 68, 85, 70, 88, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-brand-600 to-accent-500"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: MapPin, label: "Indonesia", val: "8.2K" },
                        { icon: Smartphone, label: "Mobile", val: "73%" },
                        { icon: Globe, label: "Organik", val: "4.1K" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg bg-[color:var(--muted)] p-3">
                          <div className="flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
                            <s.icon className="h-3 w-3" />
                            {s.label}
                          </div>
                          <div className="mt-1 font-semibold tabular-nums">{s.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { slug: "promo-ramadan", clicks: "4.2K" },
                      { slug: "launch-2026", clicks: "2.8K" },
                      { slug: "newsletter", clicks: "1.9K" },
                    ].map((l) => (
                      <div key={l.slug} className="rounded-lg border border-[color:var(--border)] p-3">
                        <div className="font-mono text-xs font-medium truncate">/{l.slug}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted-foreground)] tabular-nums">
                          {l.clicks} klik
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="border-y border-[color:var(--border)] bg-[color:var(--card)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold tracking-tight gradient-text tabular-nums">
                  {s.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-[color:var(--muted-foreground)] uppercase tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BIG FEATURES */}
        <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--primary)] uppercase tracking-wider">
              Fitur unggulan
            </div>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
              Kekuatan <span className="gradient-text">Linky</span>
            </h2>
            <p className="mt-4 text-lg text-[color:var(--muted-foreground)]">
              Bukan sekadar URL shortener — Linky memberikan mata dan telinga untuk setiap link kamu.
            </p>
          </div>

          <div className="mt-16 space-y-8">
            {bigFeatures.map((f, i) => (
              <Card key={f.title} className="overflow-hidden">
                <div className={`grid md:grid-cols-2 ${i % 2 === 0 ? "" : "md:[direction:rtl]"}`}>
                  <div className="p-8 sm:p-12 md:[direction:ltr]">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-lg`}
                    >
                      <f.icon className="h-6 w-6" />
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[color:var(--primary)] uppercase tracking-wider">
                      {f.badge}
                    </div>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{f.title}</h3>
                    <p className="mt-4 text-[color:var(--muted-foreground)] leading-relaxed">{f.desc}</p>
                    <ul className="mt-6 space-y-2">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`hidden md:flex items-center justify-center p-8 bg-gradient-to-br ${f.gradient} md:[direction:ltr] opacity-95`}
                  >
                    <f.icon className="h-40 w-40 text-white/30" strokeWidth={1.25} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* MICRO FEATURES GRID */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Dan puluhan detil yang membuat berbeda</h2>
            <p className="mt-3 text-[color:var(--muted-foreground)]">
              Setiap fitur dirancang untuk kenyamanan — dari keamanan hingga aksesibilitas.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {microFeatures.map((f) => (
              <Card key={f.title} className="hover:border-[color:var(--primary)]/40 transition-colors">
                <CardContent className="pt-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
                    <f.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 font-semibold text-base">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Dari daftar ke insight, 3 langkah.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: KeyRound,
                title: "Daftar akun",
                desc: "30 detik, email + kata sandi. Tidak perlu kartu, tidak ada trial.",
              },
              {
                n: "02",
                icon: Link2,
                title: "Bikin link pertama",
                desc: "Tempel URL, pilih slug custom, atur password atau deep link kalau perlu.",
              },
              {
                n: "03",
                icon: Zap,
                title: "Lihat analitik",
                desc: "Begitu orang klik, data muncul real-time. Geo, device, hari, referrer — semua.",
              },
            ].map((step) => (
              <Card key={step.n}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold tabular-nums gradient-text">{step.n}</div>
                    <step.icon className="h-5 w-5 text-[color:var(--primary)]" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden rounded-2xl p-10 sm:p-16 text-center bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 text-white shadow-2xl">
            <div className="absolute inset-0 grid-bg opacity-20" aria-hidden />
            <h2 className="relative text-3xl sm:text-4xl font-bold tracking-tight">
              Siap melihat setiap klik jadi insight?
            </h2>
            <p className="relative mt-4 text-white/80 max-w-xl mx-auto">
              Bikin akun sekarang, buat link pertamamu, dan saksikan data mengalir dalam hitungan detik.
            </p>
            <div className="relative mt-8 flex justify-center">
              <Button asChild size="xl" className="bg-white text-brand-700 hover:bg-white/90 shadow-lg">
                <Link href="/signup">
                  Mulai sekarang — gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[color:var(--border)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-sm text-[color:var(--muted-foreground)]">
                © {new Date().getFullYear()} Nugraha Labib Mujaddid
              </span>
            </div>
            <div className="flex gap-6 text-sm text-[color:var(--muted-foreground)]">
              <Link href="/signin" className="hover:text-[color:var(--foreground)]">
                Masuk
              </Link>
              <Link href="/signup" className="hover:text-[color:var(--foreground)]">
                Daftar
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
