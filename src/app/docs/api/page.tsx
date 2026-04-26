import Link from "next/link";
import { CodeBlock, CodeTabs } from "@/components/code-block";
import { SiteHeader } from "@/components/site-header";

export const metadata = {
  title: "API Docs — Linky",
  description: "Dokumentasi REST API + Webhooks Linky. Buat, kelola, dan analisa link secara programmatic.",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.agentbuff.id";
const BASE = `${APP_URL.replace(/\/+$/, "")}/api/v1`;

const TOC = [
  { id: "intro", label: "Pengantar" },
  { id: "quickstart", label: "Quickstart 60 detik" },
  { id: "auth", label: "Authentication" },
  { id: "rate-limits", label: "Rate limits & CORS" },
  { id: "errors", label: "Error format" },
  { id: "links", label: "Endpoint: Links" },
  { id: "analytics", label: "Endpoint: Analytics" },
  { id: "qr", label: "Endpoint: QR" },
  { id: "me", label: "Endpoint: Me" },
  { id: "webhooks", label: "Webhooks" },
  { id: "openapi", label: "OpenAPI / SDK" },
  { id: "changelog", label: "Changelog" },
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 text-2xl font-semibold tracking-tight mt-12 mb-3 first:mt-0">
      {children}
    </h2>
  );
}
function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="scroll-mt-20 text-base font-semibold mt-8 mb-2">
      {children}
    </h3>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-[color:var(--muted-foreground)]">{children}</p>;
}
function Method({ method, path }: { method: "GET" | "POST" | "PATCH" | "DELETE"; path: string }) {
  const color =
    method === "GET"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : method === "POST"
      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
      : method === "PATCH"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
  return (
    <div className="flex items-center gap-2 my-3 flex-wrap">
      <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${color}`}>{method}</span>
      <code className="text-xs font-mono text-[color:var(--foreground)]">{path}</code>
    </div>
  );
}
function Param({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2 border-b border-[color:var(--border)]/60 last:border-0">
      <div className="sm:w-44 flex items-center gap-2 shrink-0">
        <code className="text-xs font-mono text-[color:var(--foreground)]">{name}</code>
        {required && <span className="text-[10px] uppercase font-semibold text-rose-500">required</span>}
      </div>
      <div className="text-xs sm:w-24 font-mono text-[color:var(--muted-foreground)] shrink-0">{type}</div>
      <div className="text-sm text-[color:var(--muted-foreground)] flex-1">{desc}</div>
    </div>
  );
}

export default function ApiDocsPage() {
  const curlCreate = `curl -X POST ${BASE}/links \\
  -H "Authorization: Bearer lnk_LIVE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destinationUrl": "https://example.com/landing",
    "customSlug": "promo",
    "utmSource": "newsletter",
    "utmCampaign": "april-launch"
  }'`;
  const jsCreate = `const res = await fetch("${BASE}/links", {
  method: "POST",
  headers: {
    "Authorization": "Bearer lnk_LIVE_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    destinationUrl: "https://example.com/landing",
    customSlug: "promo",
  }),
});
const { data } = await res.json();
console.log(data.short_url);`;
  const pyCreate = `import os, requests

r = requests.post(
    "${BASE}/links",
    headers={"Authorization": f"Bearer {os.environ['LINKY_KEY']}"},
    json={"destinationUrl": "https://example.com/landing", "customSlug": "promo"},
)
r.raise_for_status()
print(r.json()["data"]["short_url"])`;
  const phpCreate = `$ch = curl_init("${BASE}/links");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . getenv("LINKY_KEY"),
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "destinationUrl" => "https://example.com/landing",
    "customSlug" => "promo",
  ]),
]);
$resp = json_decode(curl_exec($ch), true);
echo $resp["data"]["short_url"];`;

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] mb-3">
              Daftar isi
            </div>
            <nav className="flex flex-col gap-1">
              {TOC.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] py-1"
                >
                  {t.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-[color:var(--border)]/60 text-xs text-[color:var(--muted-foreground)] space-y-2">
              <div>
                Base URL:
                <br />
                <code className="text-[10px] font-mono break-all">{BASE}</code>
              </div>
              <div>
                <Link className="text-[color:var(--primary)] hover:underline" href="/docs/openapi.json">
                  OpenAPI JSON →
                </Link>
              </div>
              <div>
                <Link className="text-[color:var(--primary)] hover:underline" href="/dashboard/developer">
                  Buat API key →
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Linky API</h1>
            <p className="mt-2 text-base text-[color:var(--muted-foreground)] max-w-2xl">
              REST + JSON. Bearer auth. Stable v1. Semua endpoint produksi sudah live di{" "}
              <code className="text-xs font-mono">{BASE}</code>.
            </p>
          </header>

          <H id="intro">Pengantar</H>
          <P>
            Linky API memungkinkan kamu membuat link pendek, mengelola folder/tag, mengambil analitik,
            men-generate QR, dan menerima webhook event — semua dari kode kamu sendiri. Tidak ada SDK
            wajib: kalau bisa <code>fetch</code> JSON, kamu bisa pakai Linky.
          </P>
          <ul className="mt-3 space-y-1 text-sm text-[color:var(--muted-foreground)] list-disc pl-5">
            <li>Stable, versioned base path: <code className="text-xs">/api/v1/...</code></li>
            <li>Body & response selalu JSON (kecuali QR PNG/SVG)</li>
            <li>Semua timestamp ISO-8601 UTC</li>
            <li>CORS terbuka — boleh dipanggil dari browser</li>
            <li>Rate limit 120 req/menit/key</li>
          </ul>

          <H id="quickstart">Quickstart 60 detik</H>
          <ol className="space-y-2 text-sm list-decimal pl-5 text-[color:var(--muted-foreground)]">
            <li>
              Buka{" "}
              <Link href="/dashboard/developer" className="text-[color:var(--primary)] hover:underline">
                Developer → API Keys
              </Link>{" "}
              dan klik <strong>Buat</strong>. Beri nama (misal <em>Production</em>).
            </li>
            <li>Salin token <code>lnk_...</code> — token penuh hanya muncul sekali.</li>
            <li>Set di environment kamu sebagai <code>LINKY_KEY</code>, lalu jalankan:</li>
          </ol>
          <div className="mt-4">
            <CodeTabs
              samples={[
                { label: "cURL", lang: "bash", code: curlCreate },
                { label: "JavaScript", lang: "javascript", code: jsCreate },
                { label: "Python", lang: "python", code: pyCreate },
                { label: "PHP", lang: "php", code: phpCreate },
              ]}
            />
          </div>
          <P>
            Response 201 Created berisi field <code>short_url</code> yang siap dishare. Itu aja — kamu
            udah selesai.
          </P>

          <H id="auth">Authentication</H>
          <P>
            Semua endpoint <code>/api/v1/*</code> butuh header{" "}
            <code className="text-xs">Authorization: Bearer lnk_...</code>. Token diterbitkan di
            dashboard, di-hash dengan SHA-256 sebelum disimpan, dan tidak bisa di-recover. Kalau hilang,
            buat key baru.
          </P>
          <CodeBlock lang="http" code={`Authorization: Bearer lnk_LIVE_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
          <ul className="mt-3 text-sm text-[color:var(--muted-foreground)] list-disc pl-5 space-y-1">
            <li>Setiap key terikat ke 1 workspace.</li>
            <li>Key tanpa scope: punya akses penuh ke workspace yang menerbitkannya.</li>
            <li>Revoke kapan saja dari dashboard. Revoke langsung berlaku.</li>
            <li>Jangan commit key ke git. Pakai env var atau secret manager.</li>
          </ul>

          <H id="rate-limits">Rate limits & CORS</H>
          <P>
            Setiap key dibatasi <strong>120 request/menit</strong> (sliding 60s window). Header response
            selalu memuat:
          </P>
          <CodeBlock
            lang="http"
            code={`X-RateLimit-Limit: 120
X-RateLimit-Remaining: 117
X-RateLimit-Reset: 1745601923`}
          />
          <P>
            Kalau limit terlewati, kamu dapat <code>429 rate_limited</code>. Backoff exponential
            (1s → 2s → 4s) lalu retry. CORS terbuka untuk semua origin (<code>*</code>) supaya bisa
            dipanggil dari frontend.
          </P>

          <H id="errors">Error format</H>
          <P>Semua error mengikuti shape ini:</P>
          <CodeBlock
            lang="json"
            code={`{
  "error": { "code": "validation_error", "message": "destinationUrl invalid (harus http/https)." },
  "request_id": "x9k2HfPvQz4n"
}`}
          />
          <P>
            <code>code</code> stabil dan aman dipakai dalam logic. <code>message</code> bisa berubah.
            Sertakan <code>request_id</code> kalau report bug.
          </P>
          <div className="mt-3 rounded-[10px] border border-[color:var(--border)] overflow-hidden text-sm">
            <table className="w-full">
              <thead className="bg-[color:var(--muted)]/50 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">HTTP</th>
                  <th className="text-left px-3 py-2">code</th>
                  <th className="text-left px-3 py-2">Kapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]/60 text-xs">
                <tr><td className="px-3 py-2 font-mono">400</td><td className="px-3 py-2 font-mono">validation_error</td><td className="px-3 py-2">Body tidak lolos schema.</td></tr>
                <tr><td className="px-3 py-2 font-mono">400</td><td className="px-3 py-2 font-mono">invalid_url</td><td className="px-3 py-2">URL tujuan bukan http/https.</td></tr>
                <tr><td className="px-3 py-2 font-mono">400</td><td className="px-3 py-2 font-mono">invalid_slug</td><td className="px-3 py-2">Slug mengandung karakter ilegal / reserved.</td></tr>
                <tr><td className="px-3 py-2 font-mono">400</td><td className="px-3 py-2 font-mono">invalid_json</td><td className="px-3 py-2">Body bukan JSON valid.</td></tr>
                <tr><td className="px-3 py-2 font-mono">401</td><td className="px-3 py-2 font-mono">unauthorized</td><td className="px-3 py-2">Bearer token kosong/expired/revoked.</td></tr>
                <tr><td className="px-3 py-2 font-mono">404</td><td className="px-3 py-2 font-mono">not_found</td><td className="px-3 py-2">Resource tidak ada di workspace ini.</td></tr>
                <tr><td className="px-3 py-2 font-mono">409</td><td className="px-3 py-2 font-mono">slug_taken</td><td className="px-3 py-2">customSlug sudah dipakai link lain.</td></tr>
                <tr><td className="px-3 py-2 font-mono">422</td><td className="px-3 py-2 font-mono">unsafe_url</td><td className="px-3 py-2">URL terdeteksi phishing/malware.</td></tr>
                <tr><td className="px-3 py-2 font-mono">429</td><td className="px-3 py-2 font-mono">rate_limited</td><td className="px-3 py-2">120 req/menit terlewati.</td></tr>
              </tbody>
            </table>
          </div>

          <H id="links">Endpoint: Links</H>
          <H3 id="links-list">List links</H3>
          <Method method="GET" path="/api/v1/links" />
          <P>Mengembalikan link aktif (non-archived) di workspace, terbaru duluan.</P>
          <div className="mt-2 rounded-[10px] border border-[color:var(--border)] p-4 bg-[color:var(--muted)]/20">
            <Param name="limit" type="integer" desc="Jumlah maksimum (1–200, default 50)." />
            <Param name="archived" type="boolean" desc="Set 1 untuk link yang sudah diarsip." />
          </div>
          <CodeBlock
            lang="bash"
            code={`curl ${BASE}/links?limit=10 -H "Authorization: Bearer lnk_KEY"`}
          />

          <H3 id="links-create">Create link</H3>
          <Method method="POST" path="/api/v1/links" />
          <div className="mt-2 rounded-[10px] border border-[color:var(--border)] p-4 bg-[color:var(--muted)]/20">
            <Param name="destinationUrl" type="string" required desc="URL tujuan (http/https)." />
            <Param name="customSlug" type="string" desc="Slug kustom 2–50 char [a-z0-9_-]. Default: random nanoid." />
            <Param name="title" type="string" desc="Judul untuk dashboard (default: hostname tujuan)." />
            <Param name="description" type="string" desc="Deskripsi opsional." />
            <Param name="folderId" type="string" desc="Masukkan ke folder tertentu." />
            <Param name="password" type="string" desc="Password gate. Hashed dengan bcrypt." />
            <Param name="expiresAt" type="ISO date" desc="Tanggal kadaluwarsa." />
            <Param name="clickLimit" type="integer" desc="Maks jumlah klik sebelum expired." />
            <Param name="iosUrl" type="string" desc="Deep link iOS (override tujuan untuk UA iOS)." />
            <Param name="androidUrl" type="string" desc="Deep link Android." />
            <Param name="utmSource / utmMedium / utmCampaign / utmTerm / utmContent" type="string" desc="Auto-append ke destinationUrl saat redirect." />
            <Param name="ogTitle / ogDescription / ogImage" type="string" desc="Override Open Graph saat di-share di sosmed." />
            <Param name="cloak" type="boolean" desc="Sembunyikan URL tujuan di address bar." />
          </div>
          <CodeBlock lang="bash" code={curlCreate} />
          <P>Response 201:</P>
          <CodeBlock
            lang="json"
            code={`{
  "data": {
    "id": "Wq7gN4hL2vXk0a",
    "slug": "promo",
    "short_url": "${APP_URL}/promo",
    "destination_url": "https://example.com/landing?utm_source=newsletter&utm_campaign=april-launch",
    "title": "example.com",
    "click_count": 0,
    "has_password": false,
    "expires_at": null,
    "created_at": "2026-04-25T10:30:00.000Z"
  }
}`}
          />

          <H3 id="links-get">Get link</H3>
          <Method method="GET" path="/api/v1/links/{id}" />
          <CodeBlock lang="bash" code={`curl ${BASE}/links/Wq7gN4hL2vXk0a -H "Authorization: Bearer lnk_KEY"`} />

          <H3 id="links-update">Update link</H3>
          <Method method="PATCH" path="/api/v1/links/{id}" />
          <P>Field optional sama dengan POST. Tambah <code>archived: true</code> untuk arsip, <code>clearPassword: true</code> untuk lepas password gate.</P>
          <CodeBlock
            lang="bash"
            code={`curl -X PATCH ${BASE}/links/Wq7gN4hL2vXk0a \\
  -H "Authorization: Bearer lnk_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destinationUrl":"https://newurl.com","title":"Promo April"}'`}
          />

          <H3 id="links-delete">Delete link</H3>
          <Method method="DELETE" path="/api/v1/links/{id}" />
          <P>Permanent. Akan menghapus semua data klik terkait.</P>
          <CodeBlock lang="bash" code={`curl -X DELETE ${BASE}/links/Wq7gN4hL2vXk0a -H "Authorization: Bearer lnk_KEY"`} />

          <H id="analytics">Endpoint: Analytics</H>
          <H3 id="analytics-workspace">Workspace overview</H3>
          <Method method="GET" path="/api/v1/analytics/workspace?days=30" />
          <P>Klik agregat untuk seluruh workspace dalam <code>days</code> hari (1–365).</P>
          <CodeBlock
            lang="json"
            code={`{
  "data": {
    "period_days": 30,
    "totalClicks": 1284,
    "uniqueVisitors": 712,
    "avgPerDay": 43,
    "totalLinks": 24,
    "last7Days": [{ "date": "2026-04-19", "clicks": 88 }, ...],
    "topCountries": [{ "country": "ID", "clicks": 612 }, ...],
    "topReferrers": [{ "referrer": "Langsung", "clicks": 401 }, ...],
    "topDevices": [...],
    "topBrowsers": [...]
  }
}`}
          />

          <H3 id="analytics-link">Per-link breakdown</H3>
          <Method method="GET" path="/api/v1/analytics/links/{id}?days=30" />
          <P>Sama shape dengan workspace overview, di-scope ke 1 link.</P>

          <H id="qr">Endpoint: QR</H>
          <Method method="GET" path="/api/v1/qr?text=...&format=svg" />
          <div className="mt-2 rounded-[10px] border border-[color:var(--border)] p-4 bg-[color:var(--muted)]/20">
            <Param name="text" type="string" required desc="String yang di-encode (biasanya short_url)." />
            <Param name="format" type="svg | png" desc="Default svg." />
            <Param name="size" type="integer" desc="Pixel ukuran (default 320)." />
            <Param name="fg / bg" type="hex color" desc="Warna foreground / background." />
            <Param name="margin" type="integer" desc="Quiet zone (default 2)." />
          </div>
          <CodeBlock
            lang="bash"
            code={`curl "${BASE}/qr?text=${encodeURIComponent(`${APP_URL}/promo`)}&format=png&size=512" \\
  -H "Authorization: Bearer lnk_KEY" \\
  -o promo.png`}
          />

          <H id="me">Endpoint: Me</H>
          <Method method="GET" path="/api/v1/me" />
          <P>Identifikasi key yang aktif + workspace-nya. Bagus buat ping/healthcheck dari sisi client.</P>
          <CodeBlock
            lang="json"
            code={`{
  "data": {
    "workspace": { "id": "ws_...", "name": "Personal", "slug": "personal-xxx" },
    "api_key":  { "id": "ak_...", "name": "Production" }
  }
}`}
          />

          <H id="webhooks">Webhooks</H>
          <P>
            Webhook adalah HTTP POST yang Linky kirim ke endpoint kamu setiap kali sebuah event terjadi.
            Buat di <Link href="/dashboard/developer" className="text-[color:var(--primary)] hover:underline">Developer → Webhooks</Link>.
            Event yang tersedia:
          </P>
          <ul className="mt-2 text-sm text-[color:var(--muted-foreground)] list-disc pl-5 space-y-1">
            <li><code>link.clicked</code> — setiap klik non-bot ke link</li>
            <li><code>link.created</code> — link baru dibuat (UI/API)</li>
            <li><code>link.updated</code> — link di-edit</li>
            <li><code>link.deleted</code> — link dihapus</li>
          </ul>
          <H3>Payload</H3>
          <CodeBlock
            lang="json"
            code={`{
  "event": "link.clicked",
  "workspace_id": "ws_xxx",
  "delivery_id": "whd_AbC123...",
  "timestamp": "2026-04-25T10:30:01.234Z",
  "data": {
    "link_id": "Wq7gN4hL2vXk0a",
    "slug": "promo",
    "destination_url": "https://example.com/landing",
    "country": "ID",
    "device": "mobile",
    "os": "Android",
    "browser": "Chrome",
    "referrer": "https://www.instagram.com/",
    "ts": "2026-04-25T10:30:01.211Z"
  }
}`}
          />

          <H3>Verifikasi signature</H3>
          <P>
            Setiap request dikirim dengan header <code>X-Linky-Signature: sha256=&lt;hex&gt;</code>.
            Hitung HMAC-SHA256 dari raw body dengan secret webhook kamu, lalu bandingkan
            (<em>constant-time compare</em>).
          </P>
          <CodeTabs
            samples={[
              {
                label: "Node.js",
                lang: "javascript",
                code: `import crypto from "node:crypto";

export function verify(rawBody, header, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const got = (header || "").replace(/^sha256=/, "");
  // timingSafeEqual butuh buffer dengan panjang sama
  if (got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}`,
              },
              {
                label: "Python",
                lang: "python",
                code: `import hmac, hashlib

def verify(raw_body: bytes, header: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    got = (header or "").removeprefix("sha256=")
    return hmac.compare_digest(got, expected)`,
              },
              {
                label: "PHP",
                lang: "php",
                code: `function linky_verify(string $rawBody, string $header, string $secret): bool {
  $expected = hash_hmac('sha256', $rawBody, $secret);
  $got = preg_replace('/^sha256=/', '', $header);
  return hash_equals($expected, $got);
}`,
              },
            ]}
          />

          <H3>Headers</H3>
          <div className="rounded-[10px] border border-[color:var(--border)] overflow-hidden text-sm">
            <table className="w-full">
              <tbody className="divide-y divide-[color:var(--border)]/60 text-xs">
                <tr><td className="px-3 py-2 font-mono w-56">X-Linky-Event</td><td className="px-3 py-2">Nama event (misal <code>link.clicked</code>).</td></tr>
                <tr><td className="px-3 py-2 font-mono">X-Linky-Signature</td><td className="px-3 py-2">HMAC-SHA256 dari body, prefix <code>sha256=</code>.</td></tr>
                <tr><td className="px-3 py-2 font-mono">X-Linky-Delivery-Id</td><td className="px-3 py-2">ID unik delivery (untuk dedup di sisi kamu).</td></tr>
                <tr><td className="px-3 py-2 font-mono">User-Agent</td><td className="px-3 py-2">Linky-Webhook/1.0</td></tr>
              </tbody>
            </table>
          </div>
          <H3>Best practice</H3>
          <ul className="text-sm text-[color:var(--muted-foreground)] list-disc pl-5 space-y-1">
            <li>Reply secepatnya (≤5s). Kalau perlu kerja berat, push ke queue dulu.</li>
            <li>Idempotent: gunakan <code>delivery_id</code> sebagai key.</li>
            <li>Reply 2xx untuk acknowledged. 5xx/timeout dihitung sebagai gagal.</li>
            <li>Gagal beruntun? Cek tab <em>Pengiriman</em> di dashboard untuk lihat status detail.</li>
          </ul>

          <H id="openapi">OpenAPI / SDK</H>
          <P>
            Spec OpenAPI 3.1 tersedia di{" "}
            <Link href="/docs/openapi.json" className="text-[color:var(--primary)] hover:underline">
              /docs/openapi.json
            </Link>
            . Import ke Postman, Insomnia, Bruno, atau generate SDK pakai{" "}
            <a href="https://github.com/openapitools/openapi-generator" target="_blank" rel="noreferrer" className="text-[color:var(--primary)] hover:underline">
              openapi-generator
            </a>{" "}
            untuk Java, Go, Ruby, Swift, dll.
          </P>

          <H id="changelog">Changelog</H>
          <ul className="text-sm space-y-2">
            <li className="border-l-2 border-[color:var(--primary)] pl-3">
              <div className="font-mono text-xs text-[color:var(--muted-foreground)]">v1.0 — 2026-04-25</div>
              <div>Stable launch. Endpoints: links CRUD, analytics, qr, me. Webhooks dengan HMAC signature + delivery log.</div>
            </li>
          </ul>

          <div className="mt-12 pt-6 border-t border-[color:var(--border)]/60 text-sm text-[color:var(--muted-foreground)] flex justify-between">
            <span>
              Pertanyaan? Buka{" "}
              <a href="https://github.com/nugrahalabib/Linky-Agentbuff/issues" target="_blank" rel="noreferrer" className="text-[color:var(--primary)] hover:underline">
                issue di GitHub
              </a>
              .
            </span>
            <Link href="/dashboard/developer" className="text-[color:var(--primary)] hover:underline">
              Buka dashboard →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
