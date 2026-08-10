import { cn } from "@/lib/ui/cn";

export type CouponCodeBoxProps = {
  code: string;
  className?: string;
};

export function CouponCodeBox({ code, className }: CouponCodeBoxProps) {
  return (
    <code
      className={cn(
        "font-code inline-flex items-center rounded-md border border-dashed border-secondary/40 bg-emerald-50 px-3 py-1.5 text-sm font-semibold tracking-wider text-secondary-deep",
        className,
      )}
    >
      {code}
    </code>
  );
}
