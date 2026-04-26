import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Plus, Link as LinkIcon, Download, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { folders, links, linkTags, tags as tagsTable } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinksBrowser } from "@/components/links-browser";

export default async function LinksPage() {
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);
  const rawRows = db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, workspace.id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .all();
  const allFolders = db.select().from(folders).where(eq(folders.workspaceId, workspace.id)).all();
  const allTags = db.select().from(tagsTable).where(eq(tagsTable.workspaceId, workspace.id)).all();

  // Enrich rows with folder + tags for initial render
  const ids = rawRows.map((l) => l.id);
  const tagMap = new Map<string, Array<{ id: string; name: string; color: string }>>();
  if (ids.length > 0) {
    const tagRows = db
      .select({ linkId: linkTags.linkId, id: tagsTable.id, name: tagsTable.name, color: tagsTable.color })
      .from(linkTags)
      .innerJoin(tagsTable, eq(tagsTable.id, linkTags.tagId))
      .where(inArray(linkTags.linkId, ids))
      .all();
    for (const t of tagRows) {
      const arr = tagMap.get(t.linkId) ?? [];
      arr.push({ id: t.id, name: t.name, color: t.color });
      tagMap.set(t.linkId, arr);
    }
  }
  const folderById = new Map(allFolders.map((f) => [f.id, f]));
  const rows = rawRows.map((l) => ({
    ...l,
    tags: tagMap.get(l.id) ?? [],
    folder: l.folderId ? folderById.get(l.folderId) ?? null : null,
  }));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Link kamu</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            {rows.length} link aktif. Gunakan filter untuk mempersempit.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/import">
              <Upload className="h-4 w-4" /> Import
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/api/links/export" prefetch={false}>
              <Download className="h-4 w-4" /> Export
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/links/new">
              <Plus className="h-4 w-4" />
              Link baru
            </Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<LinkIcon className="h-6 w-6" />}
              title="Belum ada link."
              description="Mulai dengan membuat link pertamamu. Prosesnya cuma 2 detik."
              action={
                <Button asChild>
                  <Link href="/dashboard/links/new">
                    <Plus className="h-4 w-4" />
                    Buat link pertama
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <LinksBrowser initialLinks={rows} folders={allFolders} tags={allTags} appUrl={appUrl} />
      )}
    </div>
  );
}
