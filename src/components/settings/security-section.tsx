"use client";

import { useEffect, useState } from "react";
import { Laptop, LogOut, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface SessionRow {
  id: string;
  isCurrent: boolean;
  expiresAt: number | string | Date;
  createdAt: number | string | Date;
  lastSeenAt: number | string | Date | null;
  device: string;
  os: string;
  browser: string;
}

function formatTs(ts: number | string | Date | null): string {
  if (!ts) return "—";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function DeviceIcon({ device }: { device: string }) {
  if (device === "Mobile") return <Smartphone className="h-4 w-4" />;
  if (device === "Tablet") return <Tablet className="h-4 w-4" />;
  if (device === "Desktop") return <Laptop className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

export function SecuritySection() {
  const { push } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const d = await res.json();
        setSessions(d.sessions);
      }
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const changePassword = async () => {
    if (next !== confirm) {
      push({ title: "Konfirmasi tidak cocok", variant: "danger" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal ganti sandi", description: data.error, variant: "danger" });
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      push({
        title: "Kata sandi diperbarui",
        description: "Sesi lain otomatis di-logout.",
        variant: "success",
      });
      loadSessions();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm.length && !window.confirm("Logout sesi ini?")) {
      // dummy use of confirm to avoid unused var warning when modal closed
    }
    if (!window.confirm("Logout sesi ini?")) return;
    const res = await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((s) => (s ? s.filter((x) => x.id !== id) : s));
      push({ title: "Sesi di-revoke", variant: "success" });
    }
  };

  const revokeOthers = async () => {
    if (!window.confirm("Logout dari SEMUA device lain? Sesi ini tetap aktif.")) return;
    const res = await fetch("/api/auth/sessions/revoke-others", { method: "POST" });
    const d = await res.json();
    if (res.ok) {
      push({ title: `${d.revoked} sesi di-revoke`, variant: "success" });
      loadSessions();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keamanan</CardTitle>
        <CardDescription>Ubah kata sandi dan kelola sesi aktif.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Ganti kata sandi
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp">Kata sandi saat ini</Label>
            <Input id="cp" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np">Kata sandi baru</Label>
            <Input id="np" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" placeholder="Min 8 karakter" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf">Konfirmasi kata sandi baru</Label>
            <Input id="cf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          <Button onClick={changePassword} disabled={busy || !current || next.length < 8 || next !== confirm}>
            {busy ? "Menyimpan..." : "Ubah kata sandi"}
          </Button>
          <p className="text-[11px] text-[color:var(--muted-foreground)]">
            Setelah ubah, semua sesi lain akan otomatis di-logout untuk keamanan.
          </p>
        </div>

        <div className="border-t border-[color:var(--border)] pt-6 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                Sesi aktif
              </div>
              <p className="text-[11px] text-[color:var(--muted-foreground)] mt-1">
                Device yang sedang login ke akunmu.
              </p>
            </div>
            {sessions && sessions.length > 1 && (
              <Button size="sm" variant="outline" onClick={revokeOthers}>
                <LogOut className="h-3.5 w-3.5" />
                Logout semua lainnya
              </Button>
            )}
          </div>
          {loadingSessions && !sessions ? (
            <div className="py-4 text-center text-sm text-[color:var(--muted-foreground)]">Memuat...</div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="py-4 text-center text-sm text-[color:var(--muted-foreground)]">Tidak ada sesi.</div>
          ) : (
            <div className="rounded-[10px] border border-[color:var(--border)] divide-y divide-[color:var(--border)]/60">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3">
                  <div className="h-8 w-8 rounded-full bg-[color:var(--muted)] flex items-center justify-center shrink-0">
                    <DeviceIcon device={s.device} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {s.browser} · {s.os}
                      {s.isCurrent && (
                        <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                          AKTIF SEKARANG
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[color:var(--muted-foreground)]">
                      {s.device} · last seen {formatTs(s.lastSeenAt)} · expires {formatTs(s.expiresAt)}
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <Button size="sm" variant="ghost" onClick={() => revoke(s.id)}>
                      Logout
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
