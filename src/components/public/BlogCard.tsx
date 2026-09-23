import Link from "next/link";
import { Card } from "@/components/ui/Card";

export type BlogCardProps = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date | null;
  author: { name: string };
  hero: { url: string; alt: string } | null;
};

function formatPublishedDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogCard({
  title,
  slug,
  excerpt,
  publishedAt,
  author,
  hero,
}: BlogCardProps) {
  const href = `/blog/${slug}`;
  const dateLabel = formatPublishedDate(publishedAt);

  return (
    <article>
      <Card hover className="flex h-full flex-col overflow-hidden">
        {hero ? (
          <Link href={href}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote hero URLs, no next/image remotePatterns */}
            <img
              src={hero.url}
              alt={hero.alt}
              className="h-40 w-full object-cover"
            />
          </Link>
        ) : null}
        <div className="flex flex-1 flex-col gap-2 p-5">
          <h2 className="text-lg font-semibold text-on-surface">
            <Link href={href} className="hover:text-primary">
              {title}
            </Link>
          </h2>
          <p className="line-clamp-3 text-sm text-on-surface-variant">
            {excerpt}
          </p>
          <p className="mt-auto text-xs text-on-surface-variant">
            {author.name}
            {dateLabel ? ` · ${dateLabel}` : null}
          </p>
        </div>
      </Card>
    </article>
  );
}
