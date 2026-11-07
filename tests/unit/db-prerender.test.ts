import { afterEach, describe, expect, it } from "vitest";
import { catalogOrEmpty, shouldSkipDbPrerender } from "@/lib/db-prerender";

describe("catalogOrEmpty", () => {
  afterEach(() => {
    delete process.env.SKIP_DB_PRERENDER;
  });

  it("returns the loaded value when the query succeeds", async () => {
    const rows = await catalogOrEmpty(async () => [1, 2], []);
    expect(rows).toEqual([1, 2]);
  });

  it("rethrows when SKIP_DB_PRERENDER is unset", async () => {
    await expect(
      catalogOrEmpty(async () => {
        throw new Error("Can't reach database server");
      }, []),
    ).rejects.toThrow(/Can't reach database server/);
  });

  it("returns empty when SKIP_DB_PRERENDER=1", async () => {
    process.env.SKIP_DB_PRERENDER = "1";
    expect(shouldSkipDbPrerender()).toBe(true);
    const rows = await catalogOrEmpty(async () => {
      throw new Error("Can't reach database server");
    }, []);
    expect(rows).toEqual([]);
  });
});
