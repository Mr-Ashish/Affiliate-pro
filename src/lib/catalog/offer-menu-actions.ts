import type { OfferStatus } from "@/lib/catalog/types";

export type OfferMenuAction = {
  id: string;
  label: string;
  status: OfferStatus;
};

const STATUS_ACTIONS: OfferMenuAction[] = [
  { id: "set-active", label: "Set active", status: "active" },
  { id: "pause", label: "Pause", status: "disabled" },
  { id: "retire", label: "Retire", status: "expired" },
  { id: "draft", label: "Move to draft", status: "draft" },
];

/** Status-change items for the row ⋮ menu. Omit the offer's current status. */
export function offerMenuActions(currentStatus: string): OfferMenuAction[] {
  return STATUS_ACTIONS.filter((action) => action.status !== currentStatus);
}
