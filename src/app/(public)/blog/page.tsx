import { Container } from "@/components/ui/Container";
import { BlogCard } from "@/components/public/BlogCard";
import { listPublishedPosts } from "@/lib/editorial/posts";
import { catalogOrEmpty } from "@/lib/db-prerender";

/** Must be a numeric literal for Next.js (see PUBLIC_PAGE_REVALIDATE_SECONDS). */
export const revalidate = 120;

export const metadata = {
  title: "Blog",
};

export default async function BlogIndexPage() {
  const posts = await catalogOrEmpty(
    () => listPublishedPosts({ limit: 50 }),
    [],
  );

  return (
    <main>
      <Container className="space-y-8 py-10">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Blog</h1>
        </div>

        {posts.length === 0 ? (
          <p className="text-on-surface-variant">No posts yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <BlogCard
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  publishedAt={post.publishedAt}
                  author={post.author}
                  hero={post.hero}
                />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
