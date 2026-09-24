/**
 * The block-declaration rules that constrain a *set* of blocks rather than
 * any single one: menace (rule 702.111), "must be blocked" (Lure, rule
 * 509.1c) and "must be blocked if able" (at least one blocker — also a
 * requirement under rule 509.1c).
 *
 * Lure is a requirement and menace a restriction, and rule 509.1c says how
 * they meet: a declaration has to obey as many requirements as it can
 * without breaking a restriction. So a Lured attacker with menace forces
 * every creature able to block it only when at least two can; a lone one
 * isn't forced, since blocking alone is illegal. When several such attackers
 * share blockers, "every creature able" can be impossible to obey, so
 * {@link lurePlan} works out the most that can be.
 *
 * Every other block check asks "may this creature block that attacker?" and
 * is answered per pair by `combat/eligibility.ts`'s `whyCannotBlock`. These
 * two can only be answered once the whole declaration is known — menace
 * because it counts blockers per attacker, Lure because it asks whether a
 * creature that *could* have blocked chose not to.
 *
 * **Checked against the offer, not the board.** Both take the
 * `declare-blockers` `LegalAction`, whose `menaceAttackers`, `mustBlock` and
 * `eligible` fields were computed when blockers were asked for. The engine
 * builds that offer from live state and checks against it, so the validator
 * cannot disagree with what was advertised — and the client, which has the
 * offer and no board, can run precisely the same check to decide whether its
 * Confirm button is enabled.
 *
 * Returns *which* rules were broken and by whom rather than a message,
 * because the engine names creatures from its registry and the client from
 * its view — and returns **all** of them rather than the first, because the
 * engine only needs to report one but the client tells the player about every
 * offending creature at once. A first-violation-only signature would have
 * made the shared version worse than the copy it replaced.
 */

import type { BlockerDeclaration, LegalAction } from "../actions.js";
import type { ObjectId } from "../primitives.js";

/** The `declare-blockers` offer, which is all these checks need. */
export type BlockOffer = Extract<LegalAction, { kind: "declare-blockers" }>;

/** Which set-level rule a declaration breaks. */
export type BlockingViolation =
  /** `attacker` has menace and exactly one creature was assigned to it. */
  | { readonly kind: "menace"; readonly attacker: ObjectId }
  /** `blocker` could have blocked a must-be-blocked attacker and didn't. */
  | { readonly kind: "must-be-blocked"; readonly blocker: ObjectId }
  /** `attacker` must be blocked if able, could have been, and wasn't. */
  | { readonly kind: "must-be-blocked-if-able"; readonly attacker: ObjectId };

/** How many creatures a declaration has to have blocking must-be-blocked
 * attackers, and one way of getting there. */
export interface LurePlan {
  /** The most creatures that can be blocking must-be-blocked attackers at
   * once without breaking menace — a token stack counting as every token in
   * it, as it does for menace. A declaration with fewer disobeys Lure. */
  readonly required: number;
  /** One assignment that reaches `required`: blocker → the must-be-blocked
   * attacker it blocks. Only creatures that have to block are in it. */
  readonly assignment: ReadonlyMap<ObjectId, ObjectId>;
}

/**
 * Past this many steps, {@link lurePlan} stops searching and lets a Lured
 * attacker with menace force nothing, which is what the engine did before
 * it searched at all. That errs lenient: every declaration that would have
 * been legal stays legal. A real board needs a handful of steps, since the
 * search only covers creatures able to block a Lured attacker with menace.
 */
const LURE_SEARCH_LIMIT = 100_000;

/**
 * How many creatures `offer` forces onto must-be-blocked attackers (rule
 * 509.1c), and one assignment that does it.
 *
 * A creature able to block a must-be-blocked attacker *without* menace can
 * always obey, so it always has to. The search is only over creatures able
 * to block one *with* menace: each goes to one of those attackers or to none,
 * every such attacker ends up with no blockers or with two or more, and the
 * creatures that could only obey there count toward the total. The ones that
 * could obey elsewhere count anyway, so for them the search is only about
 * whether they help make up a pair.
 */
export function lurePlan(offer: BlockOffer): LurePlan {
  const menace = new Set(offer.menaceAttackers);
  const must = new Set(offer.mustBlock);
  let required = 0;
  const assignment = new Map<ObjectId, ObjectId>();
  const pairable: { blocker: ObjectId; weight: number; options: ObjectId[]; free: boolean }[] = [];
  for (const entry of offer.eligible) {
    const weight = entry.copies ?? 1;
    const plain = entry.canBlock.filter((a) => must.has(a) && !menace.has(a));
    const withMenace = entry.canBlock.filter((a) => must.has(a) && menace.has(a));
    if (plain.length > 0) {
      required += weight;
      assignment.set(entry.blocker, plain[0]);
    }
    if (withMenace.length > 0) {
      pairable.push({ blocker: entry.blocker, weight, options: withMenace, free: plain.length > 0 });
    }
  }
  if (pairable.length === 0) return { required, assignment };

  // Depth-first over `pairable`, trying each attacker before "none" so the
  // first best found blocks rather than holds back; `reachable[i]` bounds
  // what the creatures from `i` on could still add.
  const reachable = new Array<number>(pairable.length + 1).fill(0);
  for (let i = pairable.length - 1; i >= 0; i -= 1) {
    reachable[i] = reachable[i + 1] + (pairable[i].free ? 0 : pairable[i].weight);
  }
  const load = new Map<ObjectId, number>();
  const choice: (ObjectId | null)[] = pairable.map(() => null);
  let best = -1;
  let bestChoice: (ObjectId | null)[] = [];
  let steps = 0;
  const search = (i: number, value: number): boolean => {
    steps += 1;
    if (steps > LURE_SEARCH_LIMIT) return false;
    if (value + reachable[i] <= best) return true;
    if (i === pairable.length) {
      for (const count of load.values()) if (count === 1) return true;
      best = value;
      bestChoice = [...choice];
      return true;
    }
    const { weight, options, free } = pairable[i];
    for (const attacker of options) {
      choice[i] = attacker;
      load.set(attacker, (load.get(attacker) ?? 0) + weight);
      const finished = search(i + 1, value + (free ? 0 : weight));
      load.set(attacker, (load.get(attacker) ?? 0) - weight);
      if (!finished) return false;
    }
    choice[i] = null;
    return search(i + 1, value);
  };
  if (!search(0, 0)) return { required, assignment };

  pairable.forEach((p, i) => {
    const attacker = bestChoice[i];
    if (attacker !== null && attacker !== undefined) assignment.set(p.blocker, attacker);
  });
  return { required: required + best, assignment };
}

/**
 * Every set-level rule `blocks` breaks against `offer`, menace first.
 *
 * The engine reports `[0]`, which preserves the order its messages have
 * always come out in; the client lists them all.
 */
export function blockingViolations(
  blocks: readonly BlockerDeclaration[],
  offer: BlockOffer,
): BlockingViolation[] {
  const out: BlockingViolation[] = [];
  // Creatures, not declarations: a token stack assigned to an attacker is
  // every token in it, so a stack of eight satisfies menace on its own.
  const copies = new Map(offer.eligible.map((e) => [e.blocker, e.copies ?? 1]));
  const perAttacker = new Map<ObjectId, number>();
  for (const { blocker, attacker } of blocks) {
    perAttacker.set(attacker, (perAttacker.get(attacker) ?? 0) + (copies.get(blocker) ?? 1));
  }
  for (const [attacker, count] of perAttacker) {
    if (count === 1 && offer.menaceAttackers.includes(attacker)) {
      out.push({ kind: "menace", attacker });
    }
  }

  // Lure: as many creatures blocking must-be-blocked attackers as there can
  // be (`lurePlan`). Short of that, the creatures named are the ones the
  // plan has blocking and this declaration doesn't — with no menace in play,
  // exactly every creature able to block one that isn't.
  if (offer.mustBlock.length > 0) {
    const plan = lurePlan(offer);
    const blockingAMust = new Set(
      blocks.filter((b) => offer.mustBlock.includes(b.attacker)).map((b) => b.blocker),
    );
    let obeyed = 0;
    for (const blocker of blockingAMust) obeyed += copies.get(blocker) ?? 1;
    if (obeyed < plan.required) {
      for (const entry of offer.eligible) {
        if (!blockingAMust.has(entry.blocker) && plan.assignment.has(entry.blocker)) {
          out.push({ kind: "must-be-blocked", blocker: entry.blocker });
        }
      }
    }
  }

  // "Must be blocked if able": as many of those attackers blocked as can be
  // (`ifAblePlan`). Short of that, the ones named are the ones the plan
  // blocks and this declaration doesn't.
  const ifAble = offer.mustBeBlockedIfAble ?? [];
  if (ifAble.length > 0) {
    const plan = ifAblePlan(offer);
    const need = (attacker: ObjectId): number => (offer.menaceAttackers.includes(attacker) ? 2 : 1);
    const obeyed = ifAble.filter((a) => (perAttacker.get(a) ?? 0) >= need(a));
    if (obeyed.length < plan.required) {
      const planned = new Set(plan.assignment.values());
      for (const attacker of ifAble) {
        if (planned.has(attacker) && !obeyed.includes(attacker)) {
          out.push({ kind: "must-be-blocked-if-able", attacker });
        }
      }
    }
  }
  return out;
}

/**
 * How many "must be blocked if able" attackers (`offer.mustBeBlockedIfAble`)
 * can be blocked at once, and one assignment that does it — each by one
 * creature, or two with menace (a token stack counting as every token in
 * it), out of the creatures {@link lurePlan} doesn't already need. Those
 * stay where Lure has them: moving one would trade a requirement for a
 * requirement (rule 509.1c counts both alike), so a declaration obeying
 * Lure first is always among the most obedient.
 *
 * A search over the attackers in order — each blocked by one of the ways
 * open to it, or not — keeping the best; bounded like `lurePlan`'s, and as
 * lenient past the bound.
 */
export function ifAblePlan(offer: BlockOffer): LurePlan {
  const attackers = offer.mustBeBlockedIfAble ?? [];
  const assignment = new Map<ObjectId, ObjectId>();
  if (attackers.length === 0) return { required: 0, assignment };
  const needed = offer.mustBlock.length > 0 ? lurePlan(offer).assignment : new Map<ObjectId, ObjectId>();
  const free = offer.eligible.filter((e) => !needed.has(e.blocker));
  const menace = new Set(offer.menaceAttackers);
  // The ways each attacker can be blocked: one creature, or — with menace —
  // one stack of two or more, or any two creatures.
  const ways = attackers.map((attacker) => {
    const able = free.filter((e) => e.canBlock.includes(attacker));
    if (!menace.has(attacker)) return able.map((e) => [e.blocker]);
    const out: ObjectId[][] = able.filter((e) => (e.copies ?? 1) >= 2).map((e) => [e.blocker]);
    for (let i = 0; i < able.length; i += 1) {
      for (let j = i + 1; j < able.length; j += 1) out.push([able[i].blocker, able[j].blocker]);
    }
    return out;
  });
  const used = new Set<ObjectId>();
  const choice: (ObjectId[] | null)[] = attackers.map(() => null);
  let best = 0;
  let bestChoice: (ObjectId[] | null)[] = [...choice];
  let steps = 0;
  const search = (i: number, value: number): boolean => {
    steps += 1;
    if (steps > LURE_SEARCH_LIMIT) return false;
    if (value + (attackers.length - i) <= best) return true;
    if (i === attackers.length) {
      best = value;
      bestChoice = [...choice];
      return true;
    }
    for (const way of ways[i]) {
      if (way.some((b) => used.has(b))) continue;
      for (const b of way) used.add(b);
      choice[i] = way;
      const finished = search(i + 1, value + 1);
      for (const b of way) used.delete(b);
      choice[i] = null;
      if (!finished) return false;
    }
    return search(i + 1, value);
  };
  search(0, 0);
  bestChoice.forEach((way, i) => {
    for (const blocker of way ?? []) assignment.set(blocker, attackers[i]);
  });
  return { required: best, assignment };
}

/**
 * `blocks` made to obey Lure and menace, for a policy that builds its own
 * declaration (the fuzzer's, v1's) rather than searching legal ones.
 * Returned unchanged when it already does. Otherwise every creature
 * {@link lurePlan} needs is moved where the plan has it, and a menace
 * attacker left with a lone blocker loses it. Deterministic, so it moves no
 * fuzzer seed on a board it doesn't change.
 */
export function obeyingLure(
  blocks: readonly BlockerDeclaration[],
  offer: BlockOffer,
): BlockerDeclaration[] {
  if (blockingViolations(blocks, offer).length === 0) return [...blocks];
  // Lure's creatures where its plan has them, then — out of the rest — the
  // "must be blocked if able" plan's (see `ifAblePlan`, which leaves Lure's
  // alone).
  const assignment = new Map([...lurePlan(offer).assignment, ...ifAblePlan(offer).assignment]);
  const moved: BlockerDeclaration[] = [
    ...blocks.filter((b) => !assignment.has(b.blocker)),
    ...[...assignment].map(([blocker, attacker]) => ({ blocker, attacker })),
  ];
  const copies = new Map(offer.eligible.map((e) => [e.blocker, e.copies ?? 1]));
  const load = new Map<ObjectId, number>();
  for (const { blocker, attacker } of moved) {
    load.set(attacker, (load.get(attacker) ?? 0) + (copies.get(blocker) ?? 1));
  }
  return moved.filter((b) => !offer.menaceAttackers.includes(b.attacker) || (load.get(b.attacker) ?? 0) >= 2);
}
