import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  users,
  workspaces,
  workspaceMembers,
  type Workspace,
  type WorkspaceRole,
} from "@/lib/db/schema";

export type ResolvedWorkspace = { workspace: Workspace; role: WorkspaceRole };

/**
 * Get the active workspace for the user (and the user's role in it).
 * Falls back to first owned/joined workspace if no active set.
 * Auto-creates a personal workspace + owner membership if user has none.
 */
export async function getActiveWorkspace(userId: string): Promise<ResolvedWorkspace> {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error("User not found");

  // Try active_workspace_id first if set + user is member
  if (user.activeWorkspaceId) {
    const member = db
      .select()
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, user.activeWorkspaceId), eq(workspaceMembers.userId, userId)))
      .get();
    if (member) {
      const ws = db.select().from(workspaces).where(eq(workspaces.id, user.activeWorkspaceId)).get();
      if (ws) return { workspace: ws, role: member.role };
    }
    // Stale activeWorkspaceId — clear it
    db.update(users).set({ activeWorkspaceId: null }).where(eq(users.id, userId)).run();
  }

  // Find any membership
  const membership = db
    .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .get();
  if (membership) {
    const ws = db.select().from(workspaces).where(eq(workspaces.id, membership.workspaceId)).get();
    if (ws) {
      // Persist as active
      db.update(users).set({ activeWorkspaceId: ws.id }).where(eq(users.id, userId)).run();
      return { workspace: ws, role: membership.role };
    }
  }

  // No membership at all — bootstrap personal workspace
  const owned = db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).get();
  if (owned) {
    db.insert(workspaceMembers)
      .values({ workspaceId: owned.id, userId, role: "owner" })
      .run();
    db.update(users).set({ activeWorkspaceId: owned.id }).where(eq(users.id, userId)).run();
    return { workspace: owned, role: "owner" };
  }

  const id = nanoid(12);
  const slug = `personal-${nanoid(6).toLowerCase()}`;
  const name = (user.name?.split(" ")[0] || "Pribadi").slice(0, 30);
  db.insert(workspaces).values({ id, slug, name, ownerId: userId, plan: "free" }).run();
  db.insert(workspaceMembers).values({ workspaceId: id, userId, role: "owner" }).run();
  db.update(users).set({ activeWorkspaceId: id }).where(eq(users.id, userId)).run();
  const created = db.select().from(workspaces).where(eq(workspaces.id, id)).get()!;
  return { workspace: created, role: "owner" };
}

export function getUserWorkspaces(userId: string): Array<{ workspace: Workspace; role: WorkspaceRole }> {
  return db
    .select({
      workspace: workspaces,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .all() as Array<{ workspace: Workspace; role: WorkspaceRole }>;
}

export function setActiveWorkspace(userId: string, workspaceId: string): boolean {
  const member = db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .get();
  if (!member) return false;
  db.update(users).set({ activeWorkspaceId: workspaceId }).where(eq(users.id, userId)).run();
  return true;
}

const ROLE_RANK: Record<WorkspaceRole, number> = { viewer: 0, editor: 1, admin: 2, owner: 3 };

export function canEdit(role: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.editor;
}
export function canAdmin(role: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.admin;
}
export function isOwner(role: WorkspaceRole): boolean {
  return role === "owner";
}
