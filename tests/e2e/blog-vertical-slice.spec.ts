import { expect, test } from "@playwright/test";

/**
 * Editorial blog vertical slice smoke:
 * admin login → publish post → /blog/[slug] → home “Savings Tips” → /blog index
 *
 * Prerequisites: Postgres migrated + seeded, app on baseURL (webServer or reuse).
 * Defaults match .env.example: admin@example.com / changeme
 */
test.describe("blog vertical slice", () => {
  test("admin publishes post, public URL and home module show it", async ({
    page,
  }) => {
    const slug = `e2e-blog-${Date.now()}`;
    const title = "E2E Nike calendar";

    const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
    const password = process.env.ADMIN_PASSWORD ?? "changeme";

    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    await page.goto("/admin/posts/new");
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Excerpt").fill("When to buy Nike.");
    await page.getByLabel("Body (Markdown)").fill(
      "## Buy during anniversary sales",
    );
    await page.getByLabel("Status").selectOption("published");
    await page.getByRole("button", { name: "Save post" }).click();
    await expect(page).toHaveURL(/\/admin\/posts\/?$/);

    await page.goto(`/blog/${slug}`);
    await expect(
      page.getByRole("heading", { name: title }),
    ).toBeVisible();
    await expect(page.getByText("anniversary sales")).toBeVisible();

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Savings Tips" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: title })).toBeVisible();

    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  });
});
