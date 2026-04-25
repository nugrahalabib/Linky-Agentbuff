"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Mail, Plus, Trash2, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type Role = "owner" | "admin" | "editor" | "viewer";
type Member = {
  userId: string;
  role: Role;
  joinedAt: number;
  email: string;
  name: string | null;
};
type Invite = {
  id: string;
  email: string;
  role: Role;
  token: string;
  expiresAt: number;
  createdAt: number;
  acceptedAt: number | null;
};

const ROLE_DESC: Record<Role, string> = {
  owner: "Akses penuh + bisa hapus workspace",
  admin: "Bisa kelola anggota & semua link",
  editor: "Bisa buat & edit link",
  viewer: "Hanya lihat link & analitik",
};

export function TeamManager({
  members: initialMembers,
  invitations: initialInvites,
  currentUserId,
  canManage,
}: {
  members: Member[];
  invitations: Invite[];
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [loading, setLoading] = useState(false);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNewInviteUrl(null);
    try {
      const res = await fetch("/api/workspace/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: data.error, variant: "danger" });
        return;
      }
      setNewInviteUrl(data.inviteUrl);
      setInvites((prev) => [
        {
          id: data.id,
          email: data.email,
          role: data.role,
          token: data.token,
          expiresAt: new Date(data.expiresAt).getTime(),
          createdAt: Date.now(),
          acceptedAt: null,
        },
        ...prev,
      ]);
      setEmail("");
      push({ title: "Undangan dibuat!", variant: "success" });
    } finally {
      setLoading(false);
    }
  };

  const copyInvite = async (url: string) => {
    await navigator.clipboard.writeText(url);
    push({ title: "Link tersalin", variant: "success" });
  };

  const cancelInvite = async (id: string) => {
    if (!confirm("Batalkan undangan ini?")) return;
    const res = await fetch(`/api/workspace/invitations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setInvites((p) => p.filter((i) => i.id !== id));
      push({ title: "Undangan dibatalkan", variant: "success" });
    }
  };

  const changeRole = async (userId: string, newRole: Role) => {
    const res = await fetch(`/api/workspace/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      push({ title: "Gagal", description: data.error, variant: "danger" });
      return;
    }
    setMembers((p) => p.map((m) => (m.userId === userId ? { ...m, role: newRole } : m)));
    push({ title: "Role diperbarui", variant: "success" });
  };

  const remove = async (userId: string, isSelf: boolean) => {
    const msg = isSelf ? "Keluar dari workspace ini?" : "Keluarkan anggota dari workspace?";
    if (!confirm(msg)) return;
    const res = await fetch(`/api/workspace/members/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      push({ title: "Gagal", description: data.error, variant: "danger" });
      return;
    }
    setMembers((p) => p.filter((m) => m.userId !== userId));
    push({ title: isSelf ? "Kamu keluar dari workspace" : "Anggota dikeluarkan", variant: "success" });
    if (isSelf) router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Undang anggota baru</CardTitle>
            <CardDescription>
              Masukkan email anggota baru. Mereka akan dapat link undangan untuk diterima.
              Tidak perlu setup email — cukup salin link dan kirim manual.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={invite} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <div className="space-y-1">
                  <Label htmlFor="iemail" className="sr-only">Email</Label>
                  <Input
                    id="iemail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kolega@contoh.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="irole" className="sr-only">Role</Label>
                  <select
                    id="irole"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="h-10 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <Button type="submit" disabled={loading || !email}>
                  <Plus className="h-4 w-4" /> Undang
                </Button>
              </div>
              <p className="text-xs text-[color:var(--muted-foreground)]">{ROLE_DESC[role]}</p>
            </form>

            {newInviteUrl && (
              <div className="mt-4 rounded-[10px] border-2 border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4">
                <div className="text-xs font-semibold text-[color:var(--primary)] mb-2">
                  Undangan dibuat — bagikan link ini ke kolega:
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-xs bg-[color:var(--background)] p-2 rounded truncate">
                    {newInviteUrl}
                  </code>
                  <Button onClick={() => copyInvite(newInviteUrl)} size="sm">
                    <Copy className="h-3 w-3" /> Salin
                  </Button>
                </div>
                <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
                  Berlaku 7 hari. Penerima harus login dengan email yang sama untuk menerima.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Anggota ({members.length})</CardTitle>
          <CardDescription>Anggota workspace ini yang sudah aktif.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-[color:var(--border)]">
            {members.map((m) => {
              const isSelf = m.userId === currentUserId;
              return (
                <div key={m.userId} className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-full bg-[color:var(--primary)]/10 flex items-center justify-center text-[color:var(--primary)] font-semibold text-sm">
                    {(m.name || m.email)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {m.name ?? m.email}
                      {isSelf && <span className="ml-2 text-xs text-[color:var(--muted-foreground)]">(kamu)</span>}
                    </div>
                    <div className="text-xs text-[color:var(--muted-foreground)] truncate">{m.email}</div>
                  </div>
                  {canManage && m.role !== "owner" ? (
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.userId, e.target.value as Role)}
                      className="h-8 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-2 text-xs"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <Badge variant={m.role === "owner" ? "success" : "outline"}>{m.role}</Badge>
                  )}
                  {(canManage || isSelf) && m.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(m.userId, isSelf)}
                      aria-label={isSelf ? "Keluar dari workspace" : "Keluarkan anggota"}
                    >
                      <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Undangan tertunda ({invites.length})</CardTitle>
            <CardDescription>Belum diterima oleh penerima.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-[color:var(--border)]">
              {invites.map((i) => {
                const expired = i.expiresAt < Date.now();
                const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${i.token}`;
                return (
                  <div key={i.id} className="flex items-center gap-3 py-3">
                    <Mail className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{i.email}</div>
                      <div className="text-xs text-[color:var(--muted-foreground)]">
                        Role: {i.role} · {expired ? "Kadaluarsa" : "Aktif"}
                      </div>
                    </div>
                    <Badge variant={expired ? "danger" : "outline"}>{expired ? "Expired" : "Pending"}</Badge>
                    {!expired && (
                      <Button size="sm" variant="ghost" onClick={() => copyInvite(inviteUrl)}>
                        <Copy className="h-3 w-3" /> Link
                      </Button>
                    )}
                    {canManage && (
                      <Button size="icon" variant="ghost" onClick={() => cancelInvite(i.id)} aria-label="Batalkan">
                        <Trash2 className="h-4 w-4 text-[color:var(--danger)]" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!canManage && (
        <p className="text-center text-xs text-[color:var(--muted-foreground)]">
          <UserCheck className="inline h-3 w-3 mr-1" />
          Hanya admin & owner yang bisa kelola anggota.
        </p>
      )}
    </div>
  );
}
