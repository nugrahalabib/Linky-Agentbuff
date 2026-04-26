import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { links } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default async function WorkspaceAnalyticsPage() {
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);
  const linkOptions = db
    .select({ id: links.id, slug: links.slug, title: links.title })
    .from(links)
    .where(and(eq(links.workspaceId, workspace.id), eq(links.archived, false)))
    .orderBy(desc(links.createdAt))
    .limit(200)
    .all();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      <AnalyticsDashboard workspaceName={workspace.name} appUrl={appUrl} linkOptions={linkOptions} />
    </div>
  );
}
