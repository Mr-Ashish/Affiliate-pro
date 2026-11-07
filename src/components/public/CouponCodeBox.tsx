import { MaterialIcon } from "@/components/public/MaterialIcon";
import { cn } from "@/lib/ui/cn";

export type CouponCodeBoxProps = {
  code: string;
  className?: string;
  onCopy?: () => void;
  copied?: boolean;
};

const boxClass =
  "font-code inline-flex h-12 min-w-0 items-center justify-between gap-3 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 text-[13px] font-bold uppercase tracking-[0.05em] text-[#0F172A] transition-colors hover:border-[#94A3B8]";

export function CouponCodeBox({ code, className, onCopy, copied }: CouponCodeBoxProps) {
  const icon = (
    <MaterialIcon
      name={copied ? "check" : "content_copy"}
      size={18}
      className={copied ? "text-[#059669]" : "text-[#94A3B8]"}
    />
  );

  if (onCopy) {
    return (
      <button
        type="button"
        aria-label="Copy code"
        onClick={onCopy}
        className={cn(
          boxClass,
          "cursor-pointer focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#10B981]/20",
          className,
        )}
      >
        <span className="truncate">{code}</span>
        {icon}
      </button>
    );
  }

  return (
    <code className={cn(boxClass, className)}>
      <span className="truncate">{code}</span>
      {icon}
    </code>
  );
}
