import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-8 w-8 shrink-0">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="url(#logoGrad)" />
        <path d="M22 32a8 8 0 0 1 8-8h4" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M42 32a8 8 0 0 1-8 8h-4" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M26 32h12" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      </svg>
      {withText && (
        <span className="font-bold text-lg tracking-tight text-[color:var(--foreground)]">Linky</span>
      )}
    </div>
  );
}
