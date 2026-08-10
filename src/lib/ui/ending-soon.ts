/** True when endsAt is within `withinDays` from now (inclusive). */
export function isEndingSoon(
  endsAt: Date | string | null | undefined,
  now: Date = new Date(),
  withinDays = 7,
): boolean {
  if (!endsAt) return false;
  const end = endsAt instanceof Date ? endsAt : new Date(endsAt);
  if (Number.isNaN(end.getTime())) return false;
  if (end.getTime() < now.getTime()) return false;
  const ms = withinDays * 24 * 60 * 60 * 1000;
  return end.getTime() - now.getTime() <= ms;
}
