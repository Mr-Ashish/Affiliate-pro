const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePostSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assertPostSlug(slug: string): void {
  if (!SLUG.test(slug)) {
    throw new Error("slug must be lowercase kebab-case (a-z, 0-9, hyphens)");
  }
}
