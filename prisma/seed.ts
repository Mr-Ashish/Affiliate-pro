import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  seedDemoCatalog,
  shouldAllowDemoSeed,
  shouldSeedDemo,
} from "../src/lib/catalog/seed-demo";

const prisma = new PrismaClient();

async function main() {
  await prisma.market.upsert({
    where: { code: "US" },
    update: {
      name: "United States",
      defaultLocale: "en-US",
      isActive: true,
    },
    create: {
      code: "US",
      name: "United States",
      defaultLocale: "en-US",
      isActive: true,
    },
  });

  await prisma.author.upsert({
    where: { slug: "editors" },
    update: { name: "AffiliateHub Editors" },
    create: {
      slug: "editors",
      name: "AffiliateHub Editors",
      bio: "The AffiliateHub editorial team.",
    },
  });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin user seed",
    );
  } else {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin user already exists: ${email}`);
    } else {
      const passwordHash = await hash(password, 12);
      await prisma.adminUser.create({
        data: {
          email,
          passwordHash,
        },
      });
      console.log(`Created admin user: ${email}`);
    }
  }

  // Default (`pnpm db:seed`) stays market + admin only.
  // Demo catalog: `pnpm db:seed -- --demo` or SEED_DEMO=1
  // AWS_SEED_ENV=prod refuses demo even if the flag is set.
  if (shouldSeedDemo(process.argv, process.env)) {
    const awsEnv = process.env.AWS_SEED_ENV ?? "local";
    if (!shouldAllowDemoSeed(awsEnv)) {
      throw new Error(`demo catalog seed is forbidden on ${awsEnv}`);
    }
    const result = await seedDemoCatalog(prisma);
    console.log(
      `Seeded demo catalog: ${result.merchants} merchants, ${result.offers} offers`,
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
