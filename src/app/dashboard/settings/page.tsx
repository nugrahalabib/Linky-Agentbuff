import { ensureWorkspace, requireUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default async function SettingsPage() {
  const user = await requireUser();
  const workspace = await ensureWorkspace(user.id);
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Profil, workspace, dan preferensi akunmu.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Informasi dasar akunmu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>Nama</Label>
              <Input value={user.name ?? ""} readOnly placeholder="(belum diisi)" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Ruang kerja untuk link kamu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama workspace</Label>
              <Input value={workspace.name} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>Domain produksi</Label>
              <Input value="linky.agentbuff.id" readOnly />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
