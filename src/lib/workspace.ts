import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, workspaces, type Workspace } from "@/lib/db/schema";

export async function getActiveWorkspace(userId: string): Promise<{ workspace: Workspace }> {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("User not found");

  const owned = db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).get();
  if (owned) return { workspace: owned };

  const id = nanoid(12);
  const slug = `personal-${nanoid(6).toLowerCase()}`;
  const name = (user.name?.split(" ")[0] || "Pribadi").slice(0, 30);
  db.insert(workspaces).values({ id, slug, name, ownerId: userId, plan: "free" }).run();
  const created = db.select().from(workspaces).where(eq(workspaces.id, id)).get()!;
  return { workspace: created };
}
