import { expect, test } from "@playwright/test";

/**
 * Plan 1 vertical slice smoke:
 * admin login → merchant → active coupon → store page → /go 302
 *
 * Prerequisites: Postgres migrated + seeded, app on baseURL (webServer or reuse).
 * Defaults match .env.example: admin@example.com / changeme
 */
test.describe("vertical slice", () => {
  test("admin create merchant+offer, public store, go redirects", async ({
    page,
    request,
  }) => {
    const stamp = Date.now();
    const slug = `e2e-merchant-${stamp}`;
    const merchantName = `E2E Merchant ${stamp}`;
    const offerTitle = `E2E Coupon ${stamp}`;
    const code = `SAVE${stamp}`;
    const affiliateUrl = "https://example.com/affiliate-dest";

    const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
    const password = process.env.ADMIN_PASSWORD ?? "changeme";

    // 1. Login admin
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    // 2. Create merchant with unique slug
    await page.goto("/admin/merchants/new");
    await page.getByLabel("Name").fill(merchantName);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Site URL").fill("https://example.com");
    await page.getByRole("button", { name: "Create merchant" }).click();
    await expect(page).toHaveURL(/\/admin\/merchants\/?$/);
    await expect(page.getByText(slug)).toBeVisible();

    // 3. Create active coupon offer
    await page.goto("/admin/offers/new");
    await page
      .locator("#merchantId")
      .selectOption({ label: `${merchantName} (US/${slug})` });
    await page.getByLabel("Title").fill(offerTitle);
    await page.getByLabel("Offer type").selectOption("coupon");
    await page.getByLabel("Code (optional)").fill(code);
    await page.getByLabel("Affiliate URL").fill(affiliateUrl);
    await page.getByLabel("Status").selectOption("active");
    await page.getByRole("button", { name: "Create offer" }).click();
    await expect(page).toHaveURL(/\/admin\/offers\/?$/);
    await expect(page.getByText(offerTitle)).toBeVisible();

    // 4. Visit /store/{slug} and see offer
    await page.goto(`/store/${slug}`);
    await expect(
      page.getByRole("heading", { name: merchantName, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(offerTitle)).toBeVisible();
    await expect(page.getByText(code)).toHaveCount(0);

    await page.evaluate(() => {
      const w = window as unknown as { __opened: string[] };
      w.__opened = [];
      window.open = (url) => {
        w.__opened.push(String(url));
        return null;
      };
    });
    await page.getByRole("button", { name: "Get Code" }).click();
    await expect(page.getByText(code)).toBeVisible();
    const href = await page.evaluate(
      () => (window as unknown as { __opened: string[] }).__opened[0],
    );
    expect(href).toMatch(/^\/go\/[0-9a-f-]+$/i);
    const offerId = href!.slice("/go/".length);

    // 5. /go/{id} → 302 to affiliate URL (do not follow)
    const response = await request.get(`/go/${offerId}`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(response.headers()["location"]).toBe(affiliateUrl);
  });
});
