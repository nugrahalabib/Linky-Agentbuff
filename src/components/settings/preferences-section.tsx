"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type Theme = "light" | "dark" | "system";
type Density = "compact" | "comfortable";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "system") {
    root.removeAttribute("data-theme");
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", dark);
  } else {
    root.setAttribute("data-theme", t);
    root.classList.toggle("dark", t === "dark");
  }
}

export function PreferencesSection() {
  const [theme, setTheme] = useState<Theme>("system");
  const [density, setDensity] = useState<Density>("comfortable");

  useEffect(() => {
    const t = (localStorage.getItem("linky_theme") as Theme | null) ?? "system";
    const d = (localStorage.getItem("linky_density") as Density | null) ?? "comfortable";
    setTheme(t);
    setDensity(d);
    applyTheme(t);
    document.documentElement.setAttribute("data-density", d);
  }, []);

  const onTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem("linky_theme", t);
    applyTheme(t);
  };
  const onDensity = (d: Density) => {
    setDensity(d);
    localStorage.setItem("linky_density", d);
    document.documentElement.setAttribute("data-density", d);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tampilan</CardTitle>
        <CardDescription>Tema dan kepadatan UI. Disimpan di browser kamu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Tema</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light" as const, label: "Terang", icon: Sun },
              { id: "dark" as const, label: "Gelap", icon: Moon },
              { id: "system" as const, label: "Ikuti sistem", icon: Monitor },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onTheme(opt.id)}
                className={`flex flex-col items-center gap-1.5 rounded-[10px] border p-3 text-xs font-medium transition ${
                  theme === opt.id
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5 text-[color:var(--primary)]"
                    : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                }`}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Kepadatan</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "comfortable" as const, label: "Nyaman", desc: "Spacing default" },
              { id: "compact" as const, label: "Padat", desc: "Lebih banyak data per layar" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => onDensity(opt.id)}
                className={`flex flex-col items-start gap-0.5 rounded-[10px] border p-3 text-left transition ${
                  density === opt.id
                    ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5"
                    : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
                }`}
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-[11px] text-[color:var(--muted-foreground)]">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
