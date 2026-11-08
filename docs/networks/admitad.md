# Admitad credentials and first coupon pull

Official credential page: [Access to Admitad API for publishers](https://support.mitgo.com/hc/en-us/articles/33314479535762-Access-to-Admitad-API-for-publishers) (13 Feb 2026). Token exchange: [Client authorization](https://developers.admitad.com/knowledge-base/article/client-authorization_2). Coupons: [Coupons](https://developers.admitad.com/knowledge-base/article/coupons_1).

You need:

| Variable | What it is |
|----------|------------|
| `ADMITAD_CLIENT_ID` | API client id from account settings. |
| `ADMITAD_CLIENT_SECRET` | API secret from the same screen. |
| `ADMITAD_WEBSITE_ID` | Numeric id of the ad space (website) whose coupons you want. |
| `ADMITAD_REGION` | Optional. Defaults to `US`. Use `99` to follow the regions configured on that ad space. |
| `ADMITAD_SCOPE` | Optional. The probe requests `websites coupons_for_website advcampaigns_for_website`. |

These credentials act as your account. Resetting the secret on the API screen issues a new `client_secret` and disables apps that still have the old one.

## Get the client id and secret

1. Sign in to your Admitad publisher account.
2. Open **Settings**.
3. Open the **API and apps** tab.
4. Click **Show credentials**.
5. Copy the client id into `ADMITAD_CLIENT_ID` and the secret into `ADMITAD_CLIENT_SECRET`.

The same screen lists third-party apps you have already approved. This probe does not create one of those apps. It uses the account credentials with the `client_credentials` grant and asks for the scopes in `ADMITAD_SCOPE`.

## Get the ad space id

1. In **Settings**, open **Ad spaces**.
2. Use an ad space whose status is **Active**.
3. If the numeric id is not on the card, leave `ADMITAD_WEBSITE_ID` empty for the first run. The script lists id, name, and status from `GET /websites/v2/`. Copy the id you want and run again.

## Pull a sample

```bash
cp .env.networks.example .env.networks
```

```bash
ADMITAD_CLIENT_ID=paste-client-id
ADMITAD_CLIENT_SECRET=paste-client-secret
ADMITAD_WEBSITE_ID=12345
ADMITAD_REGION=US
```

```bash
pnpm networks:admitad
```

The script does three calls:

1. `POST https://api.admitad.com/token/` with HTTP Basic `client_id:client_secret` and `grant_type=client_credentials`.
2. `GET https://api.admitad.com/websites/v2/?limit=50`.
3. `GET https://api.admitad.com/coupons/website/{ADMITAD_WEBSITE_ID}/?limit=5&offset=0&region=US`.

Samples land in `data/networks/admitad/websites.json` and `data/networks/admitad/coupons-page-1.json`.

Use the website coupon endpoint. `GET /coupons/` does not return `promocode` or `goto_link`. A usable row has `id`, `campaign.id`, `campaign.name`, `species` (`promocode` or `action`), `promocode` when it is a code, and `goto_link` as the tracking URL. `date_end: null` means the coupon has no end date. `_meta.count` is the total for that filter.

Admitad documents a limit of 600 requests per minute. Over the limit the API returns HTTP 503. This probe makes three calls. The access token in the docs lives 604800 seconds (7 days). The script requests a fresh token every run.
