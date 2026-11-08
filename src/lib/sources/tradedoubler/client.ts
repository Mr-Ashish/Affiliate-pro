import type { TradeDoublerVoucher } from "@/lib/sources/tradedoubler/types";

export type TradeDoublerFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type TradeDoublerClientOptions = {
  token: string;
  fetchImpl?: TradeDoublerFetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  minIntervalMs?: number;
  pageSize?: number;
  maxPages?: number;
};

export function isLastVoucherPage(rowCount: number, pageSize: number): boolean {
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

export class TradeDoublerClient {
  private readonly token: string;
  private readonly fetchImpl: TradeDoublerFetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly minIntervalMs: number;
  private readonly pageSize: number;
  private readonly maxPages: number;
  private lastCallAt: number | null = null;

  constructor(options: TradeDoublerClientOptions) {
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.minIntervalMs = options.minIntervalMs ?? 200;
    this.pageSize = options.pageSize ?? 100;
    this.maxPages = options.maxPages ?? 100;
  }

  async listVouchersPage(page: number): Promise<TradeDoublerVoucher[]> {
    const filters = [
      "dateOutputFormat=iso8601",
      `pageSize=${this.pageSize}`,
      `page=${page}`,
    ];
    const url = new URL(
      `https://api.tradedoubler.com/1.0/vouchers.json;${filters.join(";")}`,
    );
    url.searchParams.set("token", this.token);
    const body = await this.requestJson(url);
    const rows = Array.isArray(body)
      ? body
      : Array.isArray(asRecord(body)?.vouchers)
        ? (asRecord(body)?.vouchers as unknown[])
        : [];
    return rows
      .map(parseVoucher)
      .filter((row): row is TradeDoublerVoucher => row != null);
  }

  async listAllVouchers(): Promise<{
    vouchers: TradeDoublerVoucher[];
    incomplete: boolean;
  }> {
    const vouchers: TradeDoublerVoucher[] = [];
    let page = 0;
    while (page < this.maxPages) {
      const rows = await this.listVouchersPage(page);
      vouchers.push(...rows);
      if (isLastVoucherPage(rows.length, this.pageSize)) {
        return { vouchers, incomplete: false };
      }
      page += 1;
    }
    return { vouchers, incomplete: true };
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

  private async requestJson(url: URL): Promise<unknown> {
    await this.throttle();
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: { Accept: "application/json" },
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
        `GET ${url.pathname} failed (${response.status}): ${detail}`,
      );
    }
    return parsed;
  }
}

function parseVoucher(raw: unknown): TradeDoublerVoucher | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = Number(row.id);
  const programId = Number(row.programId);
  if (!Number.isFinite(id) || !Number.isFinite(programId)) return null;
  return {
    id,
    programId,
    programName: String(row.programName ?? ""),
    voucherTypeId: Number(row.voucherTypeId ?? 0),
    title: String(row.title ?? ""),
    description: typeof row.description === "string" ? row.description : null,
    defaultTrackUri:
      typeof row.defaultTrackUri === "string" ? row.defaultTrackUri : null,
    landingUrl: typeof row.landingUrl === "string" ? row.landingUrl : null,
    currencyId: typeof row.currencyId === "string" ? row.currencyId : null,
    languageId: typeof row.languageId === "string" ? row.languageId : null,
    code: typeof row.code === "string" ? row.code : null,
    startDate: typeof row.startDate === "string" ? row.startDate : null,
    endDate: typeof row.endDate === "string" ? row.endDate : null,
  };
}
