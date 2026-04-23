import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { linkyPages, type LinkyPageBlock, type LinkyPageTheme } from "@/lib/db/schema";
import { LinkyPageRenderer } from "@/components/linky-page-renderer";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

async function loadPage(username: string) {
  return db.select().from(linkyPages).where(eq(linkyPages.slug, username)).get() ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const page = await loadPage(username);
  if (!page) return { title: "Linky Page tidak ditemukan" };
  return {
    title: page.title,
    description: page.bio ?? undefined,
    openGraph: {
      title: page.title,
      description: page.bio ?? undefined,
      images: page.avatarUrl ? [{ url: page.avatarUrl }] : undefined,
    },
  };
}

export default async function LinkyPagePublic({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const page = await loadPage(username);
  if (!page || !page.published) notFound();
  return (
    <LinkyPageRenderer
      pageId={page.id}
      title={page.title}
      bio={page.bio}
      avatarUrl={page.avatarUrl}
      theme={(page.theme as LinkyPageTheme | null) ?? {}}
      background={page.background}
      blocks={(page.blocks as LinkyPageBlock[]) ?? []}
    />
  );
}
