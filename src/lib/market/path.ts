export const DEFAULT_MARKET = "US";

export const SWITCHER_MARKET_CODES = ["US", "GB", "EU"] as const;

export function isSwitcherMarket(code: string): boolean {
  return (SWITCHER_MARKET_CODES as readonly string[]).includes(
    code.toUpperCase(),
  );
}

const RESERVED_FIRST_SEGMENTS = new Set([
  "admin",
  "api",
  "go",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function parseMarketParam(segment: string): string | null {
  if (!/^[a-z]{2}$/i.test(segment)) return null;
  return segment.toUpperCase();
}

export function swapMarketPath(pathname: string, nextMarket: string): string {
  const suffix = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const parts = suffix.split("/").filter(Boolean);
  if (parts.length > 0 && parseMarketParam(parts[0]!)) {
    parts[0] = nextMarket.toLowerCase();
    return `/${parts.join("/")}`;
  }
  return marketPath(nextMarket, suffix === "/" ? "/" : suffix);
}

export function marketPath(market: string, path = "/"): string {
  const code = market.toLowerCase();
  if (!path || path === "/") return `/${code}`;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `/${code}${suffix}`;
}

export const UNPREFIXED_CATALOG_REDIRECTS: {
  source: string;
  destination: string;
  permanent: false;
}[] = [
  { source: "/", destination: "/us", permanent: false },
  { source: "/stores", destination: "/us/stores", permanent: false },
  { source: "/store/:slug", destination: "/us/store/:slug", permanent: false },
  { source: "/deals", destination: "/us/deals", permanent: false },
  { source: "/trending", destination: "/us/trending", permanent: false },
  { source: "/categories", destination: "/us/categories", permanent: false },
  { source: "/blog", destination: "/us/blog", permanent: false },
  { source: "/blog/:slug", destination: "/us/blog/:slug", permanent: false },
  { source: "/coming-soon", destination: "/us/coming-soon", permanent: false },
];

export function redirectUnprefixedPublicPath(pathname: string): string | null {
  if (pathname === "/") return marketPath(DEFAULT_MARKET);
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first || RESERVED_FIRST_SEGMENTS.has(first)) return null;
  if (parseMarketParam(first)) return null;
  return `${marketPath(DEFAULT_MARKET)}${pathname}`;
}
