const CURRENCY_TO_MARKET: Record<string, string> = {
  USD: "US",
  GBP: "GB",
  EUR: "EU",
  CAD: "CA",
  AUD: "AU",
  NZD: "NZ",
  INR: "IN",
  SEK: "SE",
  NOK: "NO",
  DKK: "DK",
  CHF: "CH",
  PLN: "PL",
  BRL: "BR",
  MXN: "MX",
  JPY: "JP",
  SGD: "SG",
  HKD: "HK",
  ZAR: "ZA",
  AED: "AE",
};

export function marketFromCurrency(
  currencyId: string | null | undefined,
): string | null {
  if (!currencyId?.trim()) return null;
  return CURRENCY_TO_MARKET[currencyId.trim().toUpperCase()] ?? null;
}
