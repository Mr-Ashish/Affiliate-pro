# TradeDoubler credentials and first voucher pull

Official vouchers API: [Vouchers API for publishers](https://dev.tradedoubler.com/vouchers/publisher/).

You need one value for this probe:

| Variable | What it is |
|----------|------------|
| `TRADEDOUBLER_VOUCHERS_TOKEN` | 40-character token for the **VOUCHERS** system. |
| `TRADEDOUBLER_PAGE_SIZE` | Optional. Defaults to `10`. |
| `TRADEDOUBLER_LANGUAGE_ID` | Optional ISO 639-1 code such as `en`. Leave empty to see every language the token can read. |

This is not the Connect reporting API (`connect.tradedoubler.com`, client id, client secret, username, and password). That API lists programmes and transactions. Voucher codes come from `api.tradedoubler.com` and a separate token.

## Get the vouchers token

1. Sign in at [https://login.tradedoubler.com](https://login.tradedoubler.com) with the publisher account that is approved on the programmes you care about.
2. Open **Account → Manage tokens**. The vouchers documentation still uses that path.
3. If that menu is gone, open **Settings → Tokens** instead. Publisher accounts have been moved onto that screen.
4. Copy the token whose system is **VOUCHERS** and whose type is **site**. It is a 40-character hexadecimal string.
5. Put it in `TRADEDOUBLER_VOUCHERS_TOKEN`.

Use **type: site**, not **type: publisher**.

- **site** tokens are bound to a website/affiliate id. The vouchers API returns the voucher list for that site (the same list the UI shows under Find vouchers).
- **publisher** tokens are account-level Connect/reporting credentials. They authenticate, but the vouchers endpoint returns `[]` even when the UI still shows codes.

If you have several site tokens, pick the one for the website you promote from. Do not paste a publisher token, a PRODUCTS token, or a Connect client secret.

Another place the same token shows up: **Tools → Find vouchers**. The sample request at the bottom of that page looks like `https://api.tradedoubler.com/1.0/vouchers.json?token=…`. Copy only the value after `token=`.

Do not paste a **PRODUCTS** token or a Connect API client secret into this variable. Those will not authorize the vouchers feed.

The token is sent as a query parameter. The probe strips it from error output. Avoid logging the full request URL yourself.

## Pull a sample

```bash
cp .env.networks.example .env.networks
```

```bash
TRADEDOUBLER_VOUCHERS_TOKEN=paste-40-char-token
TRADEDOUBLER_PAGE_SIZE=10
TRADEDOUBLER_LANGUAGE_ID=
```

```bash
pnpm networks:tradedoubler
```

The script calls:

```http
GET https://api.tradedoubler.com/1.0/vouchers.json;dateOutputFormat=iso8601;pageSize=10;page=0?token={token}
```

`page` is 0-based. Page 0 is the first page. The raw body is saved to `data/networks/tradedoubler/vouchers-page-0.json`.

A usable row has `id`, `programId`, `programName`, `voucherTypeId`, `title`, `defaultTrackUri`, `startDate`, and `endDate`. `code` is present when `voucherTypeId` is `1`. Type `2` is a discount without a code (`discountAmount`, `isPercentage`). There is no country filter. `currencyId` and `languageId` on each row are how you see whether the feed is useful for a US site.

TradeDoubler does not publish a rate limit for this API. The probe requests one page.
