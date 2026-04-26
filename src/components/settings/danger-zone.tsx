"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Props {
  workspaceName: string;
  email: string;
}

export function DangerZone({ workspaceName, email }: Props) {
  const { push } = useToast();
  const router = useRouter();

  const [wipeConfirm, setWipeConfirm] = useState("");
  const [wiping, setWiping] = useState(false);

  const [delEmail, setDelEmail] = useState("");
  const [delPassword, setDelPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const wipeLinks = async () => {
    if (wipeConfirm !== workspaceName) return;
    if (!window.confirm("Beneran hapus SEMUA link + analitik di workspace ini? Tidak bisa di-undo.")) return;
    setWiping(true);
    try {
      const res = await fetch("/api/account/wipe-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: wipeConfirm }),
      });
      const d = await res.json();
      if (!res.ok) {
        push({ title: "Gagal", description: d.error, variant: "danger" });
        return;
      }
      push({ title: `${d.deleted} link dihapus`, variant: "success" });
      setWipeConfirm("");
      router.refresh();
    } finally {
      setWiping(false);
    }
  };

  const deleteAccount = async () => {
    if (delEmail.trim().toLowerCase() !== email.toLowerCase() || !delPassword) return;
    if (
      !window.confirm(
        "BENERAN hapus akun + SEMUA data permanen? Workspace, link, analitik, Linky Pages, API key, webhook — semua hilang. Tidak bisa di-undo.",
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: delPassword, confirmEmail: delEmail }),
      });
      const d = await res.json();
      if (!res.ok) {
        push({ title: "Gagal hapus akun", description: d.error, variant: "danger" });
        return;
      }
      // Already destroyed session; bounce to landing
      window.location.href = "/";
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-rose-500/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-5 w-5" /> Danger zone
        </CardTitle>
        <CardDescription>Aksi di bawah ini permanen dan tidak bisa di-undo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-[10px] border border-rose-500/30 p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold">Hapus semua link</div>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
              Menghapus seluruh link + klik + QR di workspace <strong>{workspaceName}</strong>. Akun + Linky Page tetap ada.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wipeconf">
              Ketik nama workspace untuk konfirmasi: <code>{workspaceName}</code>
            </Label>
            <Input
              id="wipeconf"
              value={wipeConfirm}
              onChange={(e) => setWipeConfirm(e.target.value)}
              placeholder={workspaceName}
              autoComplete="off"
            />
          </div>
          <Button
            variant="danger"
            onClick={wipeLinks}
            disabled={wiping || wipeConfirm !== workspaceName}
          >
            <Trash2 className="h-4 w-4" />
            {wiping ? "Menghapus..." : "Hapus semua link"}
          </Button>
        </div>

        <div className="rounded-[10px] border border-rose-500/30 p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold">Hapus akun permanen</div>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
              Menghapus akun + workspace + semua data secara permanen. Email <strong>{email}</strong> jadi tersedia untuk daftar ulang.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delemail">
              Ketik email akunmu: <code>{email}</code>
            </Label>
            <Input
              id="delemail"
              type="email"
              value={delEmail}
              onChange={(e) => setDelEmail(e.target.value)}
              placeholder={email}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="delpass">Kata sandi akunmu</Label>
            <Input
              id="delpass"
              type="password"
              value={delPassword}
              onChange={(e) => setDelPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button
            variant="danger"
            onClick={deleteAccount}
            disabled={
              deleting ||
              delEmail.trim().toLowerCase() !== email.toLowerCase() ||
              !delPassword
            }
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Menghapus..." : "Hapus akun permanen"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
