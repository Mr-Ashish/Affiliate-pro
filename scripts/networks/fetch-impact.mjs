import {
  asArray,
  loadNetworkEnv,
  previewRows,
  requestJson,
  requireEnv,
  writeSample,
} from "./_common.mjs";

await loadNetworkEnv();

const sid = requireEnv("IMPACT_ACCOUNT_SID");
const authToken = requireEnv("IMPACT_AUTH_TOKEN");
const authorization = `Basic ${Buffer.from(`${sid}:${authToken}`).toString("base64")}`;

async function impactGet(resourcePath) {
  const headers = {
    Authorization: authorization,
    Accept: "application/json",
  };
  const bases = [
    `https://api.impact.com/Mediapartners/${encodeURIComponent(sid)}`,
    `https://api.impact.com/MediaPartners/${encodeURIComponent(sid)}`,
  ];
  let lastError;
  for (const base of bases) {
    try {
      return await requestJson(`${base}${resourcePath}`, { headers });
    } catch (error) {
      lastError = error;
      if (!String(error.message).includes("(404)")) throw error;
    }
  }
  throw lastError;
}

const campaigns = await impactGet("/Campaigns?InsertionOrderStatus=Active&Page=1&PageSize=5");
const campaignRows = asArray(campaigns.body?.Campaigns);
const campaignsPath = await writeSample("impact", "campaigns-page-1.json", {
  fetchedAt: new Date().toISOString(),
  response: campaigns.body,
});

const ads = await impactGet("/Ads?Type=COUPON&Page=1&PageSize=5");
const adRows = asArray(ads.body?.Ads);
const adsPath = await writeSample("impact", "coupon-ads-page-1.json", {
  fetchedAt: new Date().toISOString(),
  response: ads.body,
});

console.log(
  `Impact active campaigns on this page: ${campaignRows.length} (reported total ${campaigns.body?.["@total"] ?? "unknown"})`,
);
console.log(
  previewRows(campaignRows, (campaign) => ({
    campaignId: campaign.CampaignId,
    campaignName: campaign.CampaignName,
    advertiserName: campaign.AdvertiserName,
    contractStatus: campaign.ContractStatus,
    shippingRegions: campaign.ShippingRegions,
    hasTrackingLink: Boolean(campaign.TrackingLink),
  })),
);
console.log(`Campaign sample: ${campaignsPath}`);
console.log(
  `Impact coupon ads on this page: ${adRows.length} (reported total ${ads.body?.["@total"] ?? "unknown"})`,
);
console.log(
  previewRows(adRows, (ad) => ({
    id: ad.Id,
    name: ad.Name,
    campaignName: ad.CampaignName,
    type: ad.Type,
    dealState: ad.DealState,
    hasCode: Boolean(ad.DealDefaultPromoCode),
    hasTrackingLink: Boolean(ad.TrackingLink),
    discountPercent: ad.DiscountPercent,
    startDate: ad.StartDate,
    endDate: ad.EndDate,
  })),
);
console.log(`Coupon ad sample: ${adsPath}`);
