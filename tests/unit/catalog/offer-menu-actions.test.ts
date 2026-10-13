import { describe, expect, it } from "vitest";
import { offerMenuActions } from "@/lib/catalog/offer-menu-actions";

describe("offerMenuActions", () => {
  it("omits the current status so the menu only shows changes", () => {
    const ids = offerMenuActions("active").map((a) => a.status);
    expect(ids).toEqual(["disabled", "expired", "draft"]);
    expect(ids).not.toContain("active");
  });

  it("lets a paused offer resume, retire, or return to draft", () => {
    const ids = offerMenuActions("disabled").map((a) => a.status);
    expect(ids).toEqual(["active", "expired", "draft"]);
  });

  it("labels status changes for the menu", () => {
    const byStatus = Object.fromEntries(
      offerMenuActions("draft").map((a) => [a.status, a.label]),
    );
    expect(byStatus.active).toBe("Set active");
    expect(byStatus.disabled).toBe("Pause");
    expect(byStatus.expired).toBe("Retire");
  });
});
