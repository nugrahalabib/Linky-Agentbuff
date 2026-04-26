"use client";

import { useState } from "react";
import { BookOpen, KeyRound, Webhook, TerminalSquare } from "lucide-react";

type TabId = "quickstart" | "keys" | "webhooks" | "console";

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "quickstart", label: "Quickstart", icon: <BookOpen className="h-4 w-4" /> },
  { id: "keys", label: "API Keys", icon: <KeyRound className="h-4 w-4" /> },
  { id: "webhooks", label: "Webhooks", icon: <Webhook className="h-4 w-4" /> },
  { id: "console", label: "Test Console", icon: <TerminalSquare className="h-4 w-4" /> },
];

export function DeveloperTabs({
  baseUrl: _baseUrl,
  keysSlot,
  webhooksSlot,
  quickstartSlot,
  consoleSlot,
}: {
  baseUrl: string;
  keysSlot: React.ReactNode;
  webhooksSlot: React.ReactNode;
  quickstartSlot: React.ReactNode;
  consoleSlot: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabId>("quickstart");

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-[10px] bg-[color:var(--muted)] p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 h-8 text-sm font-medium ${
              tab === t.id
                ? "bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm"
                : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tab === "quickstart" && quickstartSlot}
        {tab === "keys" && keysSlot}
        {tab === "webhooks" && webhooksSlot}
        {tab === "console" && consoleSlot}
      </div>
    </div>
  );
}
