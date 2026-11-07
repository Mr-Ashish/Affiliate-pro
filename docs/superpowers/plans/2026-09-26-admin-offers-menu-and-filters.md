# Admin offers: row menu + filters

**Goal:** Replace the per-row status `<select>` with a 3-dot actions menu, and add title search plus status/merchant filters on `/admin/offers`.

**Why:** More offer actions are coming (edit, duplicate, feature). A dropdown in every row does not scale. Merchants already filter in the table (`MerchantsTable`); offers should match that pattern.

## UX

```text
[/admin/offers]
  [Search titles…] [Status ▾] [Merchant ▾]          [New offer]

  Title | Merchant | Type | Code | Status | Clicks | ⋮
                                                   └ Pause
                                                     Retire
                                                     Move to draft
                                                     Set active
```

- **⋮ menu** is the only row action chrome. Status stays a badge, not an editor.
- Menu items call existing `updateOfferStatusAction` (hidden `offerId` + `status`). No new API.
- Current status is omitted from the menu (Pause is hidden when already disabled).
- Later actions (Edit, Duplicate) are extra items in `offerMenuActions()` — do not add a second menu.

## Filters (client, like merchants)

| Control | Matches |
|---------|---------|
| Search | title (case-insensitive substring) |
| Status | `all` \| `active` \| `disabled` \| `expired` \| `draft` |
| Merchant | `all` or merchant id |

Empty result: “No offers match.” Entire catalog empty: “No offers yet.”

v1 is in-memory on the loaded list (`listOffers()`). Server-side query params only if the table grows large later.

## Files

```text
src/lib/catalog/filter-admin-offers.ts     # pure filter
src/lib/catalog/offer-menu-actions.ts      # which ⋮ items for a status
src/components/admin/OffersTable.tsx       # filters + table (client)
src/components/admin/OfferRowMenu.tsx      # 3-dot menu (client)
src/app/admin/(app)/offers/page.tsx        # load data, pass rows
tests/unit/catalog/filter-admin-offers.test.ts
tests/unit/catalog/offer-menu-actions.test.ts
```

## Menu contract (expand later)

```ts
type OfferMenuAction = {
  id: string;
  label: string;
  status: OfferStatus; // v1: all items are status changes
};
```

Later: `href?: string` or `action?: "edit"` without changing the menu shell.

## Out of scope

- Offer edit page, hard delete, merchant ⋮ menu, URL-synced filters
