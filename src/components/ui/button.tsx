"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary-hover)] shadow-sm shadow-[color:var(--primary)]/10",
        secondary:
          "bg-[color:var(--muted)] text-[color:var(--foreground)] hover:bg-[color:var(--border)]",
        outline:
          "border border-[color:var(--border)] bg-[color:var(--card)] hover:bg-[color:var(--muted)] text-[color:var(--foreground)]",
        ghost:
          "bg-transparent hover:bg-[color:var(--muted)] text-[color:var(--foreground)]",
        danger:
          "bg-[color:var(--danger)] text-white hover:brightness-95",
        gradient:
          "bg-gradient-to-r from-brand-600 to-accent-500 text-white hover:from-brand-700 hover:to-accent-600 shadow-md shadow-brand-600/20",
        link:
          "bg-transparent underline-offset-4 hover:underline text-[color:var(--primary)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-sm",
        xl: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
export { buttonVariants };
