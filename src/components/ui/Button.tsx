import { cn } from "@/lib/ui/cn";
import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-deep focus-visible:ring-primary shadow-sm",
  secondary:
    "bg-secondary text-on-secondary hover:bg-secondary-deep focus-visible:ring-secondary shadow-sm",
  outline:
    "border border-outline-variant bg-surface-lowest text-on-surface hover:border-primary hover:text-primary focus-visible:ring-primary",
  ghost:
    "bg-transparent text-on-surface-variant hover:bg-surface-low hover:text-on-surface focus-visible:ring-primary",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-12 px-5 text-sm font-semibold rounded-md",
  lg: "h-12 px-6 text-base font-semibold rounded-lg",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
