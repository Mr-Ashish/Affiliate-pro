import { describe, expect, it } from "vitest";
import { filterAdminOffers } from "@/lib/catalog/filter-admin-offers";

const rows = [
  {
    id: "1",
    title: "20% off sitewide",
    status: "active",
    merchantId: "nike",
    merchantName: "Nike",
  },
  {
    id: "2",
    title: "$10 off $50+",
    status: "disabled",
    merchantId: "amazon",
    merchantName: "Amazon",
  },
  {
    id: "3",
    title: "Nike members extra 10%",
    status: "expired",
    merchantId: "nike",
    merchantName: "Nike",
  },
];

describe("filterAdminOffers", () => {
  it("filters by title substring, case-insensitive", () => {
    const found = filterAdminOffers(rows, { q: "SITEWIDE" });
    expect(found.map((r) => r.id)).toEqual(["1"]);
  });

  it("filters by status", () => {
    const found = filterAdminOffers(rows, { status: "disabled" });
    expect(found.map((r) => r.id)).toEqual(["2"]);
  });

  it("filters by merchant id", () => {
    const found = filterAdminOffers(rows, { merchantId: "nike" });
    expect(found.map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("combines title, status, and merchant", () => {
    const found = filterAdminOffers(rows, {
      q: "nike",
      status: "expired",
      merchantId: "nike",
    });
    expect(found.map((r) => r.id)).toEqual(["3"]);
  });

  it("treats empty/all as no filter", () => {
    expect(
      filterAdminOffers(rows, { q: "  ", status: "all", merchantId: "all" }),
    ).toHaveLength(3);
  });
});
