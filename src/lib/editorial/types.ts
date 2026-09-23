export type PostStatus = "draft" | "published";
export type BodyFormat = "markdown" | "html";
export type MediaRole = "hero" | "inline" | "gallery";
export type CommentStatus = "pending" | "approved" | "spam" | "rejected";

export type CreatePostInput = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  bodyFormat?: BodyFormat;
  status: PostStatus;
  isFeatured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  authorId?: string | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  merchantIds?: string[];
};

export type UpdatePostInput = CreatePostInput & { id: string };
