import { afterEach, describe, expect, it } from "vitest";
import { toBlogPostingJsonLd } from "@/lib/editorial/json-ld";
import { getPublicBaseUrl } from "@/lib/editorial/public-base-url";

const post = {
  slug: "nike-sale-calendar",
  title: "Nike sale calendar",
  excerpt: "When to buy.",
  publishedAt: new Date("2026-09-23T12:00:00.000Z"),
  updatedAt: new Date("2026-09-23T12:00:00.000Z"),
  author: { name: "AffiliateHub Editors", slug: "editors" },
  hero: { url: "https://cdn.example/nike.jpg", alt: "Nike" },
};

describe("toBlogPostingJsonLd", () => {
  it("emits BlogPosting with author and hero image", () => {
    const json = toBlogPostingJsonLd(post, "https://example.com");
    expect(json["@type"]).toBe("BlogPosting");
    expect(json.headline).toBe("Nike sale calendar");
    expect(json.author).toEqual({
      "@type": "Person",
      name: "AffiliateHub Editors",
      url: "https://example.com/blog/author/editors",
    });
    expect(json.image).toEqual(["https://cdn.example/nike.jpg"]);
    expect(json.mainEntityOfPage).toBe("https://example.com/blog/nike-sale-calendar");
    expect(json.datePublished).toBe("2026-09-23T12:00:00.000Z");
    expect(json.dateModified).toBe("2026-09-23T12:00:00.000Z");
    expect(json.publisher).toEqual({
      "@type": "Organization",
      name: "AffiliateHub",
      url: "https://example.com",
    });
  });

  it("omits absolute url fields when base is empty", () => {
    const json = toBlogPostingJsonLd(post, "");
    expect(json["@type"]).toBe("BlogPosting");
    expect(json.headline).toBe("Nike sale calendar");
    expect(json.datePublished).toBe("2026-09-23T12:00:00.000Z");
    expect(json.dateModified).toBe("2026-09-23T12:00:00.000Z");
    expect(json.author).toEqual({
      "@type": "Person",
      name: "AffiliateHub Editors",
    });
    expect(json.publisher).toEqual({
      "@type": "Organization",
      name: "AffiliateHub",
    });
    expect(json).not.toHaveProperty("url");
    expect(json).not.toHaveProperty("mainEntityOfPage");
  });
});

describe("getPublicBaseUrl", () => {
  const prevAuth = process.env.AUTH_URL;
  const prevPublic = process.env.PUBLIC_BASE_URL;

  afterEach(() => {
    if (prevAuth === undefined) {
      delete process.env.AUTH_URL;
    } else {
      process.env.AUTH_URL = prevAuth;
    }
    if (prevPublic === undefined) {
      delete process.env.PUBLIC_BASE_URL;
    } else {
      process.env.PUBLIC_BASE_URL = prevPublic;
    }
  });

  it("prefers AUTH_URL and strips a trailing slash", () => {
    process.env.AUTH_URL = "https://example.com/";
    process.env.PUBLIC_BASE_URL = "https://ignored.example/";
    expect(getPublicBaseUrl()).toBe("https://example.com");
  });

  it("falls back to PUBLIC_BASE_URL then empty string", () => {
    delete process.env.AUTH_URL;
    process.env.PUBLIC_BASE_URL = "https://cdn.example.com/";
    expect(getPublicBaseUrl()).toBe("https://cdn.example.com");
    delete process.env.PUBLIC_BASE_URL;
    expect(getPublicBaseUrl()).toBe("");
  });
});
