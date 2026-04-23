import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveLinkBySlug, checkLinkStatus, pickTargetUrl } from "@/lib/resolve-link";

export const dynamic = "force-dynamic";

export default async function CloakPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = resolveLinkBySlug(slug);
  if (!link) redirect("/not-found");
  const status = checkLinkStatus(link);
  if (status.kind === "expired" || status.kind === "click_limit") redirect("/expired");
  if (status.kind === "password_required") redirect(`/p/${encodeURIComponent(slug)}`);

  const h = await headers();
  const ua = h.get("user-agent");
  const country = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country");
  const target = pickTargetUrl(link, ua, country);

  const title = link.ogTitle || link.title || "Linky";
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        {link.ogDescription && <meta name="description" content={link.ogDescription} />}
        {link.ogImage && <meta property="og:image" content={link.ogImage} />}
        <style>{`html,body,iframe{margin:0;padding:0;border:0;height:100vh;width:100vw;overflow:hidden} body{background:#09090b}`}</style>
      </head>
      <body>
        <iframe src={target} title={title} style={{ display: "block" }} />
      </body>
    </html>
  );
}
