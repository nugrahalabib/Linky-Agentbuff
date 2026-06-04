import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <Image
        src="/logo.png"
        alt="Linky"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 object-contain"
      />
      {withText && (
        <span className="font-bold text-lg tracking-tight text-[color:var(--foreground)]">Linky</span>
      )}
    </div>
  );
}
