import { eq, isNull, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, workspaceMembers, workspaceInvitations } from "@/lib/db/schema";
import { getSessionUserWithWorkspace } from "@/lib/auth";
import { canAdmin } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { TeamManager } from "@/components/team-manager";

export default async function TeamPage() {
  const ctx = await getSessionUserWithWorkspace();
  if (!ctx) redirect("/signin");

  const members = db
    .select({
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.joinedAt,
      email: users.email,
      name: users.name,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, ctx.workspace.id))
    .all();

  const invites = db
    .select()
    .from(workspaceInvitations)
    .where(
      and(eq(workspaceInvitations.workspaceId, ctx.workspace.id), isNull(workspaceInvitations.acceptedAt)),
    )
    .orderBy(desc(workspaceInvitations.createdAt))
    .all();

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tim</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Workspace <strong>{ctx.workspace.name}</strong> · perankamu: <strong>{ctx.role}</strong>
        </p>
      </div>
      <TeamManager
        members={members.map((m) => ({ ...m, joinedAt: m.joinedAt.getTime() }))}
        invitations={invites.map((i) => ({
          ...i,
          createdAt: i.createdAt.getTime(),
          expiresAt: i.expiresAt.getTime(),
          acceptedAt: i.acceptedAt?.getTime() ?? null,
        }))}
        currentUserId={ctx.user.id}
        canManage={canAdmin(ctx.role)}
      />
    </div>
  );
}
