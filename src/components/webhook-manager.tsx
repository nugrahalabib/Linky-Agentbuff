"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Webhook } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const EVENTS = [
  { id: "link.clicked", label: "Link clicked" },
  { id: "link.created", label: "Link created" },
  { id: "link.deleted", label: "Link deleted" },
];

export function WebhookManager({ initial }: { initial: Webhook[] }) {
  const { push } = useToast();
  const [list, setList] = useState<Webhook[]>(initial);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<Set<string>>(new Set(["link.clicked"]));
  const [loading, setLoading] = useState(false);

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
      push({ title: "Webhook dibuat", variant: "success" });
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus webhook ini?")) return;
    const res = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    if (res.ok) setList(list.filter((w) => w.id !== id));
  };

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
        <CardDescription>Dapatkan notifikasi event via HTTP POST. Signed dengan HMAC-SHA256 header <code>X-Linky-Signature</code>.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Endpoint URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.yourapp.com/webhooks/linky" />
          </div>
          <div className="space-y-1.5">
            <Label>Events</Label>
            <div className="flex flex-wrap gap-2">
              {EVENTS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
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
          <div className="py-6 text-center text-sm text-[color:var(--muted-foreground)]">Belum ada webhook.</div>
        ) : (
          <div className="flex flex-col divide-y divide-[color:var(--border)]">
            {list.map((w) => (
              <div key={w.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{w.url}</div>
                  <div className="text-xs text-[color:var(--muted-foreground)]">
                    {Array.isArray(w.events) ? w.events.join(", ") : ""} · secret: <code>{w.secret.slice(0, 14)}...</code>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(w.id)} aria-label="Hapus webhook">
                  <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
