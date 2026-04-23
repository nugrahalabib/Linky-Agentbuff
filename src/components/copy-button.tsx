"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { push } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      push({ title: "Tersalin!", variant: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      push({ title: "Gagal menyalin", variant: "danger" });
    }
  };
  return (
    <Button type="button" onClick={copy} size="sm" variant={copied ? "secondary" : "outline"}>
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      {label ?? (copied ? "Tersalin" : "Salin")}
    </Button>
  );
}
