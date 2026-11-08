import type { MetadataRoute } from "next";
import { listActiveMerchants } from "@/lib/catalog/merchants";
import { catalogOrEmpty } from "@/lib/db-prerender";
import { listPublishedPosts } from "@/lib/editorial/posts";
import { getPublicBaseUrl } from "@/lib/editorial/public-base-url";
import { listPublicCategories } from "@/lib/catalog/categories";
import { marketPath } from "@/lib/market/path";

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
  const categories = await catalogOrEmpty(() => listPublicCategories("US"), []);

  return [
    { url: `${base}${marketPath("US")}` },
    { url: `${base}${marketPath("US", "/stores")}` },
    { url: `${base}${marketPath("US", "/blog")}` },
    { url: `${base}${marketPath("US", "/categories")}` },
    ...categories.map((category) => ({
      url: `${base}${marketPath("US", `/category/${category.slug}`)}`,
    })),
    ...merchants.map((merchant) => ({
      url: `${base}${marketPath(merchant.market, `/store/${merchant.slug}`)}`,
    })),
    ...posts.map((post) => ({
      url: `${base}${marketPath("US", `/blog/${post.slug}`)}`,
      lastModified: post.updatedAt,
    })),
  ];
}
