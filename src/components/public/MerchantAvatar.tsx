import { cn } from "@/lib/ui/cn";

export type MerchantAvatarProps = {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
};

function monogram(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function MerchantAvatar({
  name,
  logoUrl,
  size = "md",
  className,
}: MerchantAvatarProps) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={cn(
          "rounded-full object-cover ring-1 ring-outline-variant/50",
          sizes[size],
          className,
        )}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary/10 font-bold text-primary-deep ring-1 ring-outline-variant/50",
        sizes[size],
        className,
      )}
    >
      {monogram(name)}
    </span>
  );
}
