"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ENDPOINTS: Array<{
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  hasBody?: boolean;
  defaultBody?: string;
  needsId?: boolean;
}> = [
  { id: "me", method: "GET", path: "/api/v1/me" },
  { id: "list", method: "GET", path: "/api/v1/links?limit=10" },
  {
    id: "create",
    method: "POST",
    path: "/api/v1/links",
    hasBody: true,
    defaultBody: JSON.stringify({ destinationUrl: "https://example.com", customSlug: "test-" + Date.now().toString(36) }, null, 2),
  },
  { id: "get", method: "GET", path: "/api/v1/links/{id}", needsId: true },
  {
    id: "update",
    method: "PATCH",
    path: "/api/v1/links/{id}",
    needsId: true,
    hasBody: true,
    defaultBody: JSON.stringify({ title: "Updated via test console" }, null, 2),
  },
  { id: "delete", method: "DELETE", path: "/api/v1/links/{id}", needsId: true },
  { id: "stats", method: "GET", path: "/api/v1/analytics/workspace?days=30" },
];

export function ApiTestConsole({ baseUrl }: { baseUrl: string }) {
  const [token, setToken] = useState("");
  const [endpoint, setEndpoint] = useState(ENDPOINTS[0]);
  const [body, setBody] = useState(endpoint.defaultBody ?? "");
  const [linkId, setLinkId] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{
    status: number;
    durationMs: number;
    body: string;
    headers: Array<[string, string]>;
  } | null>(null);

  const onPick = (id: string) => {
    const ep = ENDPOINTS.find((e) => e.id === id);
    if (!ep) return;
    setEndpoint(ep);
    setBody(ep.defaultBody ?? "");
    setResult(null);
  };

  const run = async () => {
    if (!token.trim()) {
      setResult({
        status: 0,
        durationMs: 0,
        body: 'Isi API key dulu — boleh paste dari tab "API Keys".',
        headers: [],
      });
      return;
    }
    let path = endpoint.path;
    if (endpoint.needsId) {
      if (!linkId.trim()) {
        setResult({ status: 0, durationMs: 0, body: "Endpoint ini butuh link id. Salin dari tab Links.", headers: [] });
        return;
      }
      path = path.replace("{id}", encodeURIComponent(linkId.trim()));
    }
    setRunning(true);
    const startedAt = performance.now();
    try {
      const init: RequestInit = {
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          ...(endpoint.hasBody ? { "Content-Type": "application/json" } : {}),
        },
      };
      if (endpoint.hasBody) init.body = body;
      const res = await fetch(`${baseUrl}${path}`, init);
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw */
      }
      const headers: Array<[string, string]> = [];
      res.headers.forEach((v, k) => headers.push([k, v]));
      setResult({
        status: res.status,
        durationMs: Math.round(performance.now() - startedAt),
        body: pretty,
        headers,
      });
    } catch (e) {
      setResult({
        status: 0,
        durationMs: Math.round(performance.now() - startedAt),
        body: String((e as Error).message ?? e),
        headers: [],
      });
    } finally {
      setRunning(false);
    }
  };

  const statusColor =
    !result || result.status === 0
      ? "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]"
      : result.status >= 200 && result.status < 300
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : result.status >= 400 && result.status < 500
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test console</CardTitle>
        <CardDescription>Coba endpoint API langsung di sini. Request dijalankan dari browser kamu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="apitoken">API key</Label>
          <Input
            id="apitoken"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="lnk_..."
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-[color:var(--muted-foreground)]">
            Tidak disimpan — hanya hidup di memori tab ini.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endpoint">Endpoint</Label>
          <select
            id="endpoint"
            value={endpoint.id}
            onChange={(e) => onPick(e.target.value)}
            className="w-full h-10 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm font-mono"
          >
            {ENDPOINTS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.method.padEnd(6, " ")} {e.path}
              </option>
            ))}
          </select>
        </div>

        {endpoint.needsId && (
          <div className="space-y-1.5">
            <Label htmlFor="linkid">Link ID</Label>
            <Input
              id="linkid"
              value={linkId}
              onChange={(e) => setLinkId(e.target.value)}
              placeholder="Wq7gN4hL2vXk0a"
              className="font-mono text-xs"
            />
          </div>
        )}

        {endpoint.hasBody && (
          <div className="space-y-1.5">
            <Label htmlFor="reqbody">Request body (JSON)</Label>
            <textarea
              id="reqbody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] p-3 text-xs font-mono"
              spellCheck={false}
            />
          </div>
        )}

        <Button onClick={run} disabled={running}>
          <Play className="h-4 w-4" /> {running ? "Mengirim..." : "Send request"}
        </Button>

        {result && (
          <div className="rounded-[10px] border border-[color:var(--border)] overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-[color:var(--border)]/60 bg-[color:var(--muted)]/30">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${statusColor}`}>
                {result.status === 0 ? "ERR" : result.status}
              </span>
              <span className="text-xs text-[color:var(--muted-foreground)]">
                {result.durationMs}ms
              </span>
            </div>
            <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed max-h-96">
              {result.body}
            </pre>
            {result.headers.length > 0 && (
              <details className="border-t border-[color:var(--border)]/60">
                <summary className="px-3 py-2 text-xs font-medium cursor-pointer text-[color:var(--muted-foreground)]">
                  Response headers ({result.headers.length})
                </summary>
                <div className="px-3 pb-3 text-[11px] font-mono space-y-0.5">
                  {result.headers.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[160px_minmax(0,1fr)] gap-2">
                      <span className="text-[color:var(--muted-foreground)]">{k}</span>
                      <span className="break-all">{v}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
