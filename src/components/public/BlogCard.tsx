import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import { cn } from "@/lib/ui/cn";

export type BlogCardProps = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date | null;
  author: { name: string };
  hero: { url: string; alt: string } | null;
  category?: string | null;
  readMinutes?: number;
  featured?: boolean;
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
  category,
  readMinutes,
  featured = false,
}: BlogCardProps) {
  const href = `/blog/${slug}`;
  const dateLabel = formatPublishedDate(publishedAt);

  return (
    <article className={featured ? "h-full" : undefined}>
      <Card
        hover
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl",
          featured && "md:flex-row",
        )}
      >
        {hero ? (
          <Link href={href} className={cn(featured && "md:w-1/2")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote hero URLs, no next/image remotePatterns */}
            <img
              src={hero.url}
              alt={hero.alt}
              className={cn("w-full object-cover", featured ? "h-56 md:h-full" : "h-40")}
            />
          </Link>
        ) : null}
        <div className={cn("flex flex-1 flex-col gap-3 p-5", featured && "md:p-8")}>
          {category ? (
            <span className="w-fit rounded-full bg-[var(--mint-wash)] px-3 py-1 text-xs font-semibold text-primary-deep">
              {category}
            </span>
          ) : null}
          <h2 className={cn("font-bold text-on-surface", featured ? "text-2xl md:text-3xl" : "text-lg")}>
            <Link href={href} className="hover:text-primary-deep">
              {title}
            </Link>
          </h2>
          <p className={cn("text-sm text-on-surface-variant", featured ? "line-clamp-4" : "line-clamp-3")}>
            {excerpt}
          </p>
          <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
            <span>
              {author.name}
              {dateLabel ? ` · ${dateLabel}` : null}
            </span>
            {readMinutes ? (
              <span className="inline-flex items-center gap-1">
                <MaterialIcon name="schedule" size={14} />
                {readMinutes} min read
              </span>
            ) : null}
          </p>
        </div>
      </Card>
    </article>
  );
}
