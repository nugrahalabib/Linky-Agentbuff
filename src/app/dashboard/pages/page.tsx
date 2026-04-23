import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { linkyPages } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewLinkyPageButton } from "@/components/new-linky-page-button";

export default async function LinkyPagesIndex() {
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const pages = db.select().from(linkyPages).where(eq(linkyPages.workspaceId, ws.id)).orderBy(desc(linkyPages.createdAt)).all();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Linky Pages</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
            Link-in-bio instan — satu halaman, semua tautanmu.
          </p>
        </div>
        <NewLinkyPageButton />
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Sparkles className="h-10 w-10 mx-auto text-[color:var(--primary)] mb-3" />
            <h3 className="font-semibold text-lg">Belum punya Linky Page.</h3>
            <p className="text-sm text-[color:var(--muted-foreground)] mt-1 max-w-sm mx-auto">
              Kumpulkan semua link pentingmu ke satu halaman cantik yang bisa kamu share ke bio sosmed.
            </p>
            <div className="mt-6">
              <NewLinkyPageButton />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="font-semibold truncate">{p.title}</div>
                <div className="text-xs font-mono text-[color:var(--muted-foreground)] mt-1 truncate">
                  {new URL(appUrl).host}/@{p.slug}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
                  <span>{p.views} views</span>
                  <span>{p.published ? "Published" : "Draft"}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/dashboard/pages/${p.id}`}>Edit</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/@${p.slug}`} target="_blank" prefetch={false}>
                      Lihat
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
