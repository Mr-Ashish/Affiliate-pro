export type BlogPostingInput = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | null;
  updatedAt: Date;
  author: { name: string; slug: string };
  hero: { url: string; alt?: string } | null;
};

export type BlogPostingJsonLd = {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description?: string;
  image?: string[];
  datePublished?: string;
  dateModified: string;
  author: {
    "@type": "Person";
    name: string;
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: "AffiliateHub";
    url?: string;
  };
  url?: string;
  mainEntityOfPage?: string;
};

export function toBlogPostingJsonLd(
  post: BlogPostingInput,
  baseUrl: string,
): BlogPostingJsonLd {
  const base = baseUrl.replace(/\/$/, "");

  const author: BlogPostingJsonLd["author"] = {
    "@type": "Person",
    name: post.author.name,
  };
  if (base) {
    author.url = `${base}/blog/author/${post.author.slug}`;
  }

  const publisher: BlogPostingJsonLd["publisher"] = {
    "@type": "Organization",
    name: "AffiliateHub",
  };
  if (base) {
    publisher.url = base;
  }

  const json: BlogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    dateModified: post.updatedAt.toISOString(),
    author,
    publisher,
  };

  if (post.excerpt) {
    json.description = post.excerpt;
  }
  if (post.publishedAt) {
    json.datePublished = post.publishedAt.toISOString();
  }
  if (post.hero?.url) {
    json.image = [post.hero.url];
  }
  if (base) {
    const pageUrl = `${base}/blog/${post.slug}`;
    json.url = pageUrl;
    json.mainEntityOfPage = pageUrl;
  }

  return json;
}
