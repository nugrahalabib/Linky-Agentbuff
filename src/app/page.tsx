import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Code2,
  Copy,
  Eye,
  FileSpreadsheet,
  Folder,
  Globe,
  Image as ImageIcon,
  Layout,
  Link2,
  Lock,
  MapPin,
  QrCode,
  Radio,
  Share2,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Webhook,
  Wand2,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const APP_HOST = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709").replace(/^https?:\/\//, "");

const STATS = [
  { value: "< 50ms", label: "Latensi redirect" },
  { value: "8+", label: "Block type bio" },
  { value: "5", label: "QR preset branded" },
  { value: "100%", label: "Datamu, milikmu" },
];

const URL_FEATURES = [
  {
    icon: BarChart3,
    badge: "Analytics",
    title: "Analitik real-time yang kaya",
    desc: "Pantau klik saat terjadi. Filter by negara, device, browser, referrer, UTM. Bot auto-filter — data tetap bersih.",
    bullets: ["6 dimensi breakdown", "Chart per-hari", "Bot filter otomatis"],
    gradient: "from-brand-500 to-brand-700",
  },
  {
    icon: QrCode,
    badge: "QR Studio",
    title: "QR code seindah brandmu",
    desc: "Upload logo, atur warna gradient, pilih shape modul (square/rounded/dots), tambah frame CTA. Export PNG atau SVG.",
    bullets: ["Logo overlay", "Gradient 2-stop", "5 preset siap pakai"],
    gradient: "from-accent-500 to-brand-500",
    badgeNew: true,
  },
  {
    icon: Target,
    badge: "Targeting",
    title: "Satu link, banyak tujuan",
    desc: "Kirim iOS ke App Store, Android ke Play Store. Pengunjung Indonesia ke toko lokal, luar negeri ke versi global. A/B test varian untuk temukan pemenang.",
    bullets: ["Deep link iOS + Android", "Geo rules per-negara", "A/B testing built-in"],
    gradient: "from-brand-600 to-accent-600",
    badgeNew: true,
  },
];

const MICRO_FEATURES = [
  { icon: Link2, title: "Custom slug", desc: `${APP_HOST}/promo-spesial` },
  { icon: Lock, title: "Password lock", desc: "Gate dengan bcrypt, untuk link privat" },
  { icon: Clock, title: "Kedaluwarsa otomatis", desc: "Tanggal atau batas klik" },
  { icon: Wand2, title: "UTM builder + recipes", desc: "Template tersimpan per-channel" },
  { icon: Folder, title: "Folder & tag", desc: "Kelompokkan ribuan link tetap rapi" },
  { icon: FileSpreadsheet, title: "CSV import/export", desc: "Migrasi 10.000 link sekaligus" },
  { icon: Eye, title: "OG preview kustom", desc: "Override title/desc/image saat di-share" },
  { icon: Radio, title: "Cloaking iframe", desc: "URL pendekmu tetap di address bar" },
  { icon: Globe, title: "Bahasa Indonesia", desc: "Default WIB, dark mode otomatis" },
];

const BIO_BLOCKS = [
  { icon: Sparkles, label: "Header", desc: "Avatar, nama, bio" },
  { icon: Link2, label: "Link Button", desc: "Tombol custom warna brand" },
  { icon: Share2, label: "Social Row", desc: "IG, TikTok, YouTube, lainnya" },
  { icon: ImageIcon, label: "Image", desc: "Foto produk atau moodboard" },
  { icon: TrendingUp, label: "Countdown", desc: "Hitung mundur promo" },
  { icon: MapPin, label: "YouTube Embed", desc: "Video langsung di halaman" },
];

const THEMES = [
  { name: "Creator", gradient: "linear-gradient(180deg,#4F46E5,#06B6D4)", color: "#fff" },
  { name: "Minimal", gradient: "#FAFAFA", color: "#18181B", border: "1px solid #E4E4E7" },
  { name: "Neon", gradient: "radial-gradient(circle at top,#F472B6,#7C3AED,#0B0D17)", color: "#fff" },
  { name: "Student", gradient: "#FEF3C7", color: "#18181B", border: "1px solid #F59E0B40" },
  { name: "UMKM", gradient: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff" },
];

const USE_CASES = [
  {
    id: "creator",
    label: "Creator",
    emoji: "✨",
    title: "Satu bio, semua contentmu",
    desc: "Kumpulkan YouTube, TikTok, podcast, merch, dan kolaborasi dalam satu Linky Page. Pantau tombol mana paling sering diklik.",
    features: ["Linky Page dengan 8 block type", "Analitik per-block", "5 theme preset"],
  },
  {
    id: "umkm",
    label: "UMKM",
    emoji: "🏪",
    title: "Katalog + WhatsApp dalam satu link",
    desc: "Tautkan katalog Tokopedia/Shopee, chat WhatsApp, lokasi Google Maps, dan promo terbaru. Share satu link di bio IG + status WA.",
    features: ["Deep link ke app WhatsApp", "Countdown untuk flash sale", "QR code cetak offline"],
  },
  {
    id: "marketer",
    label: "Marketer",
    emoji: "📊",
    title: "Campaign link dengan attribution",
    desc: "Branded domain + UTM otomatis + A/B test varian URL. Ukur ROI tiap kampanye dengan geo/device breakdown.",
    features: ["A/B testing sticky-hash", "UTM Recipes", "Geo rules per-negara"],
  },
  {
    id: "developer",
    label: "Developer",
    emoji: "⚙️",
    title: "Integrasi via REST API",
    desc: "Buat API key, POST link dari backend-mu, terima webhook HMAC saat ada klik. Cocok untuk app yang butuh link dinamis.",
    features: ["REST API v1 Bearer auth", "Webhooks signed HMAC", "CSV bulk import"],
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* ═══════════════════════════════════════════════════
            HERO — dual product showcase
           ═══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden />
          <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-16 sm:pt-24">
            <div className="flex justify-center mb-6">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-1.5 text-xs font-medium text-[color:var(--muted-foreground)] shadow-sm hover:border-[color:var(--primary)]/40 transition-colors"
              >
                <Sparkles className="h-3 w-3 text-[color:var(--primary)]" />
                Baru · A/B testing + Linky Pages + REST API
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Satu link. <br />
              <span className="gradient-text">Dua kekuatan.</span>
            </h1>

            <p className="mt-6 text-center text-lg sm:text-xl text-[color:var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed">
              Pendekkan URL dengan analitik mendalam. Bangun halaman link-in-bio yang cantik.
              <br className="hidden sm:block" /> Semuanya gratis, dalam satu dashboard.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="xl" variant="gradient" className="w-full sm:w-auto">
                <Link href="/signup">
                  Mulai gratis — 30 detik
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
                <Link href="#products">Lihat kedua produk</Link>
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-[color:var(--muted-foreground)]">
              Tanpa kartu kredit · Open-source MIT · Self-hostable
            </p>

            {/* Dual product mockup — proportional & color-balanced */}
            <div className="mt-16 relative mx-auto max-w-6xl">
              <div
                className="absolute -inset-8 bg-gradient-to-r from-brand-500/15 via-accent-500/15 to-brand-500/15 rounded-[40px] blur-3xl"
                aria-hidden
              />
              <div className="relative flex flex-col md:flex-row gap-6 items-center justify-center">
                {/* ── LAPTOP: Dashboard — natural height, content fills properly ── */}
                <div className="w-full md:flex-1 md:max-w-[560px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-[0_24px_60px_-12px_rgba(79,70,229,0.25)] overflow-hidden">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-[color:var(--border)] bg-[color:var(--muted)]/60">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                    </div>
                    <div className="ml-4 flex-1 rounded-md bg-[color:var(--background)] px-3 py-1 text-[11px] font-mono text-[color:var(--muted-foreground)] truncate border border-[color:var(--border)]">
                      {APP_HOST}/dashboard/links/promo
                    </div>
                  </div>

                  {/* Top stats row */}
                  <div className="p-5 grid gap-4 md:grid-cols-[1.4fr_1fr]">
                    <div className="space-y-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="rounded-md bg-gradient-to-r from-brand-500/10 to-accent-500/10 border border-brand-500/15 px-2.5 py-1 font-mono text-xs text-[color:var(--foreground)]">
                          {APP_HOST}/promo
                        </code>
                        <Copy className="h-3 w-3 text-[color:var(--muted-foreground)]" />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)] font-semibold">
                          Klik hari ini
                        </div>
                        <div className="mt-0.5 text-3xl font-bold tabular-nums gradient-text leading-none">8,429</div>
                        <div className="mt-1 text-xs text-[color:var(--success)] font-semibold">▲ 34% vs kemarin</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 content-start">
                      {[
                        { l: "ID", flag: "🇮🇩", v: "5.2K" },
                        { l: "US", flag: "🇺🇸", v: "1.8K" },
                        { l: "Mobile", flag: "📱", v: "73%" },
                        { l: "Organik", flag: "✨", v: "4.1K" },
                      ].map((s) => (
                        <div key={s.l} className="rounded-lg bg-[color:var(--muted)]/50 border border-[color:var(--border)] p-2">
                          <div className="text-[10px] text-[color:var(--muted-foreground)] flex items-center gap-1">
                            <span>{s.flag}</span>
                            {s.l}
                          </div>
                          <div className="text-sm font-bold tabular-nums text-[color:var(--foreground)]">{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bar chart — full width, separator above */}
                  <div className="px-5 pb-5">
                    <div className="h-16 rounded-lg bg-gradient-to-br from-brand-500/8 via-accent-500/5 to-brand-500/8 flex items-end gap-1 p-2 border border-[color:var(--border)]">
                      {[30, 45, 38, 62, 48, 75, 92, 68, 85, 70, 88, 95, 78, 90].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-brand-600 to-accent-400"
                          style={{ height: `${h}%`, opacity: 0.55 + i * 0.03 }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent links list — fills the dashboard, balances height */}
                  <div className="border-t border-[color:var(--border)] divide-y divide-[color:var(--border)]">
                    {[
                      { slug: "ramadan-promo", clicks: "4.2K", trend: "▲ 12%" },
                      { slug: "launch-2026", clicks: "2.8K", trend: "▲ 28%" },
                      { slug: "newsletter-mei", clicks: "1.9K", trend: "▼ 4%" },
                    ].map((l) => (
                      <div key={l.slug} className="flex items-center gap-3 px-5 py-2.5">
                        <div className="h-6 w-6 rounded-md bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-500/20" />
                        <code className="flex-1 font-mono text-xs text-[color:var(--foreground)] truncate">/{l.slug}</code>
                        <span className="text-xs tabular-nums text-[color:var(--foreground)] font-semibold">{l.clicks}</span>
                        <span className={`text-[10px] font-semibold ${l.trend.startsWith("▲") ? "text-[color:var(--success)]" : "text-[color:var(--danger)]"}`}>
                          {l.trend}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── PHONE: Linky Page — clean, minimal, no giant notch ── */}
                <div className="flex justify-center shrink-0">
                  <div className="w-full max-w-[500px]">
                    {/* Phone bezel — wide horizontally, height stays compact */}
                    <div className="rounded-[44px] bg-zinc-900 p-2.5 shadow-[0_30px_60px_-15px_rgba(6,182,212,0.4)] ring-1 ring-zinc-800">
                      {/* Screen */}
                      <div
                        className="rounded-[36px] relative"
                        style={{
                          background: "linear-gradient(180deg,#4F46E5 0%,#6366F1 55%,#06B6D4 100%)",
                          color: "#fff",
                        }}
                      >
                        {/* Dynamic Island */}
                        <div className="absolute left-1/2 top-2 -translate-x-1/2 h-[18px] w-[80px] rounded-full bg-zinc-950 z-10" />

                        {/* Content — BIG horizontal padding fills extra width without growing height.
                            Vertical sizes stay compact like the 290px version */}
                        <div className="px-24 pt-10 pb-6 text-center">
                          {/* Avatar — keep small */}
                          <div className="mx-auto h-16 w-16 rounded-full bg-white/95 ring-4 ring-white/30 flex items-center justify-center shadow-lg">
                            <span className="text-2xl">✨</span>
                          </div>
                          <div className="mt-2.5 font-bold text-sm text-white">@nugra</div>
                          <div className="text-[11px] text-white/85">Creator · Developer</div>

                          {/* 4 link buttons — compact vertical, narrow horizontally via px-24 */}
                          <div className="mt-5 space-y-2">
                            {[
                              { label: "YouTube", emoji: "▶️" },
                              { label: "TikTok", emoji: "🎵" },
                              { label: "Shop", emoji: "🛍️" },
                              { label: "Contact", emoji: "✉️" },
                            ].map((l) => (
                              <div
                                key={l.label}
                                className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold shadow-sm flex items-center justify-center gap-1.5"
                                style={{ color: "#18181B" }}
                              >
                                <span className="text-sm">{l.emoji}</span>
                                <span>{l.label}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-5 text-[9px] text-white/70 uppercase tracking-wider">
                            Powered by Linky
                          </div>
                          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-white/40" />
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-3 text-xs text-[color:var(--muted-foreground)] font-mono">
                      {APP_HOST}/@nugra
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            TRUST STRIP
           ═══════════════════════════════════════════════════ */}
        <section className="border-y border-[color:var(--border)] bg-[color:var(--card)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
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

        {/* ═══════════════════════════════════════════════════
            PRODUCT 1 — URL SHORTENER
           ═══════════════════════════════════════════════════ */}
        <section id="products" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--primary)] uppercase tracking-wider">
              <Link2 className="h-3 w-3" /> Produk 1
            </div>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
              URL shortener dengan <span className="gradient-text">otak.</span>
            </h2>
            <p className="mt-4 text-lg text-[color:var(--muted-foreground)]">
              Bukan sekadar pendekkan URL — setiap klik ter-track, tiap audiens ter-segment, tiap link bisa
              punya banyak nasib.
            </p>
          </div>

          <div className="mt-12 space-y-6">
            {URL_FEATURES.map((f, i) => (
              <Card key={f.title} className="overflow-hidden">
                <div className={`grid md:grid-cols-2 ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
                  <div className="p-8 sm:p-12 md:[direction:ltr]">
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-lg`}
                    >
                      <f.icon className="h-6 w-6" strokeWidth={1.75} />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs font-semibold text-[color:var(--primary)] uppercase tracking-wider">
                        {f.badge}
                      </span>
                      {f.badgeNew && (
                        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          Baru
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">{f.title}</h3>
                    <p className="mt-3 text-[color:var(--muted-foreground)] leading-relaxed">{f.desc}</p>
                    <ul className="mt-5 space-y-2">
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

        {/* ═══════════════════════════════════════════════════
            PRODUCT 2 — LINKY PAGES
           ═══════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color:var(--primary)]/5 to-transparent" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--accent)] uppercase tracking-wider">
                <Layout className="h-3 w-3" /> Produk 2
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Baru
                </span>
              </div>
              <h2 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
                Satu link. <span className="gradient-text">Semua hidupmu.</span>
              </h2>
              <p className="mt-4 text-lg text-[color:var(--muted-foreground)]">
                Linky Pages — halaman link-in-bio yang kamu bangun dalam 5 menit. Share ke bio Instagram,
                TikTok, WhatsApp status. Satu URL, banyak cerita.
              </p>
            </div>

            <div className="mt-14 grid gap-10 md:grid-cols-[1.2fr_1fr] items-center">
              {/* Left: Block types + themes */}
              <div className="space-y-8">
                <div>
                  <h3 className="font-bold text-xl mb-4">8 block type untuk disusun</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {BIO_BLOCKS.map((b) => (
                      <div
                        key={b.label}
                        className="rounded-[10px] border border-[color:var(--border)] p-3 hover:border-[color:var(--primary)]/40 transition-colors"
                      >
                        <b.icon
                          className="h-4 w-4 text-[color:var(--primary)] mb-1.5"
                          strokeWidth={1.75}
                        />
                        <div className="font-semibold text-sm">{b.label}</div>
                        <div className="text-xs text-[color:var(--muted-foreground)]">{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xl mb-4">5 theme preset siap pakai</h3>
                  <div className="flex flex-wrap gap-3">
                    {THEMES.map((t) => (
                      <div
                        key={t.name}
                        className="rounded-[12px] overflow-hidden border border-[color:var(--border)] w-28"
                      >
                        <div
                          className="aspect-[9/16] flex items-center justify-center text-sm font-bold"
                          style={{ background: t.gradient, color: t.color, border: t.border }}
                        >
                          Aa
                        </div>
                        <div className="py-1.5 text-center text-xs font-medium">{t.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Phone mockup with editor highlight */}
              <div className="relative">
                <div
                  className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-accent-500/20 rounded-3xl blur-2xl"
                  aria-hidden
                />
                <div className="relative mx-auto max-w-[260px]">
                  <div className="rounded-[36px] border-[8px] border-[color:var(--foreground)] bg-[color:var(--foreground)] overflow-hidden shadow-2xl">
                    <div className="h-5 bg-[color:var(--foreground)] flex items-center justify-center">
                      <div className="h-1 w-14 rounded-full bg-white/40" />
                    </div>
                    <div
                      className="p-5 space-y-3"
                      style={{ background: "radial-gradient(circle at top,#F472B6,#7C3AED,#0B0D17)" }}
                    >
                      <div className="text-center text-white">
                        <div className="mx-auto h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl ring-4 ring-white/30">
                          ✨
                        </div>
                        <div className="mt-2 font-bold">Aurora Creator</div>
                        <div className="text-xs opacity-75">Music · Dance · Vlog</div>
                      </div>
                      {["🎵 Single Baru — Spotify", "📺 YouTube Channel", "🛍️ Merch Store", "💌 Contact"].map(
                        (l) => (
                          <div
                            key={l}
                            className="rounded-lg bg-white/15 backdrop-blur border border-white/20 px-3 py-2.5 text-xs font-semibold text-white text-center"
                          >
                            {l}
                          </div>
                        ),
                      )}
                      <div className="pt-2 text-center text-[10px] text-white/60">Dibuat dengan Linky</div>
                    </div>
                  </div>
                  <div className="text-center mt-3 text-xs text-[color:var(--muted-foreground)] font-mono">
                    {APP_HOST}/@aurora
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" variant="gradient">
                <Link href="/signup">
                  Buat Linky Page gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/@nugra" prefetch={false} target="_blank">
                  Lihat contoh live
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            USE CASE TABS
           ═══════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Cocok untuk siapa saja</h2>
            <p className="mt-3 text-[color:var(--muted-foreground)]">
              Creator, UMKM, marketer, developer — Linky punya fitur khusus untuk masing-masing.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u) => (
              <Card key={u.id} className="hover:border-[color:var(--primary)]/40 transition-colors">
                <CardContent className="pt-6 h-full flex flex-col">
                  <div className="text-3xl">{u.emoji}</div>
                  <h3 className="mt-3 font-bold text-lg">{u.label}</h3>
                  <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">{u.title}</p>
                  <p className="mt-2 text-xs text-[color:var(--muted-foreground)] flex-1">{u.desc}</p>
                  <ul className="mt-4 space-y-1.5 text-xs">
                    {u.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <div className="h-1 w-1 rounded-full bg-[color:var(--primary)] mt-1.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            MICRO FEATURES BENTO
           ═══════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--primary)] uppercase tracking-wider">
              Semua fitur
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">Dan puluhan detil lain.</h2>
            <p className="mt-3 text-[color:var(--muted-foreground)]">
              Dirancang untuk kenyamanan — dari keamanan hingga aksesibilitas.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MICRO_FEATURES.map((f) => (
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

        {/* ═══════════════════════════════════════════════════
            DEVELOPER
           ═══════════════════════════════════════════════════ */}
        <section className="border-y border-[color:var(--border)] bg-[color:var(--card)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--accent)] uppercase tracking-wider">
                  <Code2 className="h-3 w-3" /> Developer
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Baru
                  </span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
                  Integrasi cepat dengan <span className="gradient-text">REST API.</span>
                </h2>
                <p className="mt-4 text-[color:var(--muted-foreground)]">
                  Buat API key dari dashboard, POST link dari backend-mu, terima webhook saat ada klik —
                  signed dengan HMAC-SHA256. CSV import untuk migrasi dari platform lama.
                </p>
                <div className="mt-6 grid gap-2 text-sm">
                  {[
                    { icon: Code2, text: "Endpoint RESTful dengan Bearer auth" },
                    { icon: Webhook, text: "Webhooks: link.clicked, link.created, link.deleted" },
                    { icon: FileSpreadsheet, text: "CSV bulk import hingga 10.000 baris" },
                    { icon: Zap, text: "Error code standar + cursor pagination" },
                  ].map((r) => (
                    <div key={r.text} className="flex items-center gap-2">
                      <r.icon className="h-4 w-4 text-[color:var(--primary)]" strokeWidth={1.75} />
                      {r.text}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Button asChild>
                    <Link href="/signup">Dapatkan API key</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-[16px] bg-[color:var(--foreground)] text-[color:var(--background)] p-6 font-mono text-xs overflow-x-auto shadow-xl">
                <div className="flex items-center gap-2 mb-3 text-[color:var(--muted-foreground)]">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="ml-2 text-[10px]">quickstart.sh</span>
                </div>
                <pre className="leading-relaxed">
                  <span style={{ color: "#A1A1AA" }}># 1. Daftar + bikin API key di dashboard{"\n"}</span>
                  <span style={{ color: "#A1A1AA" }}># 2. POST untuk bikin link pendek{"\n\n"}</span>
                  <span style={{ color: "#F472B6" }}>curl</span> -X POST https://{APP_HOST}/api/v1/links \{"\n"}
                  {"  "}-H <span style={{ color: "#06B6D4" }}>{'"Authorization: Bearer lnk_..."'}</span> \{"\n"}
                  {"  "}-H <span style={{ color: "#06B6D4" }}>{'"Content-Type: application/json"'}</span> \{"\n"}
                  {"  "}-d <span style={{ color: "#10B981" }}>{"'{\"destinationUrl\":\"https://..\",\"customSlug\":\"promo\"}'"}</span>
                  {"\n\n"}
                  <span style={{ color: "#A1A1AA" }}># Response:{"\n"}</span>
                  <span style={{ color: "#A1A1AA" }}>{"# { \"data\": { \"id\": \"...\", \"slug\": \"promo\", \"clickCount\": 0 } }"}</span>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            HOW IT WORKS
           ═══════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">3 langkah, siap pakai.</h2>
            <p className="mt-3 text-[color:var(--muted-foreground)]">Tanpa setup panjang. Tanpa kartu kredit.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                title: "Daftar akun",
                desc: "30 detik dengan email + kata sandi. Tidak perlu kartu, tidak ada trial.",
              },
              {
                n: "02",
                title: "Pilih produkmu",
                desc: "Bikin link pendek biasa, atau bangun Linky Page di editor drag-drop.",
              },
              {
                n: "03",
                title: "Lihat hasilnya",
                desc: "Analitik muncul real-time begitu orang klik. Ekspor CSV kapan saja.",
              },
            ].map((s) => (
              <Card key={s.n}>
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold tabular-nums gradient-text">{s.n}</div>
                  <h3 className="mt-4 font-bold text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FINAL CTA
           ═══════════════════════════════════════════════════ */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative overflow-hidden rounded-2xl p-10 sm:p-16 text-center bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 text-white shadow-2xl">
            <div className="absolute inset-0 grid-bg opacity-20" aria-hidden />
            <h2 className="relative text-3xl sm:text-4xl font-bold tracking-tight">
              Siap memulai cerita pendekmu?
            </h2>
            <p className="relative mt-4 text-white/80 max-w-xl mx-auto">
              Bikin akun 30 detik, pilih satu link atau Linky Page, lalu share ke mana saja.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="xl" className="bg-white text-brand-700 hover:bg-white/90 shadow-lg">
                <Link href="/signup">
                  Mulai gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                <Link href="/signin">Sudah punya akun</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════
            FOOTER
           ═══════════════════════════════════════════════════ */}
        <footer className="border-t border-[color:var(--border)]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid gap-6 md:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 text-xs text-[color:var(--muted-foreground)] leading-relaxed">
                URL shortener + link-in-bio gratis, open-source, untuk semua orang.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Produk</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><Link href="#products" className="hover:text-[color:var(--foreground)]">URL Shortener</Link></li>
                <li><Link href="#products" className="hover:text-[color:var(--foreground)]">Linky Pages</Link></li>
                <li><Link href="/signup" className="hover:text-[color:var(--foreground)]">QR Studio</Link></li>
                <li><Link href="/signup" className="hover:text-[color:var(--foreground)]">REST API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Akun</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li><Link href="/signin" className="hover:text-[color:var(--foreground)]">Masuk</Link></li>
                <li><Link href="/signup" className="hover:text-[color:var(--foreground)]">Daftar gratis</Link></li>
                <li><Link href="/report" className="hover:text-[color:var(--foreground)]">Lapor link abuse</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-[color:var(--muted-foreground)]">
                <li>MIT License</li>
                <li>Open source di GitHub</li>
                <li>© {new Date().getFullYear()} Nugraha Labib Mujaddid</li>
              </ul>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
