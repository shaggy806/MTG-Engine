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

/**
 * The same, but an entry standing for several interchangeable permanents may
 * be named once per permanent — a compacted token stack is one id in an offer
 * and picking three of its nine Goblins is that id three times. `copies`
 * gives an entry's size; anything absent from it counts as one, so on a board
 * with no stacks this is exactly {@link noDuplicates}.
 */
export function withinCopies<T extends string>(
  picked: readonly T[],
  copies: Readonly<Record<string, number>> | undefined,
  message: (over: T, limit: number) => string,
): string | null {
  const used = new Map<T, number>();
  for (const item of picked) {
    const n = (used.get(item) ?? 0) + 1;
    const limit = copies?.[item] ?? 1;
    if (n > limit) return message(item, limit);
    used.set(item, n);
  }
  return null;
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
