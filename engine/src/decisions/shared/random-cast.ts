/**
 * A random, legal cast built from one `cast-spell` offer — the fuzzer's
 * answer to a `cast-now` decision. The same choices `RandomController` makes
 * for a cast from priority (modes, targets, X, the offer's own variant flags
 * and extras), kept pure and free of the controller so a decision module can
 * use it. `null` when the offer can't be filled after all.
 */

import type { Action, CastSpellOffer } from "../../actions.js";
import { convokeProofFor } from "../../actions.js";
import type { ObjectId, PlayerId } from "../../primitives.js";
import type { TargetRef, TargetSpec } from "../../target.js";
import { fitTargetCount, maxXForTargets } from "../../target-count.js";
import type { RandomSource } from "../contract.js";

export function randomCast(
  legal: CastSpellOffer,
  player: PlayerId,
  rng: RandomSource,
): Extract<Action, { type: "cast-spell" }> | null {
  let modes: number[] | undefined;
  let options: readonly (readonly TargetRef[])[] = legal.targetOptions;
  let specs: readonly TargetSpec[] = legal.targetSpecs;
  if (legal.castModal !== undefined) {
    const cm = legal.castModal;
    const castable = cm.modes
      .map((_m, i) => i)
      .filter((i) => cm.modes[i].targetOptions.every((o) => o.length > 0));
    const most = Math.min(cm.maxModes, castable.length);
    if (most < cm.minModes) return null;
    const want = cm.minModes + rng.pickIndex(most - cm.minModes + 1);
    const pool = [...castable];
    modes = [];
    for (let i = 0; i < want; i += 1) modes.push(pool.splice(rng.pickIndex(pool.length), 1)[0]);
    modes.sort((a, b) => a - b);
    options = modes.flatMap((i) => cm.modes[i].targetOptions);
    specs = modes.flatMap((i) => cm.modes[i].targetSpecs);
  }
  const picked = rng.pickTargets(options, specs);
  const targets = legal.targetCount === undefined ? picked : fitTargetCount(picked, options, specs, legal.targetCount);
  if (targets === null) return null;
  const xValue = legal.xCost === undefined ? undefined : rng.pickIndex(maxXForTargets(legal.xCost, legal.targetCount, targets) + 1);
  const sac = legal.sacrifice;
  const tap: ObjectId[] = [];
  if (legal.tapCost !== undefined) {
    const pool: ObjectId[] = [];
    for (const id of legal.tapCost.choices) {
      for (let i = 0; i < (legal.tapCost.copies?.[id] ?? 1); i += 1) pool.push(id);
    }
    for (let i = 0; i < legal.tapCost.count && pool.length > 0; i += 1) {
      tap.push(pool.splice(rng.pickIndex(pool.length), 1)[0]);
    }
  }
  const convoke = legal.convoke === undefined ? [] : convokeProofFor(legal.convoke, xValue ?? 0);
  return {
    type: "cast-spell",
    player,
    card: legal.card,
    targets,
    ...(modes !== undefined ? { modes } : {}),
    ...(xValue !== undefined ? { xValue } : {}),
    ...(legal.via !== undefined ? { via: legal.via } : {}),
    ...(legal.face !== undefined ? { face: legal.face } : {}),
    ...(legal.graveyardGrant !== undefined ? { graveyardGrant: legal.graveyardGrant } : {}),
    ...(legal.kicked === true ? { kicked: true } : {}),
    ...(legal.offspring === true ? { offspring: true } : {}),
    ...(legal.evoke === true ? { evoke: true, evokeCost: legal.evokeCost } : {}),
    ...(legal.prototype === true ? { prototype: true } : {}),
    ...(legal.overload === true ? { overload: true } : {}),
    ...(legal.free === true ? { free: true } : {}),
    ...(legal.altCost === true ? { altCost: true } : {}),
    ...(legal.costOption !== undefined ? { costOption: legal.costOption } : {}),
    ...(sac !== undefined && sac.choices.length > 0 ? { sacrifice: sac.choices[rng.pickIndex(sac.choices.length)] } : {}),
    ...(legal.tapCost !== undefined ? { tap } : {}),
    ...(convoke.length > 0 ? { convoke } : {}),
    ...(legal.escapeExile !== undefined
      ? { escapeExile: legal.escapeExile.choices.slice(legal.escapeExile.choices.length - legal.escapeExile.count) }
      : {}),
  };
}
