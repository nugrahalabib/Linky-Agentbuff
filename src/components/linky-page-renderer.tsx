"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { LinkyPageBlock, LinkyPageTheme } from "@/lib/db/schema";

const PRESETS: Record<string, { bg: string; cardBg: string; text: string; mutedText: string }> = {
  creator: {
    bg: "linear-gradient(180deg, #4F46E5 0%, #06B6D4 100%)",
    cardBg: "rgba(255,255,255,0.95)",
    text: "#18181B",
    mutedText: "#525252",
  },
  minimal: {
    bg: "#FAFAFA",
    cardBg: "#ffffff",
    text: "#18181B",
    mutedText: "#71717A",
  },
  neon: {
    bg: "radial-gradient(circle at top, #F472B6 0%, #7C3AED 50%, #0B0D17 100%)",
    cardBg: "rgba(24,24,27,0.8)",
    text: "#FAFAFA",
    mutedText: "#A1A1AA",
  },
  student: {
    bg: "#FEF3C7",
    cardBg: "#ffffff",
    text: "#18181B",
    mutedText: "#525252",
  },
  umkm: {
    bg: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
    cardBg: "#ffffff",
    text: "#18181B",
    mutedText: "#525252",
  },
};

export function LinkyPageRenderer({
  pageId,
  title,
  bio,
  avatarUrl,
  theme,
  background,
  blocks,
}: {
  pageId: string;
  title: string;
  bio?: string | null;
  avatarUrl?: string | null;
  theme: LinkyPageTheme;
  background?: string | null;
  blocks: LinkyPageBlock[];
}) {
  useEffect(() => {
    fetch(`/api/linky-pages/${pageId}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ view: true }),
    }).catch(() => undefined);
  }, [pageId]);

  const preset = PRESETS[theme.preset ?? "creator"] ?? PRESETS.creator;
  const primary = theme.primary ?? "#4F46E5";
  const buttonStyle = theme.buttonStyle ?? "filled";
  const bg = background ?? preset.bg;

  const trackClick = (blockId: string) => {
    fetch(`/api/linky-pages/${pageId}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId }),
    }).catch(() => undefined);
  };

  const btnBase =
    "block w-full text-center rounded-[12px] px-5 py-3.5 font-semibold transition-all active:scale-[0.98]";
  const btnStyle: Record<string, React.CSSProperties> = {
    filled: { background: primary, color: "#fff" },
    outline: { background: "transparent", color: preset.text, border: `2px solid ${primary}` },
    soft: { background: `${primary}20`, color: preset.text },
    glass: {
      background: "rgba(255,255,255,0.15)",
      color: preset.text,
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.2)",
    },
  };

  return (
    <main
      style={{ background: bg, color: preset.text, fontFamily: "var(--font-sans)" }}
      className="min-h-screen py-10 px-4"
    >
      <div className="max-w-lg mx-auto space-y-4">
        {blocks.map((block) => {
          if (block.kind === "header") {
            return (
              <div key={block.id} className="text-center pb-2">
                {avatarUrl && (
                  <div className="mx-auto h-24 w-24 rounded-full overflow-hidden ring-4 ring-white/40 mb-3">
                    <Image src={avatarUrl} alt={title} width={96} height={96} className="object-cover h-full w-full" unoptimized />
                  </div>
                )}
                <h1 className="text-2xl font-bold">{title}</h1>
                {bio && <p className="mt-2 text-sm opacity-80 max-w-sm mx-auto" style={{ color: preset.mutedText }}>{bio}</p>}
              </div>
            );
          }
          if (block.kind === "link") {
            const d = block.data as { label?: string; url?: string; emoji?: string };
            if (!d.url) return null;
            return (
              <a
                key={block.id}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(block.id)}
                className={btnBase}
                style={btnStyle[buttonStyle]}
              >
                {d.emoji && <span className="mr-2">{d.emoji}</span>}
                {d.label ?? d.url}
              </a>
            );
          }
          if (block.kind === "social") {
            const d = block.data as { items?: Array<{ platform: string; handle: string; url?: string }> };
            const items = d.items ?? [];
            return (
              <div key={block.id} className="flex justify-center gap-3 py-2">
                {items.map((s, i) => (
                  <a
                    key={i}
                    href={s.url ?? `https://${s.platform}.com/${s.handle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(block.id)}
                    className="h-11 w-11 rounded-full flex items-center justify-center text-xs font-semibold uppercase"
                    style={{ background: preset.cardBg, color: preset.text }}
                    title={`${s.platform}: ${s.handle}`}
                  >
                    {s.platform.slice(0, 2)}
                  </a>
                ))}
              </div>
            );
          }
          if (block.kind === "text") {
            const d = block.data as { content?: string };
            return (
              <p key={block.id} className="text-center text-sm py-2" style={{ color: preset.mutedText }}>
                {d.content}
              </p>
            );
          }
          if (block.kind === "divider") {
            return <hr key={block.id} className="opacity-30 my-2" />;
          }
          if (block.kind === "youtube") {
            const d = block.data as { videoId?: string };
            if (!d.videoId) return null;
            return (
              <div key={block.id} className="rounded-[12px] overflow-hidden aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${d.videoId}`}
                  title="YouTube embed"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            );
          }
          if (block.kind === "image") {
            const d = block.data as { url?: string; caption?: string };
            if (!d.url) return null;
            return (
              <div key={block.id} className="rounded-[12px] overflow-hidden">
                <Image src={d.url} alt={d.caption ?? ""} width={600} height={400} unoptimized className="w-full h-auto" />
              </div>
            );
          }
          if (block.kind === "countdown") {
            const d = block.data as { target?: string; label?: string };
            return (
              <Countdown key={block.id} target={d.target} label={d.label} color={preset.text} bg={preset.cardBg} />
            );
          }
          return null;
        })}

        <div className="pt-6 text-center text-xs opacity-60">
          Dibuat dengan{" "}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" rel="noopener" className="underline font-semibold" target="_top">
            Linky
          </a>
        </div>
      </div>
    </main>
  );
}

function Countdown({ target, label, color, bg }: { target?: string; label?: string; color: string; bg: string }) {
  if (!target) return null;
  const t = new Date(target).getTime();
  const diff = Math.max(0, t - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return (
    <div className="rounded-[12px] p-4 text-center" style={{ background: bg, color }}>
      {label && <div className="text-xs font-semibold uppercase tracking-wider opacity-75">{label}</div>}
      <div className="mt-2 text-2xl font-bold tabular-nums">
        {days}h · {hours}j · {mins}m
      </div>
    </div>
  );
}
