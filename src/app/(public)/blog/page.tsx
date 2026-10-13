import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BlogCard } from "@/components/public/BlogCard";
import { MaterialIcon } from "@/components/public/MaterialIcon";
import {
  listPublishedCategories,
  listPublishedPosts,
} from "@/lib/editorial/posts";
import { estimateReadMinutes } from "@/lib/editorial/read-time";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { cn } from "@/lib/ui/cn";

/** Must be a numeric literal for Next.js (see PUBLIC_PAGE_REVALIDATE_SECONDS). */
export const revalidate = 120;

export const metadata = {
  title: "Blog",
};

const pillBase = "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors";
const pillActive = "border-[var(--hero-navy)] bg-[var(--hero-navy)] text-white";
const pillIdle = "border-outline-variant bg-surface-lowest text-on-surface hover:border-primary-deep hover:text-primary-deep";

function blogHref(params: { category?: string; q?: string }): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  const qs = sp.toString();
  return qs ? `/blog?${qs}` : "/blog";
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const query = (q ?? "").trim();
  const selected = (category ?? "").trim();
  const [posts, categories] = await Promise.all([
    catalogOrEmpty(
      () =>
        listPublishedPosts({
          limit: 50,
          q: query || undefined,
          category: selected || undefined,
        }),
      [],
    ),
    catalogOrEmpty(() => listPublishedCategories(), []),
  ]);

  const featuredPost = posts.find((post) => post.isFeatured) ?? posts[0];
  const rest = featuredPost ? posts.filter((post) => post.id !== featuredPost.id) : [];

  return (
    <main>
      <Container className="space-y-10 py-10">
        <div>
          <h1 className="text-3xl font-bold text-on-surface md:text-4xl">Savings tips</h1>
          <p className="mt-2 text-on-surface-variant">Guides and tactics to stack coupons and save more.</p>
        </div>
        <form className="flex flex-wrap gap-2" action="/blog">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search title or excerpt"
            aria-label="Search posts"
            className="h-12 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-lowest px-4 outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/30"
          />
          {selected ? <input type="hidden" name="category" value={selected} /> : null}
          <button
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-[var(--primary-hover)]"
            type="submit"
          >
            <MaterialIcon name="search" size={18} />
            Search
          </button>
        </form>
        <div className="flex flex-wrap gap-2" role="navigation" aria-label="Categories">
          <Link
            href={blogHref({ q: query || undefined })}
            aria-current={selected ? undefined : "page"}
            className={cn(pillBase, selected ? pillIdle : pillActive)}
          >
            All
          </Link>
          {categories.map((name) => (
            <Link
              key={name}
              href={blogHref({ category: name, q: query || undefined })}
              aria-current={selected === name ? "page" : undefined}
              className={cn(pillBase, selected === name ? pillActive : pillIdle)}
            >
              {name}
            </Link>
          ))}
        </div>

        {!featuredPost ? (
          <p className="text-on-surface-variant">No posts yet.</p>
        ) : (
          <>
            <BlogCard
              featured
              title={featuredPost.title}
              slug={featuredPost.slug}
              excerpt={featuredPost.excerpt}
              publishedAt={featuredPost.publishedAt}
              author={featuredPost.author}
              hero={featuredPost.hero}
              category={featuredPost.category}
              readMinutes={estimateReadMinutes(featuredPost.excerpt)}
            />
            {rest.length > 0 ? (
              <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <li key={post.id}>
                    <BlogCard
                      title={post.title}
                      slug={post.slug}
                      excerpt={post.excerpt}
                      publishedAt={post.publishedAt}
                      author={post.author}
                      hero={post.hero}
                      category={post.category}
                      readMinutes={estimateReadMinutes(post.excerpt)}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </Container>
    </main>
  );
}
