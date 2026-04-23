import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}>
      {icon && (
        <div className="mb-4 h-14 w-14 rounded-full bg-[color:var(--muted)] flex items-center justify-center text-[color:var(--muted-foreground)]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
      {description && <p className="mt-2 text-sm text-[color:var(--muted-foreground)] max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
