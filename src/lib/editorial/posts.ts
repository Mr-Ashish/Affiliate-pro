import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertPostSlug, normalizePostSlug } from "@/lib/editorial/slug";
import type {
  BodyFormat,
  CreatePostInput,
  PostStatus,
  UpdatePostInput,
} from "@/lib/editorial/types";

const DEFAULT_AUTHOR_SLUG = "editors";

const postCardInclude = {
  author: {
    select: { id: true, slug: true, name: true, avatarUrl: true },
  },
  media: {
    where: { role: "hero" },
    orderBy: { sortOrder: "asc" as const },
    take: 1,
    include: { media: { select: { url: true, alt: true } } },
  },
  merchants: {
    include: {
      merchant: { select: { id: true, slug: true, name: true } },
    },
  },
} satisfies Prisma.PostInclude;

type PostCardRow = Prisma.PostGetPayload<{ include: typeof postCardInclude }>;

type PostAuthor = {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string | null;
};

type PostHero = { url: string; alt: string } | null;

type PostMerchantSummary = { id: string; slug: string; name: string };

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  isFeatured: boolean;
  publishedAt: Date | null;
  updatedAt: Date;
  author: PostAuthor;
  hero: PostHero;
  merchants: PostMerchantSummary[];
};

export type PublishedPost = PostCard & {
  body: string;
  bodyFormat: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

function mapPost(row: PostCardRow): PostCard {
  const heroJoin = row.media[0];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    status: row.status,
    isFeatured: row.isFeatured,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    author: row.author,
    hero: heroJoin
      ? { url: heroJoin.media.url, alt: heroJoin.media.alt }
      : null,
    merchants: row.merchants.map((pm) => pm.merchant),
  };
}

function mapPublishedPost(row: PostCardRow): PublishedPost {
  return {
    ...mapPost(row),
    body: row.body,
    bodyFormat: row.bodyFormat,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

function publishedWhere(now: Date) {
  return {
    status: "published" as const,
    publishedAt: { lte: now },
  };
}

function trimRequired(label: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }
  return trimmed;
}

function normalizeBodyFormat(value: BodyFormat | undefined): BodyFormat {
  const bodyFormat = value ?? "markdown";
  if (bodyFormat !== "markdown" && bodyFormat !== "html") {
    throw new Error(`unsupported bodyFormat: ${String(bodyFormat)}`);
  }
  return bodyFormat;
}

function normalizeStatus(value: PostStatus): PostStatus {
  if (value !== "draft" && value !== "published") {
    throw new Error("status must be draft or published");
  }
  return value;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeHeroImageUrl(
  value: string | null | undefined,
): string | null | undefined {
  const normalized = normalizeOptionalText(value);
  if (normalized === undefined || normalized === null) return normalized;
  if (
    !normalized.startsWith("http://") &&
    !normalized.startsWith("https://")
  ) {
    throw new Error("heroImageUrl must start with http:// or https://");
  }
  return normalized;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

type Tx = Prisma.TransactionClient;

async function resolveAuthorId(
  tx: Tx,
  authorId: string | null | undefined,
  fallbackId?: string,
): Promise<string> {
  if (authorId) {
    const author = await tx.author.findUnique({ where: { id: authorId } });
    if (!author) {
      throw new Error(`author not found: ${authorId}`);
    }
    return author.id;
  }
  if (fallbackId) {
    return fallbackId;
  }
  const editors = await tx.author.findUnique({
    where: { slug: DEFAULT_AUTHOR_SLUG },
  });
  if (!editors) {
    throw new Error("default author 'editors' is missing");
  }
  return editors.id;
}

async function setHero(
  tx: Tx,
  postId: string,
  url: string | null | undefined,
  alt: string | null | undefined,
) {
  if (url === undefined) return;
  await tx.postMedia.deleteMany({ where: { postId, role: "hero" } });
  if (url === null) return;
  const media = await tx.mediaAsset.create({
    data: {
      url,
      alt: (alt ?? "").trim(),
    },
  });
  await tx.postMedia.create({
    data: {
      postId,
      mediaId: media.id,
      role: "hero",
      sortOrder: 0,
    },
  });
}

async function replaceMerchants(
  tx: Tx,
  postId: string,
  merchantIds: string[] | undefined,
) {
  if (merchantIds === undefined) return;
  await tx.postMerchant.deleteMany({ where: { postId } });
  const ids = uniqueIds(merchantIds);
  if (ids.length === 0) return;
  await tx.postMerchant.createMany({
    data: ids.map((merchantId) => ({ postId, merchantId })),
  });
}

async function loadPostCard(tx: Tx, id: string): Promise<PostCard> {
  const row = await tx.post.findUnique({
    where: { id },
    include: postCardInclude,
  });
  if (!row) {
    throw new Error(`post not found: ${id}`);
  }
  return mapPost(row);
}

function mapSlugConflict(err: unknown): never {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    throw new Error("slug already exists");
  }
  throw err;
}

export async function createPost(input: CreatePostInput): Promise<PostCard> {
  const title = trimRequired("title", input.title);
  const excerpt = trimRequired("excerpt", input.excerpt);
  const body = trimRequired("body", input.body);
  const slug = normalizePostSlug(input.slug);
  assertPostSlug(slug);
  const bodyFormat = normalizeBodyFormat(input.bodyFormat);
  const status = normalizeStatus(input.status);
  const now = new Date();
  const heroUrl = normalizeHeroImageUrl(input.heroImageUrl);

  try {
    return await prisma.$transaction(async (tx) => {
      const authorId = await resolveAuthorId(tx, input.authorId);
      const post = await tx.post.create({
        data: {
          title,
          slug,
          excerpt,
          body,
          bodyFormat,
          status,
          isFeatured: input.isFeatured ?? false,
          seoTitle: normalizeOptionalText(input.seoTitle) ?? null,
          seoDescription: normalizeOptionalText(input.seoDescription) ?? null,
          authorId,
          publishedAt: status === "published" ? now : null,
        },
      });
      await setHero(tx, post.id, heroUrl ?? null, input.heroImageAlt);
      await replaceMerchants(tx, post.id, input.merchantIds ?? []);
      return loadPostCard(tx, post.id);
    });
  } catch (err) {
    mapSlugConflict(err);
  }
}

export async function updatePost(input: UpdatePostInput): Promise<PostCard> {
  const title = trimRequired("title", input.title);
  const excerpt = trimRequired("excerpt", input.excerpt);
  const body = trimRequired("body", input.body);
  const slug = normalizePostSlug(input.slug);
  assertPostSlug(slug);
  const bodyFormat = normalizeBodyFormat(input.bodyFormat);
  const status = normalizeStatus(input.status);
  const now = new Date();
  const heroUrl = normalizeHeroImageUrl(input.heroImageUrl);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.post.findUnique({ where: { id: input.id } });
      if (!existing) {
        throw new Error(`post not found: ${input.id}`);
      }
      if (existing.status === "published" && slug !== existing.slug) {
        throw new Error("cannot change slug of a published post");
      }
      const authorId = await resolveAuthorId(
        tx,
        input.authorId,
        existing.authorId,
      );
      const publishedAt =
        status === "published"
          ? (existing.publishedAt ?? now)
          : existing.publishedAt;

      await tx.post.update({
        where: { id: input.id },
        data: {
          title,
          slug,
          excerpt,
          body,
          bodyFormat,
          status,
          isFeatured: input.isFeatured ?? existing.isFeatured,
          seoTitle:
            input.seoTitle === undefined
              ? existing.seoTitle
              : (normalizeOptionalText(input.seoTitle) ?? null),
          seoDescription:
            input.seoDescription === undefined
              ? existing.seoDescription
              : (normalizeOptionalText(input.seoDescription) ?? null),
          authorId,
          publishedAt,
        },
      });
      await setHero(tx, input.id, heroUrl, input.heroImageAlt);
      await replaceMerchants(tx, input.id, input.merchantIds);
      return loadPostCard(tx, input.id);
    });
  } catch (err) {
    mapSlugConflict(err);
  }
}

export async function listPosts(): Promise<PostCard[]> {
  const rows = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    include: postCardInclude,
  });
  return rows.map(mapPost);
}

export async function listPublishedPosts(params?: {
  limit?: number;
  featuredOnly?: boolean;
  now?: Date;
}): Promise<PostCard[]> {
  const now = params?.now ?? new Date();
  const rows = await prisma.post.findMany({
    where: {
      ...publishedWhere(now),
      ...(params?.featuredOnly ? { isFeatured: true } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: params?.limit,
    include: postCardInclude,
  });
  return rows.map(mapPost);
}

export async function getPublishedPostBySlug(
  slug: string,
  now?: Date,
): Promise<PublishedPost | null> {
  const row = await prisma.post.findFirst({
    where: {
      slug,
      ...publishedWhere(now ?? new Date()),
    },
    include: postCardInclude,
  });
  return row ? mapPublishedPost(row) : null;
}

export async function getPostById(id: string): Promise<PublishedPost | null> {
  const row = await prisma.post.findUnique({
    where: { id },
    include: postCardInclude,
  });
  return row ? mapPublishedPost(row) : null;
}

export async function listPublishedPostsForMerchant(
  merchantId: string,
  limit?: number,
): Promise<PostCard[]> {
  const rows = await prisma.post.findMany({
    where: {
      ...publishedWhere(new Date()),
      merchants: { some: { merchantId } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postCardInclude,
  });
  return rows.map(mapPost);
}
