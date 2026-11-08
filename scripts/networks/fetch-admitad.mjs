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

const clientId = requireEnv("ADMITAD_CLIENT_ID");
const clientSecret = requireEnv("ADMITAD_CLIENT_SECRET");
const region = optionalEnv("ADMITAD_REGION") || "US";
const scope =
  optionalEnv("ADMITAD_SCOPE") ||
  "websites coupons_for_website advcampaigns_for_website";

const tokenResponse = await requestJson("https://api.admitad.com/token/", {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  },
  body: new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    scope,
  }),
});

const accessToken = tokenResponse.body?.access_token;
if (!accessToken) {
  throw new Error("Admitad token response did not include access_token.");
}

const authHeaders = {
  Authorization: `Bearer ${accessToken}`,
  Accept: "application/json",
};

const websites = await requestJson("https://api.admitad.com/websites/v2/?limit=50", {
  headers: authHeaders,
});
const websiteRows = asArray(websites.body?.results);
const websitesPath = await writeSample("admitad", "websites.json", {
  fetchedAt: new Date().toISOString(),
  response: websites.body,
});

console.log("Admitad ad spaces:");
console.log(
  websiteRows.map((site) => ({
    id: site.id,
    name: site.name,
    status: site.status,
    siteUrl: site.site_url ?? site.url,
  })),
);
console.log(`Ad space list: ${websitesPath}`);

let websiteId = optionalEnv("ADMITAD_WEBSITE_ID");
if (!websiteId) {
  if (websiteRows.length !== 1) {
    throw new Error("Set ADMITAD_WEBSITE_ID to one of the ad space ids printed above.");
  }
  websiteId = String(websiteRows[0].id);
}

const couponsUrl = new URL(
  `https://api.admitad.com/coupons/website/${encodeURIComponent(websiteId)}/`,
);
couponsUrl.searchParams.set("limit", "5");
couponsUrl.searchParams.set("offset", "0");
couponsUrl.searchParams.set("region", region);

const coupons = await requestJson(couponsUrl, { headers: authHeaders });
const couponRows = asArray(coupons.body?.results);
const couponsPath = await writeSample("admitad", "coupons-page-1.json", {
  websiteId,
  region,
  fetchedAt: new Date().toISOString(),
  meta: coupons.body?._meta ?? null,
  response: coupons.body,
});

console.log(
  `Admitad website ${websiteId}, region ${region}, total reported: ${coupons.body?._meta?.count ?? "unknown"}`,
);
console.log(
  previewRows(couponRows, (coupon) => ({
    id: coupon.id,
    name: coupon.name,
    campaign: coupon.campaign?.name ?? coupon.campaign,
    species: coupon.species,
    status: coupon.status,
    hasCode: Boolean(coupon.promocode),
    hasTrackingUrl: Boolean(coupon.goto_link),
    discount: coupon.discount,
    dateStart: coupon.date_start,
    dateEnd: coupon.date_end,
  })),
);
console.log(`Full response: ${couponsPath}`);
