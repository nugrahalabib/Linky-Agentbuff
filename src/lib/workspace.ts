import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { users, workspaces, type Workspace } from "@/lib/db/schema";

export async function getActiveWorkspace(userId: string): Promise<{ workspace: Workspace }> {
  const user = (await db.select().from(users).where(eq(users.id, userId)))[0];
  if (!user) throw new Error("User not found");

  const owned = (await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)))[0];
  if (owned) return { workspace: owned };

  const id = nanoid(12);
  const slug = `personal-${nanoid(6).toLowerCase()}`;
  const name = (user.name?.split(" ")[0] || "Pribadi").slice(0, 30);
  await db.insert(workspaces).values({ id, slug, name, ownerId: userId, plan: "free" });
  const created = (await db.select().from(workspaces).where(eq(workspaces.id, id)))[0]!;
  return { workspace: created };
}
