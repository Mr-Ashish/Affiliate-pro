import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { BodyFormat } from "./types";

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height"],
    a: ["href", "name", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

export function renderPostBody(body: string, format: BodyFormat): string {
  if (format !== "markdown" && format !== "html") {
    throw new Error(`unsupported bodyFormat: ${String(format)}`);
  }
  const raw =
    format === "markdown"
      ? String(marked.parse(body, { async: false }))
      : body;
  return sanitizeHtml(raw, ALLOWED);
}
