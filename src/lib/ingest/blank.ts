const EMPTY = new Set(["", "n/a", "na", "none", "null"]);

export function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (EMPTY.has(trimmed.toLowerCase())) return null;
  return trimmed;
}
