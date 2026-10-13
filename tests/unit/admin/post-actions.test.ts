import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createPostMock = vi.fn();
const updatePostMock = vi.fn();
const createMerchantMock = vi.fn();
const createManualOfferMock = vi.fn();
const getMerchantSlugByIdMock = vi.fn();
const revalidateEditorialMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT:${url}`);
  (err as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};303;`;
  throw err;
});

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

vi.mock("@/lib/editorial/posts", () => ({
  createPost: (...args: unknown[]) => createPostMock(...args),
  updatePost: (...args: unknown[]) => updatePostMock(...args),
}));

vi.mock("@/lib/catalog/public-cache", () => ({
  revalidateEditorial: (...args: unknown[]) => revalidateEditorialMock(...args),
  revalidatePublicCatalog: vi.fn(),
}));

vi.mock("@/lib/catalog/merchants", () => ({
  createMerchant: (...args: unknown[]) => createMerchantMock(...args),
  getMerchantSlugById: (...args: unknown[]) => getMerchantSlugByIdMock(...args),
}));

vi.mock("@/lib/catalog/offers", () => ({
  createManualOffer: (...args: unknown[]) => createManualOfferMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

function form(data: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        fd.append(k, item);
      }
    } else {
      fd.set(k, v);
    }
  }
  return fd;
}

describe("admin post server actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    createPostMock.mockReset();
    updatePostMock.mockReset();
    createMerchantMock.mockReset();
    createManualOfferMock.mockReset();
    getMerchantSlugByIdMock.mockReset();
    revalidateEditorialMock.mockReset();
    redirectMock.mockClear();
  });

  function redirectErrorMessage(urlPrefix: string): string {
    const url = String(redirectMock.mock.calls.at(-1)?.[0] ?? "");
    expect(url.startsWith(urlPrefix)).toBe(true);
    return decodeURIComponent(new URL(url, "http://admin.local").searchParams.get("error") ?? "");
  }

  describe("createPostAction", () => {
    it("rejects unauthenticated callers", async () => {
      authMock.mockResolvedValue(null);
      const { createPostAction } = await import("@/app/admin/actions");
      await expect(
        createPostAction(
          form({
            title: "How to save",
            slug: "how-to-save",
            excerpt: "Tips",
            body: "## Hello",
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
      expect(createPostMock).not.toHaveBeenCalled();
    });

    it("creates a post with trimmed fields and redirects to the list", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createPostMock.mockResolvedValue({ id: "p1", slug: "how-to-save" });
      const { createPostAction } = await import("@/app/admin/actions");

      await expect(
        createPostAction(
          form({
            title: "  How to save  ",
            slug: "  how-to-save  ",
            excerpt: "  Tips  ",
            body: "  ## Hello  ",
            seoTitle: "  SEO  ",
            seoDescription: "  Desc  ",
            heroImageUrl: "  https://img.example/h.jpg  ",
            heroImageAlt: "  Hero  ",
            isFeatured: "on",
            merchantIds: ["m1", "m2"],
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts$/);

      expect(createPostMock).toHaveBeenCalledWith({
        title: "How to save",
        slug: "how-to-save",
        excerpt: "Tips",
        body: "## Hello",
        status: "draft",
        isFeatured: true,
        seoTitle: "SEO",
        seoDescription: "Desc",
        heroImageUrl: "https://img.example/h.jpg",
        heroImageAlt: "Hero",
        category: null,
        merchantIds: ["m1", "m2"],
      });
      expect(revalidateEditorialMock).toHaveBeenCalledWith("how-to-save");
    });

    it("rejects a status outside draft|published and redirects with error", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      const { createPostAction } = await import("@/app/admin/actions");

      await expect(
        createPostAction(
          form({
            title: "How to save",
            slug: "how-to-save",
            excerpt: "Tips",
            body: "## Hello",
            status: "archived",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts\/new\?error=/);

      expect(createPostMock).not.toHaveBeenCalled();
      expect(revalidateEditorialMock).not.toHaveBeenCalled();
      expect(redirectErrorMessage("/admin/posts/new")).toMatch(
        /status must be draft or published/i,
      );
    });

    it("revalidates the persisted slug returned by createPost", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createPostMock.mockResolvedValue({ id: "p1", slug: "nike-sale-calendar" });
      const { createPostAction } = await import("@/app/admin/actions");

      await expect(
        createPostAction(
          form({
            title: "Nike Sale Calendar",
            slug: "Nike Sale Calendar",
            excerpt: "Tips",
            body: "## Hello",
            status: "published",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts$/);

      expect(revalidateEditorialMock).toHaveBeenCalledWith("nike-sale-calendar");
      expect(revalidateEditorialMock).not.toHaveBeenCalledWith("Nike Sale Calendar");
    });

    it("rejects a non-http(s) hero image URL and redirects with error", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      const { createPostAction } = await import("@/app/admin/actions");

      await expect(
        createPostAction(
          form({
            title: "How to save",
            slug: "how-to-save",
            excerpt: "Tips",
            body: "## Hello",
            heroImageUrl: "javascript:alert(1)",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts\/new\?error=/);

      expect(createPostMock).not.toHaveBeenCalled();
      expect(redirectErrorMessage("/admin/posts/new")).toMatch(
        /heroImageUrl must start with http:\/\/ or https:\/\//i,
      );
    });

    it("allows an empty or http(s) hero image URL", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createPostMock.mockResolvedValue({ id: "p1", slug: "how-to-save" });
      const { createPostAction } = await import("@/app/admin/actions");

      await expect(
        createPostAction(
          form({
            title: "How to save",
            slug: "how-to-save",
            excerpt: "Tips",
            body: "## Hello",
            heroImageUrl: "  ",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts$/);

      expect(createPostMock).toHaveBeenCalledWith(
        expect.objectContaining({ heroImageUrl: null }),
      );

      createPostMock.mockClear();
      createPostMock.mockResolvedValue({ id: "p1", slug: "how-to-save" });
      await expect(
        createPostAction(
          form({
            title: "How to save",
            slug: "how-to-save",
            excerpt: "Tips",
            body: "## Hello",
            heroImageUrl: "http://cdn.example/h.jpg",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts$/);

      expect(createPostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          heroImageUrl: "http://cdn.example/h.jpg",
        }),
      );
    });

    it("redirects with error when title is empty", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createPostMock.mockRejectedValue(new Error("title is required"));
      const { createPostAction } = await import("@/app/admin/actions");

      await expect(
        createPostAction(
          form({
            title: "",
            slug: "how-to-save",
            excerpt: "Tips",
            body: "## Hello",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts\/new\?error=/);
    });
  });

  describe("updatePostAction", () => {
    it("updates a post by id and redirects to the list", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      updatePostMock.mockResolvedValue({ id: "p1", slug: "how-to-save" });
      const { updatePostAction } = await import("@/app/admin/actions");

      await expect(
        updatePostAction(
          form({
            id: "p1",
            title: "How to save",
            slug: "how-to-save",
            excerpt: "Tips",
            body: "## Hello",
            status: "published",
            merchantIds: ["m1"],
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts$/);

      expect(updatePostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "p1",
          title: "How to save",
          slug: "how-to-save",
          excerpt: "Tips",
          body: "## Hello",
          status: "published",
          merchantIds: ["m1"],
        }),
      );
      expect(revalidateEditorialMock).toHaveBeenCalledWith("how-to-save");
    });

    it("revalidates the persisted slug returned by updatePost", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      updatePostMock.mockResolvedValue({ id: "p1", slug: "how-to-save" });
      const { updatePostAction } = await import("@/app/admin/actions");

      await expect(
        updatePostAction(
          form({
            id: "p1",
            title: "How to save",
            slug: "How To Save!",
            excerpt: "Tips",
            body: "## Hello",
            status: "draft",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/posts$/);

      expect(revalidateEditorialMock).toHaveBeenCalledWith("how-to-save");
      expect(revalidateEditorialMock).not.toHaveBeenCalledWith("How To Save!");
    });
  });
});
