/**
 * Choosing permanents as an effect resolves, with no targeting — "untap up to
 * two lands" (Snap, Frantic Search, Peregrine Drake). An instruction that
 * doesn't say "target" is carried out as it applies (rule 608.2c), so the
 * choice is made then, among whatever matches then: nothing is chosen as the
 * spell is cast, a hexproof permanent can be chosen, and nothing chosen can
 * make the spell fizzle.
 *
 * The raise is `Game.beginChoosePermanents`, reached from the
 * `choose-permanents` effect; the answer applies that effect's `then` to each
 * permanent picked. A compacted token stack is one entry that may be named up
 * to its size, as `sacrifice`'s is.
 *
 * It also asks a spell's casualty cost as it's cast (rule 702.153a — "you may
 * sacrifice a creature with power N or greater"): up to one of the caster's
 * creatures, raised by `Game.promptNextCasualty` with the awaiting's
 * `casualty` set, and answered by `Game.applyCasualty` instead of `then`.
 */

import type { Action, LegalAction } from "../actions.js";
import { computeCharacteristics } from "../characteristics.js";
import type { ObjectId } from "../primitives.js";
import type { DecisionReadCtx } from "./contract.js";
import { defineDecision } from "./define.js";
import { subsetOf, withinCopies } from "./shared/picks.js";

/** How many permanents each stack entry stands for, where more than one. */
function stackSizes(ctx: DecisionReadCtx, eligible: readonly ObjectId[]): Record<ObjectId, number> {
  const copies: Record<ObjectId, number> = {};
  for (const id of eligible) {
    const n = ctx.state.objects[id]?.stackCount ?? 1;
    if (n > 1) copies[id] = n;
  }
  return copies;
}

export const choosePermanents = defineDecision({
  kind: "choose-permanents",

  hasSource: true,

  legal: (ctx, awaiting): LegalAction[] => {
    const copies = stackSizes(ctx, awaiting.eligible);
    return [
      {
        kind: "choose-permanents",
        eligible: [...awaiting.eligible],
        min: awaiting.min,
        max: awaiting.max,
        prompt: awaiting.prompt,
        ...(Object.keys(copies).length > 0 ? { copies } : {}),
        ...(awaiting.maxTotalPower !== undefined
          ? { maxTotalPower: awaiting.maxTotalPower, powers: powersOf(ctx, awaiting.eligible) }
          : {}),
      },
    ];
  },

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked to choose permanents`;
    if (action.type !== "choose-permanents") return asked;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-permanents" || awaiting.player !== player) {
      return asked;
    }
    const picked = action.permanents;
    if (picked.length < awaiting.min || picked.length > awaiting.max) {
      return awaiting.min === awaiting.max
        ? `${player} must choose exactly ${awaiting.max}, chose ${picked.length}`
        : `${player} must choose from ${awaiting.min} to ${awaiting.max}, chose ${picked.length}`;
    }
    const why =
      withinCopies(picked, stackSizes(ctx, awaiting.eligible), (id, limit) =>
        limit === 1
          ? `${player} chose the same permanent twice`
          : `${player} chose ${id} more than the ${limit} it stands for`,
      ) ?? subsetOf(picked, awaiting.eligible, (id) => `${id} can't be chosen`);
    if (why !== null || awaiting.maxTotalPower === undefined) return why;
    const powers = powersOf(ctx, awaiting.eligible);
    const total = picked.reduce((n, id) => n + (powers[id] ?? 0), 0);
    return total > awaiting.maxTotalPower
      ? `${player} chose a total power of ${total}, more than ${awaiting.maxTotalPower}`
      : null;
  },

  apply: (host, action): void => {
    if (action.type !== "choose-permanents") return;
    host.applyChoosePermanents(action.player, action.permanents);
  },

  ask: (controller, view, awaiting, player): Action => {
    const offer = view
      .legalActions()
      .find((a): a is Extract<LegalAction, { kind: "choose-permanents" }> => a.kind === "choose-permanents");
    const cap =
      awaiting.maxTotalPower !== undefined && offer?.powers !== undefined
        ? { maxTotalPower: awaiting.maxTotalPower, powers: offer.powers }
        : undefined;
    return {
      type: "choose-permanents",
      player,
      permanents: controller.choosePermanents(view, awaiting.eligible, awaiting.min, awaiting.max, cap),
    };
  },

  /**
   * A few answers rather than every subset: as many of your own as allowed
   * (what "untap up to two lands" nearly always wants), as few as allowed,
   * and as many as allowed from the whole list — so the search can tell
   * whether reaching past your own permanents is ever worth it.
   */
  candidates: (legal, player, _limit, helpers): Action[] => {
    if (legal.kind !== "choose-permanents") return [];
    // Kept under a power cap (Slaughter the Strong): the most power that
    // fits, the most valuable first while it fits, and keeping nothing (for
    // a deck that wants its creatures to die).
    if (legal.maxTotalPower !== undefined && legal.powers !== undefined) {
      const units = expand(legal.eligible, legal.copies);
      const answers = [
        keepMostPower(units, legal.powers, legal.maxTotalPower),
        keepInOrder(expand(helpers.order(legal.eligible), legal.copies), legal.powers, legal.maxTotalPower),
        [],
      ];
      const seen = new Set<string>();
      return answers
        .filter((picked) => {
          const key = [...picked].sort().join(",");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((permanents) => ({ type: "choose-permanents", player, permanents }));
    }
    const mine = legal.eligible.filter((id) => helpers.controllerOf(id) === player);
    const theirs = legal.eligible.filter((id) => helpers.controllerOf(id) !== player);
    const fit = (list: readonly ObjectId[]): ObjectId[] => {
      const out = list.slice(0, legal.max);
      for (const id of [...mine, ...theirs]) {
        if (out.length >= legal.min) break;
        if (!out.includes(id)) out.push(id);
      }
      return out;
    };
    const answers = [fit(mine), fit([]), fit(legal.eligible)];
    const seen = new Set<string>();
    return answers
      .filter((picked) => {
        const key = picked.join(",");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((permanents) => ({ type: "choose-permanents", player, permanents }));
  },

  // A random number of distinct entries within the bounds — under a power
  // cap, a coin flip for each in a random order while it fits.
  randomAnswer: (legal, player, rng): Action => {
    const pool = [...legal.eligible];
    if (legal.maxTotalPower !== undefined) {
      const permanents: ObjectId[] = [];
      let total = 0;
      while (pool.length > 0) {
        const id = pool.splice(rng.pickIndex(pool.length), 1)[0];
        const power = legal.powers?.[id] ?? 0;
        if (rng.pickIndex(2) === 0 || total + power > legal.maxTotalPower) continue;
        permanents.push(id);
        total += power;
      }
      return { type: "choose-permanents", player, permanents };
    }
    const count = legal.min + rng.pickIndex(Math.min(legal.max, pool.length) - legal.min + 1);
    const permanents: ObjectId[] = [];
    while (permanents.length < count && pool.length > 0) {
      permanents.push(pool.splice(rng.pickIndex(pool.length), 1)[0]);
    }
    return { type: "choose-permanents", player, permanents };
  },
});

/** Each of `eligible`'s power, for a choice under a power cap. */
function powersOf(ctx: DecisionReadCtx, eligible: readonly ObjectId[]): Record<ObjectId, number> {
  const out: Record<ObjectId, number> = {};
  for (const id of eligible) out[id] = computeCharacteristics(ctx.state, ctx.registry, id).power;
  return out;
}

/** `ids` with a compacted token stack named once per member. */
function expand(ids: readonly ObjectId[], copies: Readonly<Record<ObjectId, number>> | undefined): ObjectId[] {
  return ids.flatMap((id) => Array<ObjectId>(copies?.[id] ?? 1).fill(id));
}

/** In order, each that still fits under `cap` — a power of 0 or less
 * always does, making room for the rest. */
function keepInOrder(units: readonly ObjectId[], powers: Readonly<Record<ObjectId, number>>, cap: number): ObjectId[] {
  const free = units.filter((id) => (powers[id] ?? 0) <= 0);
  let left = cap - free.reduce((n, id) => n + (powers[id] ?? 0), 0);
  const kept = [...free];
  for (const id of units) {
    const power = powers[id] ?? 0;
    if (power <= 0 || power > left) continue;
    kept.push(id);
    left -= power;
  }
  return kept;
}

/** Most units searched every subset of; past it, the biggest first. */
const EXHAUSTIVE_KEEP = 14;

/**
 * The most total power `units` can keep under `cap` (Slaughter the
 * Strong's 4), then the most creatures: every subset of the ones with power
 * when there are few, the biggest first when there are many. A power of 0
 * or less is always kept.
 */
export function keepMostPower(
  units: readonly ObjectId[],
  powers: Readonly<Record<ObjectId, number>>,
  cap: number,
): ObjectId[] {
  const power = (id: ObjectId): number => powers[id] ?? 0;
  const free = units.filter((id) => power(id) <= 0);
  const rest = units.filter((id) => power(id) > 0);
  const room = cap - free.reduce((n, id) => n + power(id), 0);
  if (rest.length > EXHAUSTIVE_KEEP) {
    return keepInOrder([...free, ...[...rest].sort((a, b) => power(b) - power(a))], powers, cap);
  }
  let best: ObjectId[] = [];
  let bestPower = -1;
  for (let mask = 0; mask < 1 << rest.length; mask += 1) {
    const picked = rest.filter((_, i) => mask & (1 << i));
    const total = picked.reduce((n, id) => n + power(id), 0);
    if (total > room) continue;
    if (total > bestPower || (total === bestPower && picked.length > best.length)) {
      best = picked;
      bestPower = total;
    }
  }
  return [...free, ...best];
}
