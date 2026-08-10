import { cn } from "@/lib/ui/cn";
import type { HTMLAttributes } from "react";

export type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--container-max)] px-[var(--gutter)]",
        className,
      )}
      {...props}
    />
  );
}
