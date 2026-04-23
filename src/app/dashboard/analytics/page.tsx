import { ensureWorkspace, requireUser } from "@/lib/auth";
import { AnalyticsPanel } from "@/components/analytics-panel";

export default async function WorkspaceAnalyticsPage() {
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analitik</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Ringkasan performa semua link di workspace <strong>{workspace.name}</strong>.
        </p>
      </div>
      <AnalyticsPanel workspaceId={workspace.id} />
    </div>
  );
}
