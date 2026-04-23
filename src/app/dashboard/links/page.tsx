import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Plus, Link as LinkIcon } from "lucide-react";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LinksTable } from "@/components/links-table";

export default async function LinksPage() {
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);
  const rows = db
    .select()
    .from(links)
    .where(and(eq(links.workspaceId, workspace.id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .all();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Link kamu</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Kelola semua link. Klik untuk detail, analitik, dan pengaturan.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/links/new">
            <Plus className="h-4 w-4" />
            Link baru
          </Link>
        </Button>
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
        <LinksTable initialLinks={rows} appUrl={appUrl} />
      )}
    </div>
  );
}
