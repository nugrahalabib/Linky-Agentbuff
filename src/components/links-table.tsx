"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Link as DbLink } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LinkListItem } from "@/components/link-list-item";

export function LinksTable({ initialLinks, appUrl }: { initialLinks: DbLink[]; appUrl: string }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return initialLinks;
    const needle = q.toLowerCase();
    return initialLinks.filter(
      (l) =>
        l.slug.toLowerCase().includes(needle) ||
        l.destinationUrl.toLowerCase().includes(needle) ||
        (l.title?.toLowerCase().includes(needle) ?? false),
    );
  }, [initialLinks, q]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative mb-4">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
          <Input
            placeholder="Cari link..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Cari link"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-sm text-[color:var(--muted-foreground)]">
            Tidak ada link yang cocok.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[color:var(--border)]">
            {filtered.map((l) => (
              <LinkListItem key={l.id} link={l} appUrl={appUrl} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
