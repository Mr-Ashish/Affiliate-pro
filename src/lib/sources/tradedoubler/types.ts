export type TradeDoublerVoucher = {
  id: number;
  programId: number;
  programName: string;
  voucherTypeId: number;
  title: string;
  description?: string | null;
  defaultTrackUri?: string | null;
  landingUrl?: string | null;
  currencyId?: string | null;
  languageId?: string | null;
  code?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};
