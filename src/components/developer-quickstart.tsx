"use client";

import { CodeTabs } from "@/components/code-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DeveloperQuickstart({ baseUrl }: { baseUrl: string }) {
  const curl = `curl -X POST ${baseUrl}/api/v1/links \\
  -H "Authorization: Bearer lnk_LIVE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destinationUrl":"https://example.com","customSlug":"promo"}'`;
  const node = `const res = await fetch("${baseUrl}/api/v1/links", {
  method: "POST",
  headers: {
    "Authorization": "Bearer " + process.env.LINKY_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    destinationUrl: "https://example.com",
    customSlug: "promo",
  }),
});
const { data } = await res.json();
console.log(data.short_url);`;
  const py = `import os, requests

r = requests.post(
    "${baseUrl}/api/v1/links",
    headers={"Authorization": f"Bearer {os.environ['LINKY_KEY']}"},
    json={"destinationUrl": "https://example.com", "customSlug": "promo"},
)
print(r.json()["data"]["short_url"])`;
  const php = `$ch = curl_init("${baseUrl}/api/v1/links");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer " . getenv("LINKY_KEY"),
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "destinationUrl" => "https://example.com",
    "customSlug" => "promo",
  ]),
]);
echo curl_exec($ch);`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quickstart 60 detik</CardTitle>
        <CardDescription>
          Buat API key di tab <strong>API Keys</strong>, set sebagai env <code>LINKY_KEY</code>, lalu jalankan:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CodeTabs
          samples={[
            { label: "cURL", lang: "bash", code: curl },
            { label: "Node.js", lang: "javascript", code: node },
            { label: "Python", lang: "python", code: py },
            { label: "PHP", lang: "php", code: php },
          ]}
        />
        <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">
          Response 201 → field <code>short_url</code> siap di-share. Lihat dokumentasi lengkap di{" "}
          <a className="text-[color:var(--primary)] hover:underline" href="/docs/api" target="_blank">
            /docs/api
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}
