/**
 * The four checks a decision's `whyCannot` keeps writing by hand.
 *
 * Eight of the seventeen validators independently spell out some combination
 * of "no duplicates", "exactly this many", "all from the offered set" and
 * "between min and max" — each with its own wording. Extracting them from
 * bodies that are being moved verbatim anyway is the one consolidation in
 * this refactor with no behavioural surface at all, and it is what makes an
 * eighteenth kind's validator four lines instead of twenty.
 *
 * Each returns a message or `null`, so a validator reads as a chain of
 * `?? next()`. The messages take the caller's own nouns, because the exact
 * strings reach the client as its error banner and two engine tests match on
 * them.
 */

/** A pick list that names the same thing twice. */
export function noDuplicates<T>(picked: readonly T[], message: string): string | null {
  return new Set(picked).size === picked.length ? null : message;
}

/** Every pick must have been on offer. `message` is called with the first
 * stray one, so the caller decides how to name it. */
export function subsetOf<T>(
  picked: readonly T[],
  offered: Iterable<T>,
  message: (stray: T) => string,
): string | null {
  const allowed = new Set(offered);
  for (const item of picked) {
    if (!allowed.has(item)) return message(item);
  }
  return null;
}

/** Exactly `count` picks. */
export function exactCount<T>(
  picked: readonly T[],
  count: number,
  message: (got: number, want: number) => string,
): string | null {
  return picked.length === count ? null : message(picked.length, count);
}

/** Between `min` and `max` picks inclusive. */
export function withinRange<T>(
  picked: readonly T[],
  min: number,
  max: number,
  message: (got: number, min: number, max: number) => string,
): string | null {
  return picked.length >= min && picked.length <= max
    ? null
    : message(picked.length, min, max);
}
