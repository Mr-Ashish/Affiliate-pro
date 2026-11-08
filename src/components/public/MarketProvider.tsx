"use client";

import { createContext, useContext } from "react";
import { DEFAULT_MARKET, marketPath } from "@/lib/market/path";

const MarketContext = createContext(DEFAULT_MARKET);

export function MarketProvider({
  market,
  children,
}: {
  market: string;
  children: React.ReactNode;
}) {
  return (
    <MarketContext.Provider value={market}>{children}</MarketContext.Provider>
  );
}

export function useMarket(): string {
  return useContext(MarketContext);
}

export function useMarketPath() {
  const market = useMarket();
  return (path = "/") => marketPath(market, path);
}
