import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { countActiveMerchants, createMerchant } from "@/lib/catalog/merchants";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://coupon:coupon@localhost:5434/coupon";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const createdMerchantIds: string[] = [];

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const hasDb = await dbAvailable();

describe.skipIf(!hasDb)("countActiveMerchants (DB)", () => {
  afterAll(async () => {
    if (createdMerchantIds.length > 0) {
      await prisma.merchant.deleteMany({
        where: { id: { in: createdMerchantIds } },
      });
    }
    await prisma.$disconnect();
  });

  function uniqueSlug(prefix: string) {
    return `${prefix}-${randomUUID().slice(0, 8)}`;
  }

  it("counts only active merchants for the market", async () => {
    const active = await createMerchant({
      market: "US",
      slug: uniqueSlug("active-count"),
      name: "Active Count Store",
      siteUrl: "https://example.com",
      isActive: true,
    });
    createdMerchantIds.push(active.id);

    const inactive = await createMerchant({
      market: "US",
      slug: uniqueSlug("inactive-count"),
      name: "Inactive Count Store",
      siteUrl: "https://example.com",
      isActive: false,
    });
    createdMerchantIds.push(inactive.id);

    // Avoid before/after deltas — parallel suites also insert US merchants.
    const counted = await countActiveMerchants({ market: "US" });
    const expected = await prisma.merchant.count({
      where: { market: "US", isActive: true },
    });
    expect(counted).toBe(expected);

    const activeRow = await prisma.merchant.findUnique({ where: { id: active.id } });
    const inactiveRow = await prisma.merchant.findUnique({ where: { id: inactive.id } });
    expect(activeRow?.isActive).toBe(true);
    expect(inactiveRow?.isActive).toBe(false);
    expect(counted).toBeGreaterThanOrEqual(1);
  });
});
