export type AdminOfferFilterRow = {
  id: string;
  title: string;
  status: string;
  merchantId: string;
  merchantName: string;
};

export type AdminOfferFilters = {
  q?: string;
  status?: string;
  merchantId?: string;
};

export function filterAdminOffers<T extends AdminOfferFilterRow>(
  offers: T[],
  filters: AdminOfferFilters,
): T[] {
  const needle = (filters.q ?? "").trim().toLowerCase();
  const status = (filters.status ?? "all").trim() || "all";
  const merchantId = (filters.merchantId ?? "all").trim() || "all";

  return offers.filter((o) => {
    if (status !== "all" && o.status !== status) return false;
    if (merchantId !== "all" && o.merchantId !== merchantId) return false;
    if (!needle) return true;
    return o.title.toLowerCase().includes(needle);
  });
}
