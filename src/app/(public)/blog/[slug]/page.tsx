import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Container } from "@/components/ui/Container";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { toBlogPostingJsonLd } from "@/lib/editorial/json-ld";
import {
  getPublishedPostBySlug,
  listPublishedPosts,
} from "@/lib/editorial/posts";
import { getPublicBaseUrl } from "@/lib/editorial/public-base-url";
import { renderPostBody } from "@/lib/editorial/render-body";
import type { BodyFormat } from "@/lib/editorial/types";

/** Must be a numeric literal for Next.js (see PUBLIC_PAGE_REVALIDATE_SECONDS). */
export const revalidate = 120;

type Props = {
  params: Promise<{ slug: string }>;
};

const getPost = cache(getPublishedPostBySlug);

export async function generateStaticParams() {
  const posts = await catalogOrEmpty(() => listPublishedPosts(), []);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return { title: "Post not found" };
  }
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
  };
}

function formatPublishedDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }

  const jsonLd = toBlogPostingJsonLd(
    {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      author: { name: post.author.name, slug: post.author.slug },
      hero: post.hero,
    },
    getPublicBaseUrl(),
  );
  const dateLabel = formatPublishedDate(post.publishedAt);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Container className="space-y-6 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-on-surface-variant">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/blog" className="hover:text-primary">
                Blog
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-on-surface">{post.title}</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-on-surface">{post.title}</h1>
        <p className="text-sm text-on-surface-variant">
          {post.author.name}
          {dateLabel ? ` · ${dateLabel}` : null}
        </p>

        {post.hero ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hero URLs, no next/image remotePatterns
          <img
            src={post.hero.url}
            alt={post.hero.alt}
            className="w-full"
          />
        ) : null}

        <article
          className="[&_a]:text-primary [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{
            __html: renderPostBody(post.body, post.bodyFormat as BodyFormat),
          }}
        />

        {post.merchants.length > 0 ? (
          <section aria-labelledby="related-merchants-heading">
            <h2
              id="related-merchants-heading"
              className="text-xl font-bold text-on-surface"
            >
              Related merchants
            </h2>
            <ul className="mt-3 list-disc pl-5">
              {post.merchants.map((merchant) => (
                <li key={merchant.id}>
                  <Link
                    href={`/store/${merchant.slug}`}
                    className="text-primary hover:underline"
                  >
                    {merchant.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
