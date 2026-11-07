"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { updateOfferStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { offerMenuActions } from "@/lib/catalog/offer-menu-actions";

export type OfferRowMenuProps = {
  offerId: string;
  title: string;
  status: string;
};

export function OfferRowMenu({ offerId, title, status }: OfferRowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const actions = offerMenuActions(status);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 px-0"
        aria-label={`Actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon icon={MoreVertical} size={16} />
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[10rem] rounded-md border border-outline-variant bg-surface-lowest py-1 shadow-sm"
        >
          {actions.map((action) => (
            <form
              key={action.id}
              action={updateOfferStatusAction}
              role="none"
            >
              <input type="hidden" name="offerId" value={offerId} />
              <input type="hidden" name="status" value={action.status} />
              <button
                type="submit"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-low"
              >
                {action.label}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
