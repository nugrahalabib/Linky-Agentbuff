"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

type Shape = "square" | "rounded" | "dots";

const PRESETS = [
  { name: "Minimal", fg: "#18181B", bg: "#FFFFFF", shape: "square" as Shape, gradFrom: "", gradTo: "" },
  { name: "Linky Gradient", fg: "#18181B", bg: "#FFFFFF", shape: "rounded" as Shape, gradFrom: "#4F46E5", gradTo: "#06B6D4" },
  { name: "Playful Dots", fg: "#4F46E5", bg: "#FFFFFF", shape: "dots" as Shape, gradFrom: "", gradTo: "" },
  { name: "Neon", fg: "#F472B6", bg: "#0B0D17", shape: "rounded" as Shape, gradFrom: "#F472B6", gradTo: "#06B6D4" },
  { name: "Sunset", fg: "#EF4444", bg: "#FFFFFF", shape: "rounded" as Shape, gradFrom: "#F59E0B", gradTo: "#EF4444" },
];

export function QrStudio({ text: initialText }: { text: string }) {
  const [text, setText] = useState(initialText);
  const [fg, setFg] = useState("#18181B");
  const [bg, setBg] = useState("#FFFFFF");
  const [size, setSize] = useState(640);
  const [shape, setShape] = useState<Shape>("square");
  const [gradFrom, setGradFrom] = useState("");
  const [gradTo, setGradTo] = useState("");
  const [frameText, setFrameText] = useState("");
  const [logoData, setLogoData] = useState<string>("");
  const { push } = useToast();

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const svgUrl = useMemo(() => {
    const p = new URLSearchParams({ text, fg, bg, size: String(size), format: "svg", shape });
    if (gradFrom) p.set("gradFrom", gradFrom);
    if (gradTo) p.set("gradTo", gradTo);
    if (frameText) p.set("frameText", frameText);
    return `/api/qr?${p.toString()}`;
  }, [text, fg, bg, size, shape, gradFrom, gradTo, frameText]);

  const pngUrl = useMemo(() => {
    const p = new URLSearchParams({ text, fg, bg, size: String(size), format: "png" });
    return `/api/qr?${p.toString()}`;
  }, [text, fg, bg, size]);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setFg(p.fg);
    setBg(p.bg);
    setShape(p.shape);
    setGradFrom(p.gradFrom);
    setGradTo(p.gradTo);
  };

  const onLogoFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 512 * 1024) {
      push({ title: "Logo terlalu besar", description: "Max 512KB", variant: "danger" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoData(String(reader.result ?? ""));
    };
    reader.readAsDataURL(f);
  };

  // Build SVG client-side for preview that can include logo data URI (URL would be too long)
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  useEffect(() => {
    if (!logoData) {
      setPreviewSvg(null);
      return;
    }
    // POST-like: fetch with body via data URI too long; use a small inline API
    const params = new URLSearchParams({ text, fg, bg, size: String(size), format: "svg", shape });
    if (gradFrom) params.set("gradFrom", gradFrom);
    if (gradTo) params.set("gradTo", gradTo);
    if (frameText) params.set("frameText", frameText);
    // Use POST to api/qr-branded for logo embed
    fetch("/api/qr-branded", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fg, bg, size, shape, gradFrom, gradTo, frameText, logoDataUrl: logoData }),
    })
      .then((r) => r.text())
      .then((svg) => setPreviewSvg(svg))
      .catch(() => setPreviewSvg(null));
  }, [text, fg, bg, size, shape, gradFrom, gradTo, frameText, logoData]);

  const downloadBranded = async (format: "svg" | "png") => {
    const res = await fetch("/api/qr-branded", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fg, bg, size, shape, gradFrom, gradTo, frameText, logoDataUrl: logoData, format }),
    });
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `linky-qr.${format}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasBranding = logoData || gradFrom || shape !== "square";

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="rounded-[16px] border border-[color:var(--border)] p-6 flex items-center justify-center bg-[color:var(--muted)]/30 min-h-[360px]">
        <div className="rounded-[12px] overflow-hidden shadow-sm" style={{ background: bg }}>
          {logoData && previewSvg ? (
            <div
              dangerouslySetInnerHTML={{ __html: previewSvg }}
              style={{ width: Math.min(size, 360), height: "auto" }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={svgUrl}
              alt="QR preview"
              width={Math.min(size, 360)}
              height={Math.min(size, 360)}
              className="block"
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Preset
          </Label>
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <Button key={p.name} size="sm" variant="outline" onClick={() => applyPreset(p)} type="button">
                <Sparkles className="h-3 w-3" /> {p.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="qr-text">Teks / URL</Label>
          <Input id="qr-text" value={text} onChange={(e) => setText(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>FG</Label>
            <input
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-[color:var(--border)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>BG</Label>
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-[color:var(--border)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Gradient dari</Label>
            <input
              type="color"
              value={gradFrom || "#4F46E5"}
              onChange={(e) => setGradFrom(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-[color:var(--border)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Gradient ke</Label>
            <input
              type="color"
              value={gradTo || "#06B6D4"}
              onChange={(e) => setGradTo(e.target.value)}
              className="h-9 w-full rounded-[8px] border border-[color:var(--border)]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Bentuk modul</Label>
          <div className="flex gap-1">
            {(["square", "rounded", "dots"] as Shape[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={shape === s ? "primary" : "outline"}
                onClick={() => setShape(s)}
                type="button"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Logo di tengah (opsional)</Label>
          <label className="flex items-center gap-2 rounded-[8px] border border-[color:var(--border)] px-3 py-2 cursor-pointer hover:bg-[color:var(--muted)]">
            <Upload className="h-4 w-4" />
            <span className="text-sm">{logoData ? "Ganti logo" : "Upload PNG/SVG (max 512KB)"}</span>
            <input
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {logoData && (
            <button
              onClick={() => setLogoData("")}
              className="text-xs text-[color:var(--danger)] hover:underline"
              type="button"
            >
              Hapus logo
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Teks frame (opsional)</Label>
          <Input
            value={frameText}
            onChange={(e) => setFrameText(e.target.value)}
            maxLength={40}
            placeholder="SCAN UNTUK PROMO"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Ukuran ({size}px)</Label>
          <input
            type="range"
            min={256}
            max={2048}
            step={64}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-[color:var(--primary)]"
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {hasBranding ? (
            <>
              <Button onClick={() => downloadBranded("svg")} variant="gradient" type="button">
                <Download className="h-4 w-4" /> Unduh SVG
              </Button>
              <Button onClick={() => downloadBranded("png")} variant="outline" type="button">
                <Download className="h-4 w-4" /> Unduh PNG
              </Button>
            </>
          ) : (
            <>
              <Button asChild>
                <a href={pngUrl} download={`linky-qr.png`}>
                  <Download className="h-4 w-4" /> Unduh PNG
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={svgUrl} download={`linky-qr.svg`}>
                  <Download className="h-4 w-4" /> Unduh SVG
                </a>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
