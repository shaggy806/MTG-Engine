/**
 * Enumerating one target per slot, for bot candidate lists.
 *
 * Lives here for the same reason `subsets.ts` does: a decision module's
 * `candidates` needs it and nothing under `decisions/` may reach into
 * `bot/`. `bot/candidates.ts` re-exports it, so its own four uses — which
 * are about targeting a *spell being cast*, not answering a decision — are
 * untouched.
 */

import { anyNumberSlot, isOptionalSpec, otherSlotConflict } from "../../target.js";
import type { TargetRef, TargetSpec } from "../../target.js";

/**
 * Every combination of one target per slot, breadth-first so the caps bite on
 * the later slots rather than starving the first one, and capped at `limit`.
 * A slot with no legal target yields nothing — the action isn't playable.
 */
export function targetCombos(
  optionLists: readonly (readonly TargetRef[])[],
  limit: number,
  specs: readonly TargetSpec[] = [],
): (TargetRef | null)[][] {
  if (optionLists.length === 0) return [[]];
  // A required slot with nothing to point at means the action isn't playable.
  // An optional one ("up to one target creature") just gets skipped.
  if (optionLists.some((options, i) => options.length === 0 && !isOptionalSpec(specs[i]))) {
    return [];
  }
  let combos: (TargetRef | null)[][] = [[]];
  const group = anyNumberSlot(specs);
  optionLists.forEach((options, i) => {
    // An "any number of" group (always last) ends each combination with a
    // few of its answers rather than every subset: none, each candidate
    // alone, and all of them.
    if (i === group) {
      const tails: TargetRef[][] = [[], ...options.map((ref) => [ref]), ...(options.length > 1 ? [[...options]] : [])];
      const next: (TargetRef | null)[][] = [];
      for (const combo of combos) {
        for (const tail of tails) {
          if (next.length >= limit) break;
          next.push([...combo, ...tail]);
        }
        if (next.length >= limit) break;
      }
      combos = next;
      return;
    }
    // Skipping is a real choice for an optional slot, so offer it alongside
    // the targets rather than only when there's nothing to point at.
    const choices: (TargetRef | null)[] = isOptionalSpec(specs[i])
      ? [...options, null]
      : [...options];
    const next: (TargetRef | null)[][] = [];
    for (const combo of combos) {
      for (const choice of choices) {
        if (next.length >= limit) break;
        const extended = [...combo, choice];
        // An "other than target n" relation is judged as each slot is
        // filled, so the cap never fills up with combos that break one — the
        // six slots of "up to six target permanents" would otherwise spend
        // it all on the first permanent chosen six times.
        if (otherSlotConflict(specs, extended) === null) next.push(extended);
      }
      if (next.length >= limit) break;
    }
    combos = next;
  });
  return combos;
}
