import type { AwinProgramme, AwinPromotion } from "@/lib/sources/awin/types";

export type AwinFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type AwinClientOptions = {
  token: string;
  publisherId: string;
  fetchImpl?: AwinFetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  minIntervalMs?: number;
  pageSize?: number;
  maxPages?: number;
};

export function isLastPromotionPage(
  page: number,
  pageSize: number,
  rowCount: number,
  total?: number,
): boolean {
  if (typeof total === "number") {
    return page * pageSize >= total;
  }
  return rowCount < pageSize;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export class AwinClient {
  private readonly token: string;
  private readonly publisherId: string;
  private readonly fetchImpl: AwinFetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly minIntervalMs: number;
  private readonly pageSize: number;
  private readonly maxPages: number;
  private lastCallAt: number | null = null;

  constructor(options: AwinClientOptions) {
    this.token = options.token;
    this.publisherId = options.publisherId;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.minIntervalMs = options.minIntervalMs ?? 3100;
    this.pageSize = options.pageSize ?? 100;
    this.maxPages = options.maxPages ?? 100;
  }

  async listJoinedProgrammes(): Promise<AwinProgramme[]> {
    const url = new URL(
      `https://api.awin.com/publishers/${encodeURIComponent(this.publisherId)}/programmes`,
    );
    url.searchParams.set("relationship", "joined");
    url.searchParams.set("accessToken", this.token);
    const body = await this.requestJson(url, { method: "GET" });
    const rows = Array.isArray(body) ? body : [];
    return rows
      .map(parseProgramme)
      .filter((row): row is AwinProgramme => row != null);
  }

  async listPromotionsPage(page: number): Promise<{
    promotions: AwinPromotion[];
    page: number;
    pageSize: number;
    total?: number;
  }> {
    const url = new URL(
      `https://api.awin.com/publisher/${encodeURIComponent(this.publisherId)}/promotions`,
    );
    url.searchParams.set("accessToken", this.token);
    const body = await this.requestJson(url, {
      method: "POST",
      body: JSON.stringify({
        filters: {
          membership: "joined",
          status: "active",
          type: "all",
        },
        pagination: { page, pageSize: this.pageSize },
      }),
    });
    const payload = asRecord(body) ?? {};
    const pagination = asRecord(payload.pagination) ?? {};
    const promotions = Array.isArray(payload.data)
      ? payload.data
          .map(parsePromotion)
          .filter((row): row is AwinPromotion => row != null)
      : [];
    return {
      promotions,
      page: typeof pagination.page === "number" ? pagination.page : page,
      pageSize:
        typeof pagination.pageSize === "number" ? pagination.pageSize : this.pageSize,
      total: typeof pagination.total === "number" ? pagination.total : undefined,
    };
  }

  async listAllPromotions(): Promise<{
    promotions: AwinPromotion[];
    incomplete: boolean;
  }> {
    const promotions: AwinPromotion[] = [];
    let page = 1;
    while (page <= this.maxPages) {
      const result = await this.listPromotionsPage(page);
      promotions.push(...result.promotions);
      if (
        isLastPromotionPage(
          result.page,
          result.pageSize,
          result.promotions.length,
          result.total,
        )
      ) {
        return { promotions, incomplete: false };
      }
      if (result.promotions.length === 0) {
        return { promotions, incomplete: false };
      }
      page += 1;
    }
    return { promotions, incomplete: true };
  }

  private async throttle(): Promise<void> {
    if (this.lastCallAt != null) {
      const wait = this.minIntervalMs - (this.now() - this.lastCallAt);
      if (wait > 0) {
        await this.sleep(wait);
      }
    }
    this.lastCallAt = this.now();
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: ["Bearer", this.token].join(" "),
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  private async requestJson(url: URL, init: RequestInit): Promise<unknown> {
    await this.throttle();
    const response = await this.fetchImpl(url, {
      ...init,
      headers: {
        ...this.authHeaders(),
        ...(init.headers ?? {}),
      },
    });
    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!response.ok) {
      const detail =
        typeof parsed === "string"
          ? parsed.slice(0, 400)
          : JSON.stringify(parsed).slice(0, 400);
      throw new Error(
        `${init.method ?? "GET"} ${url.pathname} failed (${response.status}): ${detail}`,
      );
    }
    return parsed;
  }
}

function parseProgramme(raw: unknown): AwinProgramme | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = Number(row.id);
  if (!Number.isFinite(id)) return null;
  const region = asRecord(row.primaryRegion);
  return {
    id,
    name: String(row.name ?? ""),
    displayUrl: typeof row.displayUrl === "string" ? row.displayUrl : null,
    logoUrl: typeof row.logoUrl === "string" ? row.logoUrl : null,
    primaryRegion: region && typeof region.countryCode === "string"
      ? { countryCode: region.countryCode, name: String(region.name ?? "") }
      : null,
  };
}

function parsePromotion(raw: unknown): AwinPromotion | null {
  const row = asRecord(raw);
  if (!row) return null;
  const promotionId = Number(row.promotionId);
  if (!Number.isFinite(promotionId)) return null;
  const advertiserRaw = asRecord(row.advertiser);
  if (!advertiserRaw) return null;
  const advertiserId = Number(advertiserRaw.id);
  if (!Number.isFinite(advertiserId)) return null;
  return {
    promotionId,
    type: row.type === "voucher" ? "voucher" : "promotion",
    title: String(row.title ?? ""),
    description: typeof row.description === "string" ? row.description : null,
    terms: typeof row.terms === "string" ? row.terms : null,
    startDate: typeof row.startDate === "string" ? row.startDate : null,
    endDate: typeof row.endDate === "string" ? row.endDate : null,
    url: typeof row.url === "string" ? row.url : null,
    urlTracking: typeof row.urlTracking === "string" ? row.urlTracking : null,
    advertiser: {
      id: advertiserId,
      name: String(advertiserRaw.name ?? ""),
      joined: advertiserRaw.joined === true,
    },
    regions: row.regions as AwinPromotion["regions"],
    voucher: row.voucher as AwinPromotion["voucher"],
  };
}
