/**
 * Subset enumeration for bot candidate lists.
 *
 * Lives here rather than in `bot/decisions.ts` because a decision module's
 * `candidates` needs it and nothing under `decisions/` may reach into `bot/`.
 * `bot/decisions.ts` re-exports both, so `bot/candidates.ts` and
 * `eval-bot-combat.test.ts` import exactly what they imported before.
 *
 * **Order is load-bearing.** `Game.fromSnapshot` rollouts replay candidates in
 * the order these emit them, so a reordering shifts every `bot:bench` number
 * and silently re-points the frozen champions in `bot/champions/`.
 */

/** Every `k`-element subset of `items`, in order, stopping at `limit`. */
export function combinations<T>(items: readonly T[], k: number, limit: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, chosen: T[]): void => {
    if (out.length >= limit) return;
    if (chosen.length === k) {
      out.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - (k - chosen.length); i += 1) {
      chosen.push(items[i]);
      pick(i + 1, chosen);
      chosen.pop();
      if (out.length >= limit) return;
    }
  };
  if (k >= 0 && k <= items.length) pick(0, []);
  return out;
}

/** Subsets of size `min`..`max`, smallest first, stopping at `limit`. */
export function subsetsBetween<T>(
  items: readonly T[],
  min: number,
  max: number,
  limit: number,
): T[][] {
  const out: T[][] = [];
  for (let k = Math.max(0, min); k <= Math.min(max, items.length); k += 1) {
    out.push(...combinations(items, k, limit - out.length));
    if (out.length >= limit) break;
  }
  return out;
}
