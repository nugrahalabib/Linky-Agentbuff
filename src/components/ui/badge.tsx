import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "success" | "warning" | "danger" | "outline" }) {
  const variantCls = {
    default: "bg-[color:var(--muted)] text-[color:var(--foreground)]",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    outline: "border border-[color:var(--border)] text-[color:var(--foreground)]",
  }[variant];
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", variantCls, className)}
      {...props}
    />
  );
}
