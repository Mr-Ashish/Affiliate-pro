import {
  asArray,
  loadNetworkEnv,
  optionalEnv,
  previewRows,
  requestJson,
  requireEnv,
  writeSample,
} from "./_common.mjs";

await loadNetworkEnv();

const token = requireEnv("TRADEDOUBLER_VOUCHERS_TOKEN");
const pageSize = optionalEnv("TRADEDOUBLER_PAGE_SIZE") || "10";
const languageId = optionalEnv("TRADEDOUBLER_LANGUAGE_ID");

const filters = [
  "dateOutputFormat=iso8601",
  `pageSize=${encodeURIComponent(pageSize)}`,
  "page=0",
];
if (languageId) filters.push(`languageId=${encodeURIComponent(languageId)}`);

const url = new URL(`https://api.tradedoubler.com/1.0/vouchers.json;${filters.join(";")}`);
url.searchParams.set("token", token);

const response = await requestJson(url, {
  headers: { Accept: "application/json" },
});

const rows = asArray(
  Array.isArray(response.body)
    ? response.body
    : response.body?.vouchers ?? response.body?.voucher ?? response.body?.items,
);
const samplePath = await writeSample("tradedoubler", "vouchers-page-0.json", {
  languageId: languageId || null,
  pageSize: Number(pageSize),
  fetchedAt: new Date().toISOString(),
  rowCount: rows.length,
  response: response.body,
});

console.log(
  `TradeDoubler vouchers page 0${languageId ? `, language ${languageId}` : ""}: ${rows.length} rows`,
);
console.log(
  previewRows(rows, (voucher) => ({
    id: voucher.id,
    programId: voucher.programId,
    programName: voucher.programName,
    voucherTypeId: voucher.voucherTypeId,
    title: voucher.title,
    hasCode: Boolean(voucher.code),
    hasTrackingUrl: Boolean(voucher.defaultTrackUri),
    currencyId: voucher.currencyId,
    languageId: voucher.languageId,
    startDate: voucher.startDate,
    endDate: voucher.endDate,
  })),
);
console.log(`Full response: ${samplePath}`);
