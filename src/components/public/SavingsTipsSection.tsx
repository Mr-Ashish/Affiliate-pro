import Link from "next/link";
import { MaterialIcon } from "@/components/public/MaterialIcon";

export type SavingsTipsPost = {
  title: string;
  slug: string;
  excerpt?: string;
  author: { name: string };
  publishedAt: Date | null;
  hero: { url: string; alt: string } | null;
  category?: string | null;
};

export type SavingsTipsSectionProps = {
  posts: SavingsTipsPost[];
};

function formatLongDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function SavingsTipRow({ post }: { post: SavingsTipsPost }) {
  const href = `/blog/${post.slug}`;
  const dateLabel = formatLongDate(post.publishedAt);
  const excerpt = post.excerpt?.trim() ?? "";

  return (
    <article className="flex items-start gap-4">
      <Link
        href={href}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[#E2E8F0] bg-white shadow-sm sm:h-28 sm:w-28"
      >
        {post.hero ? (
          /* eslint-disable-next-line @next/next/no-img-element -- remote hero URLs */
          <img
            src={post.hero.url}
            alt={post.hero.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center bg-[#F8FAFC] text-[#94A3B8]"
            aria-hidden
          >
            <MaterialIcon name="article" size={32} />
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={href}
          className="font-display line-clamp-2 text-lg font-bold leading-snug text-[#0F172A] transition-colors hover:text-[#059669]"
        >
          {post.title}
        </Link>
        <p className="mt-1 text-xs font-medium text-[#64748B]">
          <span className="text-[#334155] underline decoration-transparent transition-colors hover:text-[#059669] hover:decoration-[#059669]">
            {post.author.name}
          </span>
          {dateLabel ? ` • ${dateLabel}` : null}
        </p>
        {excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#475569]">{excerpt}</p>
        ) : null}
        {post.category ? (
          <p className="mt-3 text-right">
            <span className="text-xs text-[#94A3B8]">{post.category}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function SavingsTipsSection({ posts }: SavingsTipsSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section id="blogs" aria-labelledby="savings-tips-heading" className="pt-4">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2
          id="savings-tips-heading"
          className="font-display text-2xl font-bold tracking-tight text-[#0F172A]"
        >
          Savings Tips
        </h2>
        <Link
          href="/blog"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#059669] hover:text-[#047857] hover:underline"
        >
          View all ›
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <SavingsTipRow key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
