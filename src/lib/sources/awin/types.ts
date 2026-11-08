export type AwinAdvertiser = {
  id: number;
  name: string;
  joined: boolean;
};

export type AwinRegion = {
  countryCode: string;
  name?: string;
};

export type AwinVoucher = {
  code: string | null;
  exclusive?: boolean;
  attributable?: boolean;
};

export type AwinPromotion = {
  promotionId: number;
  type: "promotion" | "voucher";
  title: string;
  description?: string | null;
  terms?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  url?: string | null;
  urlTracking?: string | null;
  advertiser: AwinAdvertiser;
  regions?: {
    all?: boolean;
    list?: AwinRegion[];
  };
  voucher?: AwinVoucher;
};

export type AwinProgramme = {
  id: number;
  name: string;
  displayUrl?: string | null;
  logoUrl?: string | null;
  primaryRegion?: {
    countryCode: string;
    name?: string;
  } | null;
};
