const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assertCategorySlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  if (!SLUG.test(normalized)) {
    throw new Error(
      "slug must be lowercase letters, numbers, and hyphens",
    );
  }
  return normalized;
}
