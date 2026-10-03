// How many *distinct* targets a spell has — what "for each target" cost
// modifications count (Hinata, Dawn-Crowned). Pure: no state, no registry, so
// the engine, the controllers and the bot can all ask the same questions.

import { anyNumberSlot, isOptionalSpec } from "./target.js";
import type { TargetRef, TargetSpec } from "./target.js";

/** The range of distinct-target counts a spell may be cast with and afford,
 * as a `cast-spell` `LegalAction` reports it. */
export interface TargetCountRange {
  readonly min: number;
  readonly max: number;
  /** How many tokens each compacted token stack among the options stands
   * for (`GameObject.stackCount`), keyed by the stack's object id — present
   * only when some option is one. A stack named in two slots is two targets,
   * not one: each slot is given its own token as the spell is cast
   * (`Game.lockInTargets`). */
  readonly copies?: TargetCopies;
}

/** Token-stack sizes by object id, for the stacks among a spell's target
 * options (see {@link TargetCountRange.copies}). */
export type TargetCopies = Readonly<Record<string, number>>;

function refKey(ref: TargetRef): string {
  return ref.kind === "player" ? `p:${ref.player}` : `o:${ref.object}`;
}

function copiesOf(ref: TargetRef, copies: TargetCopies | undefined): number {
  return ref.kind === "object" ? (copies?.[ref.object] ?? 1) : 1;
}

/**
 * The number of different players and objects among `targets` — Hinata's
 * ruling: a spell aimed at one creature through two "target creature"s has
 * one target for her purposes, not two. Holes (a skipped optional slot) count
 * for nothing. A token stack (`copies`) named in several slots counts once
 * per slot, up to its size, since each slot gets a token of its own.
 */
export function distinctTargetCount(
  targets: readonly (TargetRef | null | undefined)[] | undefined,
  copies?: TargetCopies,
): number {
  const uses = new Map<string, { ref: TargetRef; n: number }>();
  for (const ref of targets ?? []) {
    if (ref === null || ref === undefined) continue;
    const key = refKey(ref);
    const entry = uses.get(key);
    if (entry === undefined) uses.set(key, { ref, n: 1 });
    else entry.n += 1;
  }
  let count = 0;
  for (const { ref, n } of uses.values()) count += Math.min(n, copiesOf(ref, copies));
  return count;
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
  copies?: TargetCopies,
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
      // A token stack can't fill two slots as one target (each gets its own
      // token), so it covers one slot at a time.
      const key = copiesOf(ref, copies) > 1 ? `${refKey(ref)}#${slot}` : refKey(ref);
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
  // A token stack is as many targets as it has tokens.
  const keysOf = (ref: TargetRef): string[] => {
    const n = Math.min(copiesOf(ref, copies), options.length);
    return n > 1 ? Array.from({ length: n }, (_v, j) => `${refKey(ref)}#${j}`) : [refKey(ref)];
  };
  const owner = new Map<string, number>();
  const tryAssign = (slot: number, visited: Set<string>): boolean => {
    for (const key of options[slot].flatMap(keysOf)) {
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
 * Each change is kept only if it moves the count the right way (counted as
 * the engine counts it, token stacks included — `range.copies`). Drivers that
 * pick targets without reading costs (the fuzzer, the bots) run their choice
 * through this before echoing a `cast-spell` with a `targetCount`. An "any
 * number of target …" group (always last) is trimmed from its end or grown
 * from its options instead, as its members are chosen targets, not slots.
 */
export function fitTargetCount(
  chosen: readonly (TargetRef | null)[],
  options: readonly (readonly TargetRef[])[],
  specs: readonly TargetSpec[],
  range: TargetCountRange,
): (TargetRef | null)[] | null {
  const out = [...chosen];
  const count = () => distinctTargetCount(out, range.copies);
  const group = anyNumberSlot(specs);
  if (group >= 0) {
    while (count() > range.max && out.length > group) out.pop();
    for (const o of options[group] ?? []) {
      if (count() >= range.min) break;
      const before = count();
      out.push(o);
      if (count() <= before) out.pop();
    }
    const n = count();
    if (n >= range.min && n <= range.max) return out;
    // Still outside: the slots before the group, as below.
    const head = fitTargetCount(out.slice(0, group), options.slice(0, group), specs.slice(0, group), {
      ...range,
      min: Math.max(0, range.min - (n - distinctTargetCount(out.slice(0, group), range.copies))),
      max: Math.max(0, range.max - (n - distinctTargetCount(out.slice(0, group), range.copies))),
    });
    if (head === null) return null;
    const fitted = [...head, ...out.slice(group)];
    const total = distinctTargetCount(fitted, range.copies);
    return total >= range.min && total <= range.max ? fitted : null;
  }
  /** Point slot `i` at `ref` if that moves the count by `dir`; say whether. */
  const tryRef = (i: number, ref: TargetRef | null, dir: 1 | -1): boolean => {
    const before = count();
    const was = out[i];
    out[i] = ref;
    if ((count() - before) * dir > 0) return true;
    out[i] = was;
    return false;
  };
  for (let i = out.length - 1; i >= 0 && count() > range.max; i -= 1) {
    if (out[i] === null) continue;
    if (isOptionalSpec(specs[i] ?? "creature") && tryRef(i, null, -1)) continue;
    for (const o of options[i]) if (tryRef(i, o, -1)) break;
  }
  for (let i = 0; i < out.length && count() < range.min; i += 1) {
    for (const o of options[i]) if (tryRef(i, o, 1)) break;
  }
  const n = count();
  return n >= range.min && n <= range.max ? out : null;
}

/** An `{X}` spell's offered X ceilings by target count — see
 * `LegalAction` cast-spell's `xCost.maxXByTargetCount`. */
export interface XCostOffer {
  readonly maxX: number;
  readonly minX?: number;
  readonly maxXByTargetCount?: readonly number[];
  readonly minXByTargetCount?: readonly number[];
}

/** The largest X payable with `targets` chosen, when the cost depends on how
 * many there are (Fireball); `xCost.maxX` otherwise. */
export function maxXForTargets(
  xCost: XCostOffer,
  range: TargetCountRange | undefined,
  targets: readonly (TargetRef | null)[],
): number {
  const byCount = xCost.maxXByTargetCount;
  if (byCount === undefined || range === undefined) return xCost.maxX;
  return byCount[distinctTargetCount(targets, range.copies) - range.min] ?? 0;
}

/** The least X allowed with `targets` chosen: a target count tied to X
 * ("up to X target …" — Pest Infestation) needs X at least that count;
 * `xCost.minX` (or 0) otherwise. */
export function minXForTargets(
  xCost: XCostOffer,
  range: TargetCountRange | undefined,
  targets: readonly (TargetRef | null)[],
): number {
  const byCount = xCost.minXByTargetCount;
  if (byCount === undefined || range === undefined) return xCost.minX ?? 0;
  return byCount[distinctTargetCount(targets, range.copies) - range.min] ?? 0;
}

/** The part of `range` still payable once X is `x`: the target counts whose
 * ceiling reaches it, and whose floor (a count tied to X) it reaches.
 * `range` itself when X doesn't trade off against the count; `null` when no
 * count allows that X. */
export function targetCountAtX(
  range: TargetCountRange,
  xCost: XCostOffer | undefined,
  x: number,
): TargetCountRange | null {
  const byCount = xCost?.maxXByTargetCount;
  if (byCount === undefined) return range;
  const floors = xCost?.minXByTargetCount;
  const counts = byCount.flatMap((ceiling, i) =>
    ceiling >= x && (floors?.[i] ?? 0) <= x ? [range.min + i] : [],
  );
  if (counts.length === 0) return null;
  return { ...range, min: counts[0], max: counts[counts.length - 1] };
}
