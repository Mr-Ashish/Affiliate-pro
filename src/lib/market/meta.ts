export type MarketMeta = {
  name: string;
  defaultLocale: string;
  short?: string;
};

const MARKET_META: Record<string, MarketMeta> = {
  US: { name: "United States", short: "US", defaultLocale: "en-US" },
  GB: { name: "United Kingdom", short: "UK", defaultLocale: "en-GB" },
  EU: { name: "Europe", short: "EU", defaultLocale: "en" },
  CA: { name: "Canada", defaultLocale: "en-CA" },
  AU: { name: "Australia", defaultLocale: "en-AU" },
  NZ: { name: "New Zealand", defaultLocale: "en-NZ" },
  IN: { name: "India", defaultLocale: "en-IN" },
  SE: { name: "Sweden", defaultLocale: "sv-SE" },
  NO: { name: "Norway", defaultLocale: "nb-NO" },
  DK: { name: "Denmark", defaultLocale: "da-DK" },
  CH: { name: "Switzerland", defaultLocale: "de-CH" },
  PL: { name: "Poland", defaultLocale: "pl-PL" },
  BR: { name: "Brazil", defaultLocale: "pt-BR" },
  MX: { name: "Mexico", defaultLocale: "es-MX" },
  JP: { name: "Japan", defaultLocale: "ja-JP" },
  SG: { name: "Singapore", defaultLocale: "en-SG" },
  HK: { name: "Hong Kong", defaultLocale: "en-HK" },
  ZA: { name: "South Africa", defaultLocale: "en-ZA" },
  AE: { name: "United Arab Emirates", defaultLocale: "en-AE" },
};

export function marketMeta(code: string): MarketMeta {
  const upper = code.toUpperCase();
  const row = MARKET_META[upper];
  if (row) {
    return { ...row, short: row.short ?? upper };
  }
  return { name: upper, short: upper, defaultLocale: "en" };
}

export function marketShortLabel(code: string): string {
  return marketMeta(code).short ?? code.toUpperCase();
}
