import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: {
    default: "Linky — Setiap klik jadi cerita.",
    template: "%s · Linky",
  },
  description:
    "Link pendek yang mengerti audiensmu — analitik real-time, QR branded, targeting cerdas, dan keamanan tingkat enterprise.",
  applicationName: "Linky",
  authors: [{ name: "Nugraha Labib Mujaddid" }],
  keywords: ["url shortener", "linky", "qr code", "analytics", "link management", "agentbuff"],
  openGraph: {
    title: "Linky — Setiap klik jadi cerita.",
    description: "Link pendek yang mengerti audiensmu.",
    type: "website",
    siteName: "Linky",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)] antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
