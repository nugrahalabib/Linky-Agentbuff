"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Globe, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { CopyButton } from "@/components/copy-button";

interface DomainRow {
  id: string;
  hostname: string;
  verified: boolean;
  sslStatus: string;
  verificationToken: string | null;
}

export function DomainManager({ initial, appHost }: { initial: DomainRow[]; appHost: string }) {
  const { push } = useToast();
  const [list, setList] = useState<DomainRow[]>(initial);
  const [hostname, setHostname] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adding || !hostname.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: hostname.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: d.error, variant: "danger" });
        return;
      }
      setList((prev) => [d.domain, ...prev]);
      setHostname("");
      push({ title: "Domain ditambahkan", description: "Verifikasi kepemilikan via DNS.", variant: "success" });
    } finally {
      setAdding(false);
    }
  };

  const verify = async (id: string) => {
    setVerifying(id);
    try {
      const res = await fetch(`/api/domains/${id}/verify`, { method: "POST" });
      const d = await res.json();
      if (d.verified) {
        setList((prev) => prev.map((x) => (x.id === id ? { ...x, verified: true, sslStatus: "active" } : x)));
        push({ title: "Domain terverifikasi! 🎉", variant: "success" });
      } else {
        push({ title: "Belum terverifikasi", description: d.error, variant: "danger" });
      }
    } finally {
      setVerifying(null);
    }
  };

  const remove = async (id: string, host: string) => {
    if (!window.confirm(`Hapus domain ${host}? Link yang pakai domain ini kembali ke domain default.`)) return;
    const res = await fetch(`/api/domains/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList((prev) => prev.filter((x) => x.id !== id));
      push({ title: "Domain dihapus", variant: "success" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[color:var(--primary)]" /> Custom domain
          </CardTitle>
          <CardDescription>
            Pakai domain sendiri (mis. <code>go.brandmu.com</code>) untuk link pendekmu. Tambahkan, verifikasi via DNS,
            lalu pilih domain itu saat membuat link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="host" className="sr-only">Hostname</Label>
              <Input
                id="host"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="go.brandmu.com"
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={adding || !hostname.trim()}>
              <Plus className="h-4 w-4" /> Tambah domain
            </Button>
          </form>
        </CardContent>
      </Card>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[color:var(--muted-foreground)]">
            Belum ada custom domain.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((d) => (
            <Card key={d.id}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-medium truncate">{d.hostname}</span>
                    {d.verified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" /> Menunggu verifikasi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!d.verified && (
                      <Button size="sm" variant="outline" onClick={() => verify(d.id)} disabled={verifying === d.id}>
                        <RefreshCw className={`h-3.5 w-3.5 ${verifying === d.id ? "animate-spin" : ""}`} />
                        Cek verifikasi
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(d.id, d.hostname)} aria-label="Hapus">
                      <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                    </Button>
                  </div>
                </div>

                {!d.verified && (
                  <div className="rounded-[10px] border border-[color:var(--border)] bg-[color:var(--muted)]/40 p-3 space-y-3 text-sm">
                    <p className="text-[color:var(--muted-foreground)]">
                      Tambahkan 2 record DNS ini di penyedia domainmu, lalu klik <strong>Cek verifikasi</strong>:
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">
                          1. TXT (verifikasi kepemilikan)
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs bg-[color:var(--background)] rounded p-2 overflow-x-auto">
                          <span className="shrink-0">TXT</span>
                          <span className="text-[color:var(--muted-foreground)]">_linky-verify.{d.hostname}</span>
                          <span className="truncate">{d.verificationToken}</span>
                          {d.verificationToken && <CopyButton value={d.verificationToken} />}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">
                          2. CNAME (arahkan trafik ke Linky)
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs bg-[color:var(--background)] rounded p-2 overflow-x-auto">
                          <span className="shrink-0">CNAME</span>
                          <span className="text-[color:var(--muted-foreground)]">{d.hostname}</span>
                          <span className="truncate">{appHost}</span>
                          <CopyButton value={appHost} />
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[color:var(--muted-foreground)]">
                      Propagasi DNS bisa makan beberapa menit. TLS otomatis di-issue oleh server (Caddy) setelah CNAME aktif.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
