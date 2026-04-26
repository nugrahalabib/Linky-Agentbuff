"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Send, ChevronDown, ChevronUp, Power } from "lucide-react";
import type { Webhook } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const EVENTS = [
  { id: "link.clicked", label: "link.clicked" },
  { id: "link.created", label: "link.created" },
  { id: "link.updated", label: "link.updated" },
  { id: "link.deleted", label: "link.deleted" },
];

interface DeliveryRow {
  id: string;
  event: string;
  statusCode: number | null;
  success: boolean;
  durationMs: number | null;
  error: string | null;
  responseSnippet: string | null;
  ts: number | string | Date;
}

function formatTs(ts: number | string | Date): string {
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "medium" });
}

function statusBadge(d: DeliveryRow): { color: string; label: string } {
  if (d.success) return { color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", label: String(d.statusCode ?? 200) };
  if (d.statusCode != null) return { color: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: String(d.statusCode) };
  return { color: "bg-rose-500/15 text-rose-600 dark:text-rose-400", label: "ERR" };
}

function StatusPill({ w }: { w: Webhook }) {
  if (!w.active) return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">paused</span>;
  if (w.failureCount > 3) return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400">failing ({w.failureCount})</span>;
  if (w.lastStatusCode == null) return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">no events yet</span>;
  if (w.lastStatusCode >= 200 && w.lastStatusCode < 300) return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">healthy</span>;
  return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">degraded</span>;
}

export function WebhookManager({ initial }: { initial: Webhook[] }) {
  const { push } = useToast();
  const [list, setList] = useState<Webhook[]>(initial);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<Set<string>>(new Set(["link.clicked"]));
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<Record<string, boolean>>({});
  const [deliveries, setDeliveries] = useState<Record<string, DeliveryRow[]>>({});
  const [loadingDeliveries, setLoadingDeliveries] = useState<Record<string, boolean>>({});

  const create = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: [...events] }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      setList([data.webhook, ...list]);
      setUrl("");
      setExpanded(data.webhook.id);
      setRevealedSecret((s) => ({ ...s, [data.webhook.id]: true }));
      push({ title: "Webhook dibuat", description: "Klik 'Kirim test event' untuk verifikasi.", variant: "success" });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus webhook ini?")) return;
    const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList(list.filter((w) => w.id !== id));
      push({ title: "Webhook dihapus", variant: "success" });
    }
  };

  const toggleActive = async (w: Webhook) => {
    const res = await fetch(`/api/webhooks/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !w.active }),
    });
    if (res.ok) {
      const d = await res.json();
      setList(list.map((x) => (x.id === w.id ? d.webhook : x)));
    }
  };

  const sendTest = async (id: string) => {
    const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      push({ title: "Test event dikirim", description: data.message, variant: "success" });
      setTimeout(() => loadDeliveries(id), 1500);
    } else {
      push({ title: "Gagal", description: data.error, variant: "danger" });
    }
  };

  const loadDeliveries = async (id: string) => {
    setLoadingDeliveries((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(`/api/webhooks/${id}/deliveries`);
      if (res.ok) {
        const d = await res.json();
        setDeliveries((s) => ({ ...s, [id]: d.deliveries }));
      }
    } finally {
      setLoadingDeliveries((s) => ({ ...s, [id]: false }));
    }
  };

  useEffect(() => {
    if (expanded && !deliveries[expanded]) loadDeliveries(expanded);
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (ev: string) => {
    const next = new Set(events);
    if (next.has(ev)) next.delete(ev);
    else next.add(ev);
    setEvents(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
        <CardDescription>
          Linky akan POST event ke endpoint kamu. Setiap request signed dengan HMAC-SHA256 di header{" "}
          <code>X-Linky-Signature</code>. Lihat{" "}
          <a className="text-[color:var(--primary)] hover:underline" href="/docs/api#webhooks" target="_blank">
            cara verifikasi
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-[10px] border border-[color:var(--border)]/60 p-4 bg-[color:var(--muted)]/20">
          <div className="space-y-1.5">
            <Label>Endpoint URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.aplikasimu.com/webhooks/linky"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Events</Label>
            <div className="flex flex-wrap gap-2">
              {EVENTS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-mono ${
                    events.has(e.id)
                      ? "bg-[color:var(--primary)] text-white border-[color:var(--primary)]"
                      : "border-[color:var(--border)]"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={create} disabled={loading || !url || events.size === 0}>
            <Plus className="h-4 w-4" /> Buat webhook
          </Button>
        </div>

        {list.length === 0 ? (
          <div className="py-8 text-center text-sm text-[color:var(--muted-foreground)]">
            Belum ada webhook. Buat satu untuk mulai menerima event.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((w) => {
              const isOpen = expanded === w.id;
              const list2 = deliveries[w.id];
              return (
                <div key={w.id} className="rounded-[10px] border border-[color:var(--border)] overflow-hidden">
                  <div className="flex items-start gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="font-mono text-sm truncate">{w.url}</code>
                        <StatusPill w={w} />
                      </div>
                      <div className="mt-1 text-[11px] text-[color:var(--muted-foreground)] flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>events: {Array.isArray(w.events) ? w.events.join(", ") : ""}</span>
                        {w.lastDeliveryAt && <span>last: {formatTs(w.lastDeliveryAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => sendTest(w.id)} aria-label="Kirim test event" title="Kirim test event">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => toggleActive(w)} aria-label={w.active ? "Pause" : "Resume"} title={w.active ? "Pause webhook" : "Aktifkan"}>
                        <Power className={`h-4 w-4 ${w.active ? "" : "text-[color:var(--muted-foreground)]"}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setExpanded(isOpen ? null : w.id)}
                        aria-label="Detail"
                      >
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(w.id)} aria-label="Hapus webhook">
                        <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-[color:var(--border)]/60 p-3 space-y-3 bg-[color:var(--muted)]/20">
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                          Signing secret
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-xs bg-[color:var(--background)] p-2 rounded truncate">
                            {revealedSecret[w.id] ? w.secret : `${w.secret.slice(0, 14)}...`}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRevealedSecret((s) => ({ ...s, [w.id]: !s[w.id] }))}
                          >
                            {revealedSecret[w.id] ? "Tutup" : "Lihat"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(w.secret)}
                          >
                            Salin
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                            Pengiriman terakhir (50)
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => loadDeliveries(w.id)}>
                            Refresh
                          </Button>
                        </div>
                        {loadingDeliveries[w.id] && !list2 ? (
                          <div className="py-4 text-center text-xs text-[color:var(--muted-foreground)]">Memuat...</div>
                        ) : !list2 || list2.length === 0 ? (
                          <div className="py-4 text-center text-xs text-[color:var(--muted-foreground)]">
                            Belum ada delivery. Klik tombol <Send className="inline h-3 w-3" /> untuk kirim test.
                          </div>
                        ) : (
                          <div className="rounded-[8px] border border-[color:var(--border)]/60 overflow-hidden bg-[color:var(--background)]">
                            <div className="grid grid-cols-[80px_120px_1fr_80px] text-[10px] uppercase tracking-wider font-semibold text-[color:var(--muted-foreground)] px-3 py-1.5 border-b border-[color:var(--border)]/60 bg-[color:var(--muted)]/40">
                              <span>Status</span>
                              <span>Event</span>
                              <span>Waktu</span>
                              <span className="text-right">Durasi</span>
                            </div>
                            <div className="max-h-72 overflow-y-auto divide-y divide-[color:var(--border)]/40">
                              {list2.map((d) => {
                                const b = statusBadge(d);
                                return (
                                  <details key={d.id} className="">
                                    <summary className="grid grid-cols-[80px_120px_1fr_80px] items-center px-3 py-1.5 text-xs cursor-pointer hover:bg-[color:var(--muted)]/30">
                                      <span>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${b.color}`}>{b.label}</span>
                                      </span>
                                      <span className="font-mono truncate">{d.event}</span>
                                      <span className="text-[color:var(--muted-foreground)]">{formatTs(d.ts)}</span>
                                      <span className="text-right text-[color:var(--muted-foreground)]">
                                        {d.durationMs != null ? `${d.durationMs}ms` : "-"}
                                      </span>
                                    </summary>
                                    <div className="px-3 pb-3 pt-1 text-[11px] font-mono space-y-1 bg-[color:var(--muted)]/30">
                                      {d.error && (
                                        <div className="text-rose-600 dark:text-rose-400">
                                          <strong>Error:</strong> {d.error}
                                        </div>
                                      )}
                                      {d.responseSnippet && (
                                        <details>
                                          <summary className="cursor-pointer text-[color:var(--muted-foreground)]">
                                            Response body ({d.responseSnippet.length} char)
                                          </summary>
                                          <pre className="mt-1 p-2 rounded bg-[color:var(--background)] overflow-x-auto">
                                            {d.responseSnippet}
                                          </pre>
                                        </details>
                                      )}
                                    </div>
                                  </details>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
