"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QrStudio({ text: initialText }: { text: string }) {
  const [text, setText] = useState(initialText);
  const [fg, setFg] = useState("#18181B");
  const [bg, setBg] = useState("#FFFFFF");
  const [size, setSize] = useState(512);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const svgSrc = useMemo(() => {
    const params = new URLSearchParams({
      text,
      fg,
      bg,
      size: String(size),
      format: "svg",
    });
    return `/api/qr?${params.toString()}`;
  }, [text, fg, bg, size]);

  const pngHref = useMemo(() => {
    const params = new URLSearchParams({ text, fg, bg, size: String(size), format: "png" });
    return `/api/qr?${params.toString()}`;
  }, [text, fg, bg, size]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_280px]">
      <div className="rounded-[16px] border border-[color:var(--border)] p-6 flex items-center justify-center bg-[color:var(--muted)]/30">
        <div className="rounded-[12px] overflow-hidden shadow-sm" style={{ background: bg }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={svgSrc}
            alt="QR code preview"
            width={Math.min(size, 360)}
            height={Math.min(size, 360)}
            className="block"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="qr-text">Teks / URL</Label>
          <Input id="qr-text" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-fg">Warna gambar</Label>
          <div className="flex items-center gap-2">
            <input
              id="qr-fg"
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="h-10 w-12 rounded-[10px] border border-[color:var(--border)] cursor-pointer"
              aria-label="Warna gambar QR"
            />
            <Input value={fg} onChange={(e) => setFg(e.target.value)} maxLength={7} className="font-mono" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-bg">Warna latar</Label>
          <div className="flex items-center gap-2">
            <input
              id="qr-bg"
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="h-10 w-12 rounded-[10px] border border-[color:var(--border)] cursor-pointer"
              aria-label="Warna latar QR"
            />
            <Input value={bg} onChange={(e) => setBg(e.target.value)} maxLength={7} className="font-mono" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qr-size">Ukuran ({size}px)</Label>
          <input
            id="qr-size"
            type="range"
            min={256}
            max={2048}
            step={64}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full accent-[color:var(--primary)]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild>
            <a href={pngHref} download={`linky-qr.png`}>
              <Download className="h-4 w-4" />
              Unduh PNG
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={svgSrc} download={`linky-qr.svg`}>
              <Download className="h-4 w-4" />
              Unduh SVG
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
