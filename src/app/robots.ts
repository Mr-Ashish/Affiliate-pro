import { getPublicBaseUrl } from "@/lib/editorial/public-base-url";

export default function robots() {
  const base = getPublicBaseUrl() || "http://127.0.0.1:3000";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
