"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function DeleteLinkButton({ linkId }: { linkId: string }) {
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();

  const remove = async () => {
    if (!confirm("Hapus link ini? Klik yang sudah terjadi tetap tercatat, tapi link tidak bisa dipulihkan.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/links/${linkId}`, { method: "DELETE" });
      if (!res.ok) {
        push({ title: "Gagal menghapus", variant: "danger" });
        return;
      }
      push({ title: "Link dihapus", variant: "success" });
      router.replace("/dashboard/links");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="danger" onClick={remove} disabled={loading}>
      <Trash2 className="h-4 w-4" />
      {loading ? "Menghapus..." : "Hapus link permanen"}
    </Button>
  );
}
