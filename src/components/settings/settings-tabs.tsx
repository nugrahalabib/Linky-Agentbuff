"use client";

import { useState } from "react";
import { AlertTriangle, Database, Lock, Palette, User, Building2 } from "lucide-react";

type TabId = "profile" | "security" | "workspace" | "preferences" | "data" | "danger";

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "profile", label: "Profil", icon: <User className="h-4 w-4" /> },
  { id: "security", label: "Keamanan", icon: <Lock className="h-4 w-4" /> },
  { id: "workspace", label: "Workspace", icon: <Building2 className="h-4 w-4" /> },
  { id: "preferences", label: "Tampilan", icon: <Palette className="h-4 w-4" /> },
  { id: "data", label: "Data", icon: <Database className="h-4 w-4" /> },
  { id: "danger", label: "Danger zone", icon: <AlertTriangle className="h-4 w-4" /> },
];

export function SettingsTabs({
  profile,
  security,
  workspace,
  preferences,
  data,
  danger,
}: Record<TabId, React.ReactNode>) {
  const [tab, setTab] = useState<TabId>("profile");
  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-[10px] bg-[color:var(--muted)] p-1 w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 h-8 text-sm font-medium whitespace-nowrap ${
              tab === t.id
                ? t.id === "danger"
                  ? "bg-[color:var(--background)] text-rose-600 dark:text-rose-400 shadow-sm"
                  : "bg-[color:var(--background)] text-[color:var(--foreground)] shadow-sm"
                : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tab === "profile" && profile}
        {tab === "security" && security}
        {tab === "workspace" && workspace}
        {tab === "preferences" && preferences}
        {tab === "data" && data}
        {tab === "danger" && danger}
      </div>
    </div>
  );
}
