# Network offer probes

These notes are how to get publisher API credentials and pull a small sample of offers. They do not write to the catalog. A later job can turn the same calls into a scheduled ingest.

| Network | Credentials | Probe |
|---------|-------------|-------|
| [Awin](awin.md) | `AWIN_API_TOKEN`, `AWIN_PUBLISHER_ID` | `pnpm networks:awin` |
| [Admitad](admitad.md) | `ADMITAD_CLIENT_ID`, `ADMITAD_CLIENT_SECRET`, `ADMITAD_WEBSITE_ID` | `pnpm networks:admitad` |
| [TradeDoubler](tradedoubler.md) | `TRADEDOUBLER_VOUCHERS_TOKEN` | `pnpm networks:tradedoubler` |
| [Impact](impact.md) | `IMPACT_ACCOUNT_SID`, `IMPACT_AUTH_TOKEN` | `pnpm networks:impact` |

## Run a probe

```bash
cp .env.networks.example .env.networks
# fill the variables for one network, then:
pnpm networks:awin
```

Each script prints a short summary and writes the raw JSON under `data/networks/<network>/`. That folder is gitignored because responses include voucher codes and tracking links.

The terminal summary says whether a code and a tracking URL were present. It does not print the code or the URL.
