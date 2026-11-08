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

const token = requireEnv("AWIN_API_TOKEN");
const region = optionalEnv("AWIN_REGION_CODE") || "US";
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

let publisherId = optionalEnv("AWIN_PUBLISHER_ID");
if (!publisherId) {
  const accounts = await requestJson("https://api.awin.com/accounts", { headers });
  const list = asArray(accounts.body?.accounts ?? accounts.body);
  const publishers = list.filter(
    (account) => String(account.accountType ?? account.type ?? "").toLowerCase() === "publisher",
  );
  const candidates = publishers.length > 0 ? publishers : list;
  console.log(
    "Awin accounts visible to this token:",
    candidates.map((account) => ({
      accountId: account.accountId ?? account.publisherId ?? account.id,
      accountName: account.accountName ?? account.account_name ?? account.name,
      accountType: account.accountType ?? account.type,
    })),
  );
  if (candidates.length !== 1) {
    throw new Error(
      "Set AWIN_PUBLISHER_ID to the publisher account id printed above (the number beside your account name in the Awin UI).",
    );
  }
  publisherId = String(
    candidates[0].accountId ?? candidates[0].publisherId ?? candidates[0].id,
  );
}

const offers = await requestJson(
  `https://api.awin.com/publisher/${encodeURIComponent(publisherId)}/promotions?accessToken=${encodeURIComponent(token)}`,
  {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: {
        membership: "joined",
        regionCodes: [region.toUpperCase()],
        status: "active",
        type: "all",
      },
      pagination: { page: 1, pageSize: 10 },
    }),
  },
);

const rows = asArray(
  offers.body?.data ?? offers.body?.promotions ?? offers.body?.content ?? offers.body,
);
const samplePath = await writeSample("awin", "promotions-page-1.json", {
  publisherId,
  region: region.toUpperCase(),
  fetchedAt: new Date().toISOString(),
  response: offers.body,
});

console.log(`Awin publisher ${publisherId}, region ${region.toUpperCase()}`);
console.log(`Offers on this page: ${rows.length}`);
console.log(
  previewRows(rows, (offer) => ({
    promotionId: offer.promotionId,
    type: offer.type,
    advertiser: offer.advertiser?.name ?? offer.advertiser,
    joined: offer.advertiser?.joined,
    title: offer.title,
    hasCode: Boolean(offer.voucher?.code),
    hasTrackingUrl: Boolean(offer.urlTracking),
    startDate: offer.startDate,
    endDate: offer.endDate,
  })),
);
console.log(`Full response: ${samplePath}`);
