import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createPost,
  getPostById,
  getPublishedPostBySlug,
  listPosts,
  listPublishedPosts,
  listPublishedPostsForMerchant,
  updatePost,
} from "@/lib/editorial/posts";
import { listApprovedComments } from "@/lib/editorial/comments";

const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://coupon:coupon@localhost:5434/coupon";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const createdMerchantIds: string[] = [];
const createdPostIds: string[] = [];
const createdMediaIds: string[] = [];

async function dbAvailable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

const hasDb = await dbAvailable();

function uniqueSlug(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

async function trackPostMedia(postId: string) {
  const joins = await prisma.postMedia.findMany({ where: { postId } });
  for (const join of joins) {
    createdMediaIds.push(join.mediaId);
  }
}

describe.skipIf(!hasDb)("editorial posts (DB)", () => {
  beforeAll(async () => {
    const market = await prisma.market.findUnique({ where: { code: "US" } });
    if (!market) {
      await prisma.market.create({
        data: {
          code: "US",
          name: "United States",
          defaultLocale: "en-US",
          isActive: true,
        },
      });
    }

    const editors = await prisma.author.findUnique({
      where: { slug: "editors" },
    });
    if (!editors) {
      await prisma.author.create({
        data: {
          slug: "editors",
          name: "AffiliateHub Editors",
          bio: "The AffiliateHub editorial team.",
        },
      });
    }
  });

  afterAll(async () => {
    if (createdPostIds.length > 0) {
      await prisma.comment.deleteMany({
        where: { postId: { in: createdPostIds } },
      });
      await prisma.post.deleteMany({
        where: { id: { in: createdPostIds } },
      });
    }
    if (createdMediaIds.length > 0) {
      await prisma.mediaAsset.deleteMany({
        where: { id: { in: createdMediaIds } },
      });
    }
    if (createdMerchantIds.length > 0) {
      await prisma.merchant.deleteMany({
        where: { id: { in: createdMerchantIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("createPost stores hero media and related merchant", async () => {
    const merchant = await prisma.merchant.create({
      data: {
        market: "US",
        slug: uniqueSlug("ed-m"),
        name: "Nike",
        siteUrl: "https://www.nike.com",
      },
    });
    createdMerchantIds.push(merchant.id);

    const slug = uniqueSlug("nike-sale-calendar");
    const post = await createPost({
      title: "Nike sale calendar",
      slug,
      excerpt: "When Nike puts shoes on sale.",
      body: "## When to buy\nWait for anniversary.",
      status: "published",
      heroImageUrl: "https://cdn.example/nike.jpg",
      heroImageAlt: "Nike shoes",
      merchantIds: [merchant.id],
    });
    createdPostIds.push(post.id);
    await trackPostMedia(post.id);

    expect(post.author.slug).toBe("editors");
    expect(post.hero?.url).toBe("https://cdn.example/nike.jpg");
    expect(post.hero?.alt).toBe("Nike shoes");
    expect(post.merchants.map((m) => m.id)).toContain(merchant.id);
    expect(post.merchants.map((m) => m.slug)).toContain(merchant.slug);

    const mediaJoin = await prisma.postMedia.findFirst({
      where: { postId: post.id, role: "hero" },
      include: { media: true },
    });
    expect(mediaJoin?.role).toBe("hero");
    expect(mediaJoin?.sortOrder).toBe(0);
    expect(mediaJoin?.media.url).toBe("https://cdn.example/nike.jpg");
    expect(mediaJoin?.media.alt).toBe("Nike shoes");

    const links = await prisma.postMerchant.findMany({
      where: { postId: post.id },
    });
    expect(links.map((row) => row.merchantId)).toEqual([merchant.id]);

    const row = await prisma.post.findUnique({ where: { id: post.id } });
    expect(row?.bodyFormat).toBe("markdown");
    expect(row?.status).toBe("published");
    expect(row?.publishedAt).toBeTruthy();

    const listed = await listPublishedPosts({ limit: 50 });
    expect(listed.map((p) => p.slug)).toContain(slug);

    const related = await listPublishedPostsForMerchant(merchant.id);
    expect(related.map((p) => p.id)).toContain(post.id);

    const bySlug = await getPublishedPostBySlug(slug);
    expect(bySlug?.body).toBe("## When to buy\nWait for anniversary.");
    expect(bySlug?.bodyFormat).toBe("markdown");
  });

  it("defaults author to seeded editors when authorId is omitted", async () => {
    const slug = uniqueSlug("editors-default");
    const post = await createPost({
      title: "Editors default",
      slug,
      excerpt: "Assigned to the desk.",
      body: "Body copy.",
      status: "draft",
    });
    createdPostIds.push(post.id);

    const editors = await prisma.author.findUnique({
      where: { slug: "editors" },
    });
    expect(editors).toBeTruthy();
    expect(post.author.id).toBe(editors!.id);
    expect(post.author.slug).toBe("editors");
    expect(post.author.name).toBeTruthy();
    expect(post.hero).toBeNull();
    expect(post.merchants).toEqual([]);

    const loaded = await getPostById(post.id);
    expect(loaded?.author.slug).toBe("editors");
  });

  it("listPublishedPosts omits drafts and includes published with publishedAt", async () => {
    const draftSlug = uniqueSlug("draft-post");
    const publishedSlug = uniqueSlug("published-post");

    const draft = await createPost({
      title: "Draft post",
      slug: draftSlug,
      excerpt: "Not live.",
      body: "Draft body.",
      status: "draft",
    });
    createdPostIds.push(draft.id);

    const published = await createPost({
      title: "Published post",
      slug: publishedSlug,
      excerpt: "Live.",
      body: "Published body.",
      status: "published",
    });
    createdPostIds.push(published.id);

    expect(published.publishedAt).toBeTruthy();
    expect(draft.publishedAt).toBeNull();

    const listed = await listPublishedPosts({ limit: 100 });
    const slugs = listed.map((p) => p.slug);
    expect(slugs).toContain(publishedSlug);
    expect(slugs).not.toContain(draftSlug);

    const adminList = await listPosts();
    const adminSlugs = adminList.map((p) => p.slug);
    expect(adminSlugs).toContain(draftSlug);
    expect(adminSlugs).toContain(publishedSlug);
  });

  it("getPublishedPostBySlug returns null for drafts", async () => {
    const slug = uniqueSlug("hidden-draft");
    const draft = await createPost({
      title: "Hidden draft",
      slug,
      excerpt: "Stay unpublished.",
      body: "Secret.",
      status: "draft",
    });
    createdPostIds.push(draft.id);

    const found = await getPublishedPostBySlug(slug);
    expect(found).toBeNull();

    const admin = await getPostById(draft.id);
    expect(admin?.slug).toBe(slug);
    expect(admin?.status).toBe("draft");
  });

  it("throws when updating a published post slug", async () => {
    const slug = uniqueSlug("locked-slug");
    const post = await createPost({
      title: "Locked slug",
      slug,
      excerpt: "Published URL is stable.",
      body: "Do not rename.",
      status: "published",
    });
    createdPostIds.push(post.id);

    await expect(
      updatePost({
        id: post.id,
        title: "Locked slug",
        slug: uniqueSlug("renamed-slug"),
        excerpt: "Published URL is stable.",
        body: "Do not rename.",
        status: "published",
      }),
    ).rejects.toThrow(/slug/i);

    const unchanged = await getPublishedPostBySlug(slug);
    expect(unchanged?.id).toBe(post.id);
    expect(unchanged?.title).toBe("Locked slug");

    const renamedTitle = await updatePost({
      id: post.id,
      title: "Locked slug updated",
      slug,
      excerpt: "Published URL is stable.",
      body: "Do not rename.",
      status: "published",
    });
    expect(renamedTitle.slug).toBe(slug);
    expect(renamedTitle.title).toBe("Locked slug updated");
  });

  it("listApprovedComments returns only approved comments", async () => {
    const slug = uniqueSlug("commented");
    const post = await createPost({
      title: "Commented post",
      slug,
      excerpt: "Has comments.",
      body: "Talk below.",
      status: "published",
    });
    createdPostIds.push(post.id);

    await prisma.comment.create({
      data: {
        postId: post.id,
        status: "pending",
        authorName: "Pat",
        authorEmail: "pat@example.com",
        body: "pending comment",
      },
    });
    await prisma.comment.create({
      data: {
        postId: post.id,
        status: "approved",
        authorName: "Alex",
        authorEmail: "alex@example.com",
        body: "approved comment",
      },
    });

    const comments = await listApprovedComments(post.id);
    expect(comments).toHaveLength(1);
    expect(comments[0]?.status).toBe("approved");
    expect(comments[0]?.body).toBe("approved comment");
    expect(comments[0]?.authorName).toBe("Alex");
  });

  it("throws a domain error when slug already exists", async () => {
    const slug = uniqueSlug("dup-slug");
    const first = await createPost({
      title: "First slug",
      slug,
      excerpt: "Original.",
      body: "First body.",
      status: "draft",
    });
    createdPostIds.push(first.id);

    await expect(
      createPost({
        title: "Second slug",
        slug,
        excerpt: "Copy.",
        body: "Second body.",
        status: "draft",
      }),
    ).rejects.toThrow("slug already exists");
  });
});

describe.runIf(!hasDb)("editorial posts (DB unavailable)", () => {
  it("skips when DATABASE_URL is unreachable", () => {
    console.warn(
      `Skipping editorial integration tests: DB not available at ${DATABASE_URL}`,
    );
    expect(hasDb).toBe(false);
  });
});
