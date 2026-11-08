# Awin credentials and first offer pull

Official auth: [API authentication](https://help.awin.com/apis/apidocs/api-authentication) (updated 2026-03-12). Offers call: [Retrieve Offers](https://help.awin.com/apidocs/promotions).

You need two values:

| Variable | What it is |
|----------|------------|
| `AWIN_API_TOKEN` | Personal API token. It belongs to your user, and it can read every publisher account that user can open. |
| `AWIN_PUBLISHER_ID` | Numeric publisher account id. |
| `AWIN_REGION_CODE` | Optional. Defaults to `US`. |

## Get the token

1. Sign in at [https://ui.awin.com](https://ui.awin.com).
2. Confirm your user has access to the publisher account under **Account → User Permissions**. Awin says the user needs access before the token will return that account. Permission changes can take up to 10 minutes to apply to the API.
3. Open [https://ui.awin.com/awin-api](https://ui.awin.com/awin-api), or use the user menu (top right) and choose **API Credentials**.
4. Enter the password you use to sign in.
5. Click **Show my API token** and copy the token into `AWIN_API_TOKEN`.

The Offers API uses that token as `Authorization: Bearer …`. Revoking it on the same page stops every integration using it.

## Get the publisher id

In the Awin UI the publisher id is the number shown beside the account name in the account switcher (top right).

If you leave `AWIN_PUBLISHER_ID` empty, `pnpm networks:awin` calls `GET https://api.awin.com/accounts` and prints the accounts on the token. When exactly one account comes back, the script uses it. When several come back, copy the publisher `accountId` into `AWIN_PUBLISHER_ID`.

## Pull a sample

```bash
cp .env.networks.example .env.networks
```

```bash
AWIN_API_TOKEN=paste-token
AWIN_PUBLISHER_ID=1234567
AWIN_REGION_CODE=US
```

```bash
pnpm networks:awin
```

The script sends:

```http
POST https://api.awin.com/publisher/{AWIN_PUBLISHER_ID}/promotions
Authorization: Bearer {AWIN_API_TOKEN}
```

```json
{
  "filters": {
    "membership": "joined",
    "regionCodes": ["US"],
    "status": "active",
    "type": "all"
  },
  "pagination": { "page": 1, "pageSize": 10 }
}
```

`pageSize` 10 is the smallest page Awin allows. The raw body is saved to `data/networks/awin/promotions-page-1.json`.

What you should see on a usable row: `promotionId`, `advertiser.id`, `advertiser.name`, `advertiser.joined`, `title`, `urlTracking`, and `voucher.code` when the offer is a voucher and you are joined to that advertiser. A code is null when you are not joined.

Awin allows 20 API calls per minute per user. This probe makes one or two calls.
