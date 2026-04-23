export const dynamic = "force-static";

export function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.agentbuff.id";
  const urls = ["/", "/signin", "/signup", "/report"];
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${appUrl}${u}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${u === "/" ? "1.0" : "0.6"}</priority></url>`,
  )
  .join("\n")}
</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
