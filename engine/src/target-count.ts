// How many *distinct* targets a spell has — what "for each target" cost
// modifications count (Hinata, Dawn-Crowned). Pure: no state, no registry, so
// the engine, the controllers and the bot can all ask the same questions.

import { isOptionalSpec } from "./target.js";
import type { TargetRef, TargetSpec } from "./target.js";

/** The range of distinct-target counts a spell may be cast with and afford,
 * as a `cast-spell` `LegalAction` reports it. */
export interface TargetCountRange {
  readonly min: number;
  readonly max: number;
}

function refKey(ref: TargetRef): string {
  return ref.kind === "player" ? `p:${ref.player}` : `o:${ref.object}`;
}

/**
 * The number of different players and objects among `targets` — Hinata's
 * ruling: a spell aimed at one creature through two "target creature"s has
 * one target for her purposes, not two. Holes (a skipped optional slot) count
 * for nothing.
 */
export function distinctTargetCount(
  targets: readonly (TargetRef | null | undefined)[] | undefined,
): number {
  const seen = new Set<string>();
  for (const ref of targets ?? []) {
    if (ref !== null && ref !== undefined) seen.add(refKey(ref));
  }
  return seen.size;
}

/**
 * The fewest and most distinct targets a legal choice over these slots can
 * have. The fewest is a minimum cover of the *required* slots by targets (one
 * creature legal in two slots can fill both); the most is a maximum matching
 * of slots to targets over every slot, optional ones included. `null` when a
 * required slot has no option at all.
 */
export function targetCountBounds(
  options: readonly (readonly TargetRef[])[],
  specs: readonly TargetSpec[],
): TargetCountRange | null {
  const required = options
    .map((_o, i) => i)
    .filter((i) => !isOptionalSpec(specs[i] ?? "creature"));
  if (required.some((i) => options[i].length === 0)) return null;

  // Minimum cover of the required slots: a DP over which of them are filled.
  // Slot counts are small (a handful), so 2^n states is nothing.
  const masks = new Map<string, number>();
  required.forEach((slot, bit) => {
    for (const ref of options[slot]) {
      const key = refKey(ref);
      masks.set(key, (masks.get(key) ?? 0) | (1 << bit));
    }
  });
  const full = (1 << required.length) - 1;
  const best: number[] = new Array<number>(full + 1).fill(Number.POSITIVE_INFINITY);
  best[0] = 0;
  for (let mask = 0; mask <= full; mask += 1) {
    if (!Number.isFinite(best[mask])) continue;
    for (const cover of masks.values()) {
      const next = mask | cover;
      if (next !== mask && best[mask] + 1 < best[next]) best[next] = best[mask] + 1;
    }
  }
  const min = best[full];

  // Maximum matching of slots to distinct targets (Kuhn's augmenting paths).
  const owner = new Map<string, number>();
  const tryAssign = (slot: number, visited: Set<string>): boolean => {
    for (const ref of options[slot]) {
      const key = refKey(ref);
      if (visited.has(key)) continue;
      visited.add(key);
      const holder = owner.get(key);
      if (holder === undefined || tryAssign(holder, visited)) {
        owner.set(key, slot);
        return true;
      }
    }
    return false;
  };
  let max = 0;
  for (let slot = 0; slot < options.length; slot += 1) {
    if (tryAssign(slot, new Set())) max += 1;
  }
  return { min, max: Math.max(min, max) };
}

/**
 * `chosen`, re-pointed until its distinct-target count lies inside `range`,
 * or `null` when that can't be done by these means. Too many: skip optional
 * slots, then aim a slot at a target another slot already has. Too few: fill
 * skipped optional slots, then move a doubled-up slot onto a fresh target.
 * Drivers that pick targets without reading costs (the fuzzer, the bots) run
 * their choice through this before echoing a `cast-spell` with a
 * `targetCount`.
 */
export function fitTargetCount(
  chosen: readonly (TargetRef | null)[],
  options: readonly (readonly TargetRef[])[],
  specs: readonly TargetSpec[],
  range: TargetCountRange,
): (TargetRef | null)[] | null {
  const out = [...chosen];
  const count = () => distinctTargetCount(out);
  const uses = (key: string) => out.filter((r) => r !== null && refKey(r) === key).length;
  for (let i = out.length - 1; i >= 0 && count() > range.max; i -= 1) {
    const ref = out[i];
    if (ref === null || uses(refKey(ref)) > 1) continue;
    if (isOptionalSpec(specs[i] ?? "creature")) {
      out[i] = null;
      continue;
    }
    const shared = options[i].find((o) => refKey(o) !== refKey(ref) && uses(refKey(o)) > 0);
    if (shared !== undefined) out[i] = shared;
  }
  for (let i = 0; i < out.length && count() < range.min; i += 1) {
    const ref = out[i];
    if (ref !== null && uses(refKey(ref)) === 1) continue;
    const fresh = options[i].find((o) => uses(refKey(o)) === 0);
    if (fresh !== undefined) out[i] = fresh;
  }
  const n = count();
  return n >= range.min && n <= range.max ? out : null;
}
