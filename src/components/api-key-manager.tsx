"use client";

import { useState } from "react";
import { Copy, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type KeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | number | null;
  expiresAt: Date | number | null;
  createdAt: Date | number;
};

export function ApiKeyManager({ initial }: { initial: KeyRow[] }) {
  const { push } = useToast();
  const [keys, setKeys] = useState<KeyRow[]>(initial);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      setKeys([
        { id: data.key.id, name: data.key.name, keyPrefix: data.key.prefix, lastUsedAt: null, expiresAt: data.key.expiresAt, createdAt: Date.now() },
        ...keys,
      ]);
      setNewToken(data.key.token);
      setName("");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Revoke API key ini permanen?")) return;
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys(keys.filter((k) => k.id !== id));
      push({ title: "Key di-revoke", variant: "success" });
    }
  };

  const copy = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>Buat key untuk akses REST API. Simpan aman — key penuh hanya ditampilkan sekali.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="keyname" className="sr-only">
              Nama key
            </Label>
            <Input id="keyname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama key (mis: Production)" />
          </div>
          <Button onClick={create} disabled={loading || !name.trim()}>
            <Plus className="h-4 w-4" /> Buat
          </Button>
        </div>

        {newToken && (
          <div className="rounded-[10px] border-2 border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4">
            <div className="text-xs font-semibold text-[color:var(--primary)] mb-2">
              Key baru — salin sekarang, tidak akan ditampilkan lagi:
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-[color:var(--background)] p-2 rounded truncate">{newToken}</code>
              <Button onClick={copy} size="sm" variant={copied ? "secondary" : "primary"}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Tersalin" : "Salin"}
              </Button>
            </div>
          </div>
        )}

        {keys.length === 0 ? (
          <div className="py-6 text-center text-sm text-[color:var(--muted-foreground)]">Belum ada API key.</div>
        ) : (
          <div className="flex flex-col divide-y divide-[color:var(--border)]">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{k.name}</div>
                  <div className="text-xs font-mono text-[color:var(--muted-foreground)]">{k.keyPrefix}...</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(k.id)} aria-label="Hapus key">
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
