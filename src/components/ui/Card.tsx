import { cn } from "@/lib/ui/cn";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-outline-variant/60 bg-surface-lowest shadow-[var(--shadow-card)]",
        hover &&
          "transition-shadow hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]",
        className,
      )}
      {...props}
    />
  );
}
