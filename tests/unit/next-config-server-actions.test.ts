import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("next.config serverActions.allowedOrigins", () => {
  it("allows CloudFront viewer origins so admin Server Actions work behind the CDN", () => {
    const origins = nextConfig.experimental?.serverActions?.allowedOrigins ?? [];
    expect(origins).toContain("*.cloudfront.net");
  });
});
