import { describe, expect, it } from "vitest";
import { formatVerifiedAgo } from "@/lib/ui/relative-time";

describe("formatVerifiedAgo", () => {
  const now = new Date("2026-10-13T12:00:00Z");

  it("formats minutes under one hour", () => {
    const verified = new Date("2026-10-13T11:20:00Z");
    expect(formatVerifiedAgo(verified, now)).toBe("40 minutes ago");
  });

  it("formats hours under one day", () => {
    const verified = new Date("2026-10-13T10:00:00Z");
    expect(formatVerifiedAgo(verified, now)).toBe("2 hours ago");
  });

  it("formats days at one day or more", () => {
    const verified = new Date("2026-10-10T12:00:00Z");
    expect(formatVerifiedAgo(verified, now)).toBe("3 days ago");
  });

  it("uses singular minute and hour", () => {
    expect(
      formatVerifiedAgo(new Date("2026-10-13T11:59:00Z"), now),
    ).toBe("1 minute ago");
    expect(
      formatVerifiedAgo(new Date("2026-10-13T11:00:00Z"), now),
    ).toBe("1 hour ago");
  });
});
