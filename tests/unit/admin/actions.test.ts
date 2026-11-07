import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const createMerchantMock = vi.fn();
const createManualOfferMock = vi.fn();
const updateOfferStatusMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT:${url}`);
  (err as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url};303;`;
  throw err;
});

vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

const getMerchantSlugByIdMock = vi.fn();

vi.mock("@/lib/catalog/merchants", () => ({
  createMerchant: (...args: unknown[]) => createMerchantMock(...args),
  getMerchantSlugById: (...args: unknown[]) => getMerchantSlugByIdMock(...args),
}));

vi.mock("@/lib/catalog/offers", () => ({
  createManualOffer: (...args: unknown[]) => createManualOfferMock(...args),
  updateOfferStatus: (...args: unknown[]) => updateOfferStatusMock(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

function form(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.set(k, v);
  }
  return fd;
}

describe("admin server actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    createMerchantMock.mockReset();
    createManualOfferMock.mockReset();
    updateOfferStatusMock.mockReset();
    getMerchantSlugByIdMock.mockReset();
    getMerchantSlugByIdMock.mockResolvedValue("nike");
    redirectMock.mockClear();
  });

  describe("createMerchantAction", () => {
    it("rejects unauthenticated callers", async () => {
      authMock.mockResolvedValue(null);
      const { createMerchantAction } = await import("@/app/admin/actions");
      await expect(
        createMerchantAction(
          form({
            name: "Nike",
            slug: "nike",
            siteUrl: "https://nike.com",
            market: "US",
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
      expect(createMerchantMock).not.toHaveBeenCalled();
    });

    it("creates merchant and redirects to list", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createMerchantMock.mockResolvedValue({ id: "m1" });
      const { createMerchantAction } = await import("@/app/admin/actions");

      await expect(
        createMerchantAction(
          form({
            name: "Nike",
            slug: "nike",
            siteUrl: "https://nike.com",
            market: "US",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/merchants$/);

      expect(createMerchantMock).toHaveBeenCalledWith(
        expect.objectContaining({
          market: "US",
          slug: "nike",
          name: "Nike",
          siteUrl: "https://nike.com",
        }),
      );
    });

    it("defaults market to US and redirects with error on failure", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createMerchantMock.mockRejectedValue(new Error("slug is required"));
      const { createMerchantAction } = await import("@/app/admin/actions");

      await expect(
        createMerchantAction(
          form({
            name: "X",
            slug: "",
            siteUrl: "https://x.example",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/merchants\/new\?error=/);

      expect(createMerchantMock).toHaveBeenCalledWith(
        expect.objectContaining({ market: "US" }),
      );
    });
  });

  describe("createOfferAction", () => {
    it("rejects unauthenticated callers", async () => {
      authMock.mockResolvedValue(null);
      const { createOfferAction } = await import("@/app/admin/actions");
      await expect(
        createOfferAction(
          form({
            merchantId: "m1",
            title: "10% off",
            offerType: "coupon",
            code: "SAVE10",
            affiliateUrl: "https://aff.example/1",
            status: "active",
          }),
        ),
      ).rejects.toThrow(/Unauthorized/);
      expect(createManualOfferMock).not.toHaveBeenCalled();
    });

    it("creates manual offer and redirects to list", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createManualOfferMock.mockResolvedValue({ id: "o1" });
      const { createOfferAction } = await import("@/app/admin/actions");

      await expect(
        createOfferAction(
          form({
            merchantId: "m1",
            title: "10% off",
            offerType: "coupon",
            code: "SAVE10",
            affiliateUrl: "https://aff.example/1",
            status: "active",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/offers$/);

      expect(createManualOfferMock).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantId: "m1",
          title: "10% off",
          offerType: "coupon",
          code: "SAVE10",
          affiliateUrl: "https://aff.example/1",
          status: "active",
        }),
      );
    });

    it("treats empty code as null", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      createManualOfferMock.mockResolvedValue({ id: "o1" });
      const { createOfferAction } = await import("@/app/admin/actions");

      await expect(
        createOfferAction(
          form({
            merchantId: "m1",
            title: "Deal",
            offerType: "deal",
            code: "",
            affiliateUrl: "https://aff.example/d",
            status: "active",
          }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT/);

      expect(createManualOfferMock).toHaveBeenCalledWith(
        expect.objectContaining({ code: null, offerType: "deal" }),
      );
    });
  });

  describe("updateOfferStatusAction", () => {
    it("rejects unauthenticated callers", async () => {
      authMock.mockResolvedValue(null);
      const { updateOfferStatusAction } = await import("@/app/admin/actions");
      await expect(
        updateOfferStatusAction(
          form({ offerId: "o1", status: "disabled" }),
        ),
      ).rejects.toThrow(/Unauthorized/);
      expect(updateOfferStatusMock).not.toHaveBeenCalled();
    });

    it("disables an offer and redirects to the list", async () => {
      authMock.mockResolvedValue({ user: { id: "admin-1", email: "a@b.c" } });
      updateOfferStatusMock.mockResolvedValue({
        id: "o1",
        merchantId: "m1",
        status: "disabled",
      });
      const { updateOfferStatusAction } = await import("@/app/admin/actions");

      await expect(
        updateOfferStatusAction(
          form({ offerId: "o1", status: "disabled" }),
        ),
      ).rejects.toThrow(/NEXT_REDIRECT:\/admin\/offers$/);

      expect(updateOfferStatusMock).toHaveBeenCalledWith("o1", "disabled");
    });
  });
});
