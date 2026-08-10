import Link from "next/link";
import { Button } from "@/components/ui/Button";

export type ComingSoonProps = {
  title: string;
  description?: string;
};

export function ComingSoon({
  title,
  description = "This section is on the roadmap. Browse stores in the meantime.",
}: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
        Coming soon
      </p>
      <h1 className="mb-3 text-3xl font-bold text-on-surface">{title}</h1>
      <p className="mb-8 text-on-surface-variant">{description}</p>
      <Link href="/stores">
        <Button variant="primary">Browse stores</Button>
      </Link>
    </div>
  );
}
