import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft, ExternalLink, QrCode as QrIcon } from "lucide-react";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateLinkForm } from "@/components/create-link-form";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { QrStudio } from "@/components/qr-studio";
import { DeleteLinkButton } from "@/components/delete-link-button";
import { CopyButton } from "@/components/copy-button";

export default async function LinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);
  const link = db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.workspaceId, workspace.id)))
    .get();
  if (!link) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
  const shortUrl = `${appUrl}/${link.slug}`;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/links">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar link
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{link.title || link.slug}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-[8px] bg-[color:var(--muted)] px-3 py-1 font-mono text-sm">
                  {shortUrl}
                </code>
                <CopyButton value={shortUrl} />
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka
                </a>
              </div>
              <div className="mt-2 text-sm text-[color:var(--muted-foreground)] truncate">
                → {link.destinationUrl}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-[color:var(--primary)] tabular-nums">
                {link.clickCount.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)] uppercase tracking-wider">Total klik</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analytics">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="qr">
            <QrIcon className="h-3.5 w-3.5 mr-1" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
          <TabsTrigger value="danger">Bahaya</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsPanel linkId={link.id} />
        </TabsContent>

        <TabsContent value="qr">
          <Card>
            <CardHeader>
              <CardTitle>QR Code untuk link ini</CardTitle>
              <CardDescription>Sesuaikan warna dengan brandmu, lalu unduh PNG atau SVG.</CardDescription>
            </CardHeader>
            <CardContent>
              <QrStudio text={shortUrl} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <CreateLinkForm appUrl={appUrl} editId={link.id} initial={link as unknown as Record<string, unknown>} />
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle>Zona bahaya</CardTitle>
              <CardDescription>Tindakan di bawah bersifat permanen.</CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteLinkButton linkId={link.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
