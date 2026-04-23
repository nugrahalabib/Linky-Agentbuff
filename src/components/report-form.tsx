"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2 } from "lucide-react";

export function ReportForm({ initialSlug }: { initialSlug: string }) {
  const { push } = useToast();
  const [slug, setSlug] = useState(initialSlug);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/abuse-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal kirim", description: data.error, variant: "danger" });
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-6 text-center space-y-3">
        <CheckCircle2 className="h-12 w-12 mx-auto text-[color:var(--success)]" />
        <p className="font-medium">Terima kasih atas laporanmu.</p>
        <p className="text-sm text-[color:var(--muted-foreground)]">Tim kami akan menindaklanjuti dalam 48 jam.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug link (contoh: promo-abc)</Label>
        <Input id="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={50} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reason">Alasan pelaporan</Label>
        <Textarea
          id="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          minLength={5}
          maxLength={500}
          rows={4}
          placeholder="Jelaskan kenapa link ini mencurigakan atau melanggar..."
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Mengirim..." : "Kirim laporan"}
      </Button>
    </form>
  );
}
