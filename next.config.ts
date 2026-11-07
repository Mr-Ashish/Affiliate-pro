import type { NextConfig } from "next";

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
};

export default nextConfig;
