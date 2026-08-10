import { describe, expect, it } from "vitest";
import { isEndingSoon } from "@/lib/ui/ending-soon";

describe("isEndingSoon", () => {
  const now = new Date("2026-07-25T12:00:00Z");

  it("returns false for null/undefined", () => {
    expect(isEndingSoon(null, now)).toBe(false);
    expect(isEndingSoon(undefined, now)).toBe(false);
  });

  it("returns false when already past", () => {
    expect(isEndingSoon(new Date("2026-07-24T12:00:00Z"), now)).toBe(false);
  });

  it("returns true within 7 days", () => {
    expect(isEndingSoon(new Date("2026-07-28T12:00:00Z"), now)).toBe(true);
  });

  it("returns false beyond 7 days", () => {
    expect(isEndingSoon(new Date("2026-08-20T12:00:00Z"), now)).toBe(false);
  });
});
