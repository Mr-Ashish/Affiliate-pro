import type { NextConfig } from "next";
import { UNPREFIXED_CATALOG_REDIRECTS } from "./src/lib/market/path";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // CloudFront Origin is *.cloudfront.net; x-forwarded-host is the ALB.
    // Without this, admin Server Actions (login, CRUD) 500 with
    // "Invalid Server Actions request."
    serverActions: {
      allowedOrigins: ["*.cloudfront.net"],
    },
  },
  async redirects() {
    return UNPREFIXED_CATALOG_REDIRECTS;
  },
};

export default nextConfig;
