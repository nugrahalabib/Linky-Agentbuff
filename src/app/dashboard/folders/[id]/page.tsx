import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ArrowLeft, Folder as FolderIcon, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { folders, links } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LinkListItem } from "@/components/link-list-item";

export default async function FolderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const folder = db
    .select()
    .from(folders)
    .where(and(eq(folders.id, id), eq(folders.workspaceId, ws.id)))
    .get();
  if (!folder) notFound();

  const list = db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, ws.id), eq(links.folderId, id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .all();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link href="/dashboard/folders">
          <ArrowLeft className="h-4 w-4" /> Semua folder
        </Link>
      </Button>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FolderIcon className="h-7 w-7" style={{ color: folder.color }} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{folder.name}</h1>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
              {list.length} link aktif dalam folder ini
            </p>
          </div>
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
              <p className="text-sm text-[color:var(--muted-foreground)]">Belum ada link di folder ini.</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/links/new">Buat link dan masukkan ke folder ini</Link>
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
