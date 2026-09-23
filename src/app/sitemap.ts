import type { MetadataRoute } from "next";
import { listActiveMerchants } from "@/lib/catalog/merchants";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { listPublishedPosts } from "@/lib/editorial/posts";
import { getPublicBaseUrl } from "@/lib/editorial/public-base-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicBaseUrl() || "http://127.0.0.1:3000";

  const merchants = await catalogOrEmpty(
    () => listActiveMerchants({ market: "US", limit: 200 }),
    [],
  );
  const posts = await catalogOrEmpty(
    () => listPublishedPosts({ limit: 200 }),
    [],
  );

  return [
    { url: `${base}/` },
    { url: `${base}/stores` },
    { url: `${base}/blog` },
    ...merchants.map((merchant) => ({
      url: `${base}/store/${merchant.slug}`,
    })),
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
    })),
  ];
}
