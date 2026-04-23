import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { linkyPages } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { LinkyPageEditor } from "@/components/linky-page-editor";

export default async function LinkyPageEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const page = db.select().from(linkyPages).where(and(eq(linkyPages.id, id), eq(linkyPages.workspaceId, ws.id))).get();
  if (!page) notFound();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
  return <LinkyPageEditor page={page} appUrl={appUrl} />;
}
