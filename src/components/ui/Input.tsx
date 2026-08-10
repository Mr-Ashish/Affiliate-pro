import { cn } from "@/lib/ui/cn";
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-outline-variant bg-surface-lowest px-3 text-sm text-on-surface",
        "placeholder:text-on-surface-variant/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
