import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { apiKeys, webhooks } from "@/lib/db/schema";
import { ensureWorkspace, requireUser } from "@/lib/auth";
import { ApiKeyManager } from "@/components/api-key-manager";
import { WebhookManager } from "@/components/webhook-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DeveloperPage() {
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const keys = db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.workspaceId, ws.id))
    .orderBy(desc(apiKeys.createdAt))
    .all();

  const hooks = db.select().from(webhooks).where(eq(webhooks.workspaceId, ws.id)).orderBy(desc(webhooks.createdAt)).all();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Developer</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          REST API + webhooks untuk integrasi programmatic.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quickstart REST API</CardTitle>
          <CardDescription>
            Base URL: <code>{appUrl}/api/v1</code>. Authorization: <code>Bearer lnk_...</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-[10px] bg-[color:var(--muted)] p-4 text-xs font-mono">
{`curl -X POST ${appUrl}/api/v1/links \\
  -H "Authorization: Bearer lnk_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"destinationUrl":"https://example.com","customSlug":"promo"}'`}
          </pre>
        </CardContent>
      </Card>

      <ApiKeyManager initial={keys} />
      <WebhookManager initial={hooks} />
    </div>
  );
}
