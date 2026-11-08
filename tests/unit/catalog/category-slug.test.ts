import { describe, expect, it } from "vitest";
import { assertCategorySlug, slugifyCategoryName } from "@/lib/catalog/category-slug";
import { STARTER_CATEGORIES } from "@/lib/catalog/starter-categories";

describe("category slugs", () => {
  it("slugifies a display name", () => {
    expect(slugifyCategoryName("Home & Garden")).toBe("home-and-garden");
  });

  it("accepts a lowercase hyphen slug", () => {
    expect(assertCategorySlug("Baby-Kids")).toBe("baby-kids");
  });

  it("rejects spaces", () => {
    expect(() => assertCategorySlug("home garden")).toThrow(/slug/i);
  });
});

describe("starter categories", () => {
  it("defines twelve unique slugs", () => {
    const slugs = STARTER_CATEGORIES.map((row) => row.slug);
    expect(slugs).toHaveLength(12);
    expect(new Set(slugs).size).toBe(12);
    for (const slug of slugs) expect(assertCategorySlug(slug)).toBe(slug);
  });
});
