import { describe, expect, it } from "vitest";
import { renderPostBody } from "@/lib/editorial/render-body";

describe("renderPostBody", () => {
  it("renders markdown headings and links", () => {
    const html = renderPostBody("See [Nike](/store/nike)", "markdown");
    expect(html).toContain("<a href=\"/store/nike\">Nike</a>");
  });
  it("strips script tags from html format (future WYSIWYG)", () => {
    const html = renderPostBody(
      `<p>Hi</p><script>alert(1)</script><img src="x" onerror="alert(1)">`,
      "html",
    );
    expect(html).toContain("<p>Hi</p>");
    expect(html).not.toMatch(/script/i);
    expect(html).not.toMatch(/onerror/i);
  });
  it("rejects unknown format", () => {
    expect(() => renderPostBody("x", "latex" as "markdown")).toThrow(/bodyFormat/);
  });
});
