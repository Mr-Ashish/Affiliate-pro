import type { LucideIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/ui/cn";

type IconProps = LucideProps & {
  icon: LucideIcon;
};

export function Icon({ icon: Lucide, className, size = 20, ...props }: IconProps) {
  return (
    <Lucide
      aria-hidden={props["aria-label"] ? undefined : true}
      className={cn("shrink-0", className)}
      size={size}
      {...props}
    />
  );
}
