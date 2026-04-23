import { TagManager } from "@/components/tag-manager";
import { requireUser, ensureWorkspace } from "@/lib/auth";
import { tags } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function TagsPage() {
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const all = db.select().from(tags).where(eq(tags.workspaceId, ws.id)).all();
  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tag</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Label berwarna untuk mengelompokkan link lintas folder.
        </p>
      </div>
      <TagManager initial={all} />
    </div>
  );
}
