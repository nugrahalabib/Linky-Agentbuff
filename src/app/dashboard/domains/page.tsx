import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { domains } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { DomainManager } from "@/components/domain-manager";

export default async function DomainsPage() {
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const rows = await db.select().from(domains).where(eq(domains.workspaceId, ws.id));
  const appHost = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709")
    .replace(/^https?:\/\//, "")
    .split("/")[0];

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto w-full">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Custom Domain</h1>
      <p className="text-sm text-[color:var(--muted-foreground)] mb-6">
        Pakai domain sendiri untuk link pendekmu (mis. <code>go.brandmu.com/promo</code>).
      </p>
      <DomainManager initial={rows} appHost={appHost} />
    </div>
  );
}
