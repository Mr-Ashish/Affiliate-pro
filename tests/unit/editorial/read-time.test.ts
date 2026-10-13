import { describe, expect, it } from "vitest";
import { estimateReadMinutes } from "@/lib/editorial/read-time";

describe("estimateReadMinutes", () => {
  it("uses about 200 words per minute and never returns zero", () => {
    expect(estimateReadMinutes("")).toBe(1);
    expect(estimateReadMinutes("word ".repeat(200))).toBe(1);
    expect(estimateReadMinutes("word ".repeat(201))).toBe(2);
  });
});
