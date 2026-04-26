import { ensureWorkspace, requireUser } from "@/lib/auth";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { WorkspaceSection } from "@/components/settings/workspace-section";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { DataSection } from "@/components/settings/data-section";
import { DangerZone } from "@/components/settings/danger-zone";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage() {
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);
  const domain = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "linky.agentbuff.id";

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Kelola profil, keamanan, workspace, preferensi, dan data akunmu.
        </p>
      </div>

      <SettingsTabs
        profile={
          <ProfileSection
            email={user.email}
            name={user.name}
            locale={user.locale}
          />
        }
        security={<SecuritySection />}
        workspace={
          <WorkspaceSection
            initialName={workspace.name}
            initialSlug={workspace.slug}
            domain={domain}
            createdAt={workspace.createdAt}
          />
        }
        preferences={<PreferencesSection />}
        data={<DataSection />}
        danger={<DangerZone workspaceName={workspace.name} email={user.email} />}
      />
    </div>
  );
}
