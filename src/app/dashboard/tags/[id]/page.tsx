import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ArrowLeft, Tag as TagIcon, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { linkTags, links, tags } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LinkListItem } from "@/components/link-list-item";

export default async function TagDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const tag = db
    .select()
    .from(tags)
    .where(and(eq(tags.id, id), eq(tags.workspaceId, ws.id)))
    .get();
  if (!tag) notFound();

  const list = db
    .select({
      id: links.id,
      workspaceId: links.workspaceId,
      domainId: links.domainId,
      slug: links.slug,
      destinationUrl: links.destinationUrl,
      title: links.title,
      description: links.description,
      faviconUrl: links.faviconUrl,
      folderId: links.folderId,
      passwordHash: links.passwordHash,
      expiresAt: links.expiresAt,
      clickLimit: links.clickLimit,
      iosUrl: links.iosUrl,
      androidUrl: links.androidUrl,
      utmParams: links.utmParams,
      geoRules: links.geoRules,
      abVariants: links.abVariants,
      ogTitle: links.ogTitle,
      ogDescription: links.ogDescription,
      ogImage: links.ogImage,
      cloak: links.cloak,
      clickCount: links.clickCount,
      archived: links.archived,
      isAnonymous: links.isAnonymous,
      anonOwnerIp: links.anonOwnerIp,
      createdBy: links.createdBy,
      createdAt: links.createdAt,
      updatedAt: links.updatedAt,
    })
    .from(linkTags)
    .innerJoin(links, eq(links.id, linkTags.linkId))
    .where(and(eq(linkTags.tagId, id), eq(links.workspaceId, ws.id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .all();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard/tags">
          <ArrowLeft className="h-4 w-4" /> Semua tag
        </Link>
      </Button>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white"
            style={{ background: tag.color }}
          >
            <TagIcon className="h-3.5 w-3.5" />
            {tag.name}
          </span>
          <p className="text-sm text-[color:var(--muted-foreground)]">
            {list.length} link punya tag ini
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/links/new">
            <Plus className="h-4 w-4" /> Link baru
          </Link>
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {list.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm text-[color:var(--muted-foreground)]">Belum ada link dengan tag ini.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/links/new">Buat link dan beri tag ini</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[color:var(--border)]">
              {list.map((l) => (
                <LinkListItem key={l.id} link={l} appUrl={appUrl} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
