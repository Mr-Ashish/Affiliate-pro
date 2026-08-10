import { cn } from "@/lib/ui/cn";
import type { HTMLAttributes } from "react";

export type BadgeTone =
  | "active"
  | "expired"
  | "draft"
  | "ending-soon"
  | "exclusive"
  | "featured"
  | "neutral";

const tones: Record<BadgeTone, string> = {
  active: "bg-emerald-50 text-secondary-deep",
  expired: "bg-error-container text-error",
  draft: "bg-surface-high text-on-surface-variant",
  "ending-soon": "bg-amber-50 text-tertiary",
  exclusive: "bg-violet-50 text-violet-800",
  featured: "bg-blue-50 text-primary-deep",
  neutral: "bg-surface-container text-on-surface-variant",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
