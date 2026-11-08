# Impact credentials and first coupon pull

Create a key: [Create an API Key](https://integrations.impact.com/rest-apis/api-quick-start/create-an-api-key). Auth: [Partner API authentication](https://integrations.impact.com/partner-api-reference/readme/authentication). Coupon-shaped rows: [Ads](https://integrations.impact.com/partner-api-reference/reference/ads/ads). Joined programmes: [Programs](https://integrations.impact.com/partner-api-reference/reference/programs/programs).

You need a **partner** (media partner) account, not a brand account.

| Variable | What it is |
|----------|------------|
| `IMPACT_ACCOUNT_SID` | Account SID for the access token. This is the HTTP Basic username. |
| `IMPACT_AUTH_TOKEN` | Auth token for that same key. This is the HTTP Basic password. |

## Create a read token

1. Sign in at [https://app.impact.com](https://app.impact.com) as a partner.
2. Open your user profile, then **Settings**.
3. Under **Technical**, open **API**.
4. Click **Create Access Token**.
5. Name it something like `coupon-hub-read`. Keep the default (latest) API version.
6. On the scope step, start from **Clear All** and turn on **read** access for programmes/campaigns and ads. Read-only is enough for this probe. Impact’s scope labels are toggles on that screen. The exact label can differ by account version.
7. Create the token.
8. Open the token, then **API Credentials**, and copy **Account SID** and **Auth Token**.

Legacy tokens created before April 2025 still work. They are a read/write pair and a read-only pair on the older API settings page. Prefer a new scoped token. If the first call returns HTTP 403, the token authenticated and a scope is missing. Open the token and enable the category named in the error, then run the probe again.

Send the pair as HTTP Basic auth over HTTPS. Impact rejects plain HTTP.

## Pull a sample

```bash
cp .env.networks.example .env.networks
```

```bash
IMPACT_ACCOUNT_SID=paste-account-sid
IMPACT_AUTH_TOKEN=paste-auth-token
```

```bash
pnpm networks:impact
```

The script calls, with `Accept: application/json`:

```http
GET https://api.impact.com/Mediapartners/{IMPACT_ACCOUNT_SID}/Campaigns?InsertionOrderStatus=Active&Page=1&PageSize=5
GET https://api.impact.com/Mediapartners/{IMPACT_ACCOUNT_SID}/Ads?Type=COUPON&Page=1&PageSize=5
```

The current resource docs use the path `Mediapartners`. The auth overview writes `MediaPartners`. If the first path returns 404, the script retries the other spelling.

Samples land in `data/networks/impact/campaigns-page-1.json` and `data/networks/impact/coupon-ads-page-1.json`.

On a campaign row, look at `CampaignId`, `CampaignName`, `AdvertiserName`, `ContractStatus`, `ShippingRegions`, and `TrackingLink`. `ShippingRegions` containing `US` is the practical US filter. Ads have no country filter of their own.

On a coupon ad, look at `Id`, `Name`, `Type` (`COUPON`), `TrackingLink`, `LandingPageUrl`, `DealDefaultPromoCode`, `DealState`, `DiscountPercent` or `DiscountAmount`, `StartDate`, and `EndDate`. An empty `DealDefaultPromoCode` means the promotion has no checkout code.

`@total` on each response is the size of that list. This probe stops after five rows. Ads calls sit in Impact’s general limit of 1,000 requests per hour.
