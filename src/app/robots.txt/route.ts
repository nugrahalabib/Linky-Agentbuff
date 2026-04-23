export const dynamic = "force-static";

export function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.agentbuff.id";
  const body = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api
Disallow: /p/
Disallow: /c/
Disallow: /signin
Disallow: /signup

Sitemap: ${appUrl}/sitemap.xml
`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
