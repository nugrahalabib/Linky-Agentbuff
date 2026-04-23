"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; description?: string; variant?: "default" | "success" | "danger" };

const ToastContext = React.createContext<{ push: (t: Omit<Toast, "id">) => void }>({
  push: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto rounded-[12px] border bg-[color:var(--card)] px-4 py-3 shadow-lg animate-in",
              t.variant === "success" && "border-emerald-500/30",
              t.variant === "danger" && "border-red-500/30",
              t.variant === "default" && "border-[color:var(--border)]",
            )}
          >
            <div className="text-sm font-medium text-[color:var(--card-foreground)]">{t.title}</div>
            {t.description && (
              <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
