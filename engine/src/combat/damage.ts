/**
 * Splitting an attacker's combat damage among its blockers — rule 510.1c and
 * the "standard" split every automatic answer uses.
 *
 * There is no damage assignment order any more: *Magic: The Gathering
 * Foundations* removed it, so a creature blocked by several others divides
 * its damage among them however its controller likes (510.1c), and only
 * trample asks for lethal on each before any goes over (702.19b). See
 * `docs/plans/damage-assignment-order.md`.
 *
 * This module exists because the split had two implementations. `Game`'s
 * `autoAssignForAttacker` derived the blockers and their lethal amounts off
 * the board; `controller.ts`'s `standardDamageAssignment` took them
 * pre-computed from the `assign-combat-damage` offer. Below the derivation
 * the two loops were byte-identical, so a rules fix to either one would have
 * silently disagreed with the other — the engine auto-assigning one way and
 * every controller answering another.
 *
 * {@link standardAssignment} is now the one copy, and
 * {@link autoAssignForAttacker} is the board-reading wrapper over it.
 *
 * Everything here is a read; applying an assignment stays on `Game`.
 */

import type { CardRegistry } from "../cards.js";
import { computeCharacteristics, objHasKeyword } from "../characteristics.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

/** The blockers of `attackerId` that are still on the battlefield — one may
 * have been removed in response after blocks were declared — in the order
 * they were declared, which means nothing to the rules but keeps every
 * per-blocker list lined up. */
export function liveBlockersOf(state: GameState, attackerId: ObjectId): ObjectId[] {
  return state.objects[attackerId].blockedBy.filter(
    (id) => state.objects[id]?.zone === "battlefield",
  );
}

/** How much damage counts as lethal to `blockerId` right now: its remaining
 * toughness, or 1 from a deathtouch attacker (rule 702.2b). */
export function lethalFor(
  state: GameState,
  registry: CardRegistry,
  attackerId: ObjectId,
  blockerId: ObjectId,
): number {
  if (objHasKeyword(state, registry, attackerId, "deathtouch")) return 1;
  const marked = state.objects[blockerId].damageMarked;
  const toughness = computeCharacteristics(state, registry, blockerId).toughness;
  return Math.max(0, toughness - marked);
}

/**
 * Whether the attacker's controller actually has a choice to make, or whether
 * the split is forced and can be auto-assigned without asking.
 *
 * Any two blockers make it a choice, since any division among them is legal.
 * A lone blocker takes everything, unless trample leaves room past its lethal.
 */
export function needsDamageAssignmentChoice(
  state: GameState,
  registry: CardRegistry,
  attackerId: ObjectId,
): boolean {
  const live = liveBlockersOf(state, attackerId);
  if (live.length === 0) return false;
  const power = computeCharacteristics(state, registry, attackerId).power;
  if (power <= 0) return false;
  if (live.length >= 2) return true;
  if (!objHasKeyword(state, registry, attackerId, "trample")) return false;
  return power > lethalFor(state, registry, attackerId, live[0]);
}

/** What an attacker's damage assignment is being decided against: how much
 * there is to assign, what counts as lethal to each blocker (in declaration
 * order), and whether the excess may trample over. */
export interface DamageAssignmentOffer {
  readonly power: number;
  readonly lethal: readonly number[];
  readonly trample: boolean;
}

/**
 * The standard combat-damage assignment: kill as many blockers as possible,
 * the ones needing least first (ties in declaration order). Whatever is left
 * tramples over if every blocker got lethal, and otherwise goes on the
 * cheapest blocker still short of it — or, with every blocker dead and no
 * trample, on the last one killed.
 *
 * **The one copy.** `Game` reaches it through {@link autoAssignForAttacker}
 * when nobody is asked; every controller reaches it directly as its default
 * answer when somebody is, and the client starts its damage bar from it.
 */
export function standardAssignment(offer: DamageAssignmentOffer): number[] {
  const { power, lethal, trample } = offer;
  const amounts = lethal.map(() => 0);
  if (lethal.length === 0) return amounts;
  const cheapestFirst = lethal.map((_, index) => index).sort((a, b) => lethal[a] - lethal[b] || a - b);
  let remaining = power;
  let killed = 0;
  for (const index of cheapestFirst) {
    if (lethal[index] > remaining) break;
    amounts[index] = lethal[index];
    remaining -= lethal[index];
    killed += 1;
  }
  if (remaining > 0 && !(trample && killed === lethal.length)) {
    amounts[cheapestFirst[Math.min(killed, lethal.length - 1)]] += remaining;
  }
  return amounts;
}

/** {@link standardAssignment} with the offer read off the board — what the
 * engine assigns when {@link needsDamageAssignmentChoice} says there is no
 * choice worth asking about. */
export function autoAssignForAttacker(
  state: GameState,
  registry: CardRegistry,
  attackerId: ObjectId,
): number[] {
  const live = liveBlockersOf(state, attackerId);
  return standardAssignment({
    power: computeCharacteristics(state, registry, attackerId).power,
    lethal: live.map((blockerId) => lethalFor(state, registry, attackerId, blockerId)),
    trample: objHasKeyword(state, registry, attackerId, "trample"),
  });
}

/**
 * Why `assignment` is not a legal answer to `offer`, or `null` if it is —
 * rules 510.1c and 702.19b, plus the arithmetic around them. Any division of
 * the attacker's power among its blockers is legal; only damage trampled over
 * needs every blocker to have lethal first (damage already marked counts,
 * and 1 is lethal from deathtouch — both folded into `lethal`).
 *
 * Deliberately says nothing about *who* is being asked: that guard, and its
 * "is not being asked to assign combat damage" wording, stay with the caller
 * (`Game.whyCannotAssignCombatDamage`), because two engine tests and the
 * client's error banner read it verbatim.
 */
export function damageAssignmentViolations(
  offer: DamageAssignmentOffer & { readonly blockers: readonly ObjectId[] },
  assignment: readonly number[],
): string | null {
  const { blockers, power, lethal, trample } = offer;
  if (assignment.length !== blockers.length) {
    return `expected an amount for each of ${blockers.length} blocker(s), got ${assignment.length}`;
  }
  if (assignment.some((n) => !Number.isInteger(n) || n < 0)) {
    return "combat damage assignments must be non-negative whole numbers";
  }
  const total = assignment.reduce((sum, n) => sum + n, 0);
  const over = power - total;
  if (over < 0) return "assigned more than the attacker's power";
  if (over > 0 && !trample) {
    return "only a trampling attacker can assign combat damage to the defending player";
  }
  if (over > 0) {
    for (let j = 0; j < blockers.length; j += 1) {
      if (assignment[j] < lethal[j]) {
        return "every blocker must be assigned lethal damage before trampling over";
      }
    }
  }
  return null;
}
