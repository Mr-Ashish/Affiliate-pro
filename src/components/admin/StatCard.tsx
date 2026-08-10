import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/ui/cn";

export type StatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-on-surface">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-on-surface-variant">{hint}</p>
      ) : null}
    </Card>
  );
}
