import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { authenticateAdmin } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/password";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://coupon:coupon@localhost:5434/coupon";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const testEmail = "auth-test-admin@example.com";
let createdId: string | null = null;

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const hasDb = await dbAvailable();

describe.skipIf(!hasDb)("authenticateAdmin (DB)", () => {
  beforeAll(async () => {
    await prisma.adminUser.deleteMany({ where: { email: testEmail } });
    const passwordHash = await hashPassword("test-password-123");
    const row = await prisma.adminUser.create({
      data: { email: testEmail, passwordHash },
    });
    createdId = row.id;
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.adminUser.deleteMany({ where: { id: createdId } });
    }
    await prisma.$disconnect();
  });

  it("returns id and email for valid credentials", async () => {
    const admin = await authenticateAdmin(testEmail, "test-password-123");
    expect(admin).toEqual({ id: createdId, email: testEmail });
  });

  it("normalizes email case", async () => {
    const admin = await authenticateAdmin(
      "Auth-Test-Admin@Example.com",
      "test-password-123",
    );
    expect(admin?.id).toBe(createdId);
  });

  it("returns null for wrong password", async () => {
    await expect(
      authenticateAdmin(testEmail, "not-the-password"),
    ).resolves.toBeNull();
  });

  it("returns null for unknown email", async () => {
    await expect(
      authenticateAdmin("nobody@example.com", "test-password-123"),
    ).resolves.toBeNull();
  });

  it("returns null for empty credentials", async () => {
    await expect(authenticateAdmin("", "x")).resolves.toBeNull();
    await expect(authenticateAdmin(testEmail, "")).resolves.toBeNull();
  });
});
