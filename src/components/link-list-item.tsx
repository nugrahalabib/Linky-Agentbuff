"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, BarChart2, Check, Copy, Lock, Clock } from "lucide-react";
import type { Link as DbLink } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn, formatNumber, hostOf, relativeTime, truncate } from "@/lib/utils";

export function LinkListItem({ link, appUrl, compact = false }: { link: DbLink; appUrl: string; compact?: boolean }) {
  const shortUrl = `${appUrl}/${link.slug}`;
  const [copied, setCopied] = useState(false);
  const { push } = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      push({ title: "Tersalin!", variant: "success" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      push({ title: "Gagal menyalin", variant: "danger" });
    }
  };

  return (
    <div className={cn("flex items-center gap-3 py-3", compact && "py-2")}>
      <div className="shrink-0 h-10 w-10 rounded-[10px] bg-[color:var(--muted)] flex items-center justify-center overflow-hidden">
        {link.faviconUrl ? (
          <Image
            src={link.faviconUrl}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6"
            unoptimized
          />
        ) : (
          <ArrowUpRight className="h-5 w-5 text-[color:var(--muted-foreground)]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/links/${link.id}`}
            className="text-sm font-medium text-[color:var(--foreground)] truncate hover:underline"
          >
            {appUrl.replace(/^https?:\/\//, "")}/{link.slug}
          </Link>
          {link.passwordHash && (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Password
            </Badge>
          )}
          {link.expiresAt && (
            <Badge variant="warning" className="gap-1">
              <Clock className="h-3 w-3" />
              Expires
            </Badge>
          )}
        </div>
        <div className="mt-0.5 text-xs text-[color:var(--muted-foreground)] truncate">
          → {truncate(link.title || hostOf(link.destinationUrl) || link.destinationUrl, 60)}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <div className="text-xs text-[color:var(--muted-foreground)]">{relativeTime(link.createdAt)}</div>
        <div className="flex items-center gap-1 rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-xs">
          <BarChart2 className="h-3 w-3" />
          <span className="font-medium tabular-nums">{formatNumber(link.clickCount)}</span>
        </div>
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={copy}
        aria-label="Salin link"
        title="Salin"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
