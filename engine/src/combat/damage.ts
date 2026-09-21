/**
 * Splitting an attacker's combat damage among its blockers — rule 510.1c and
 * the "standard" split every automatic answer uses.
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
 * have been removed in response after blocks were declared. */
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
  const trample = objHasKeyword(state, registry, attackerId, "trample");
  if (live.length === 1 && !trample) return false;
  // Damage that's rigidly forced: lethal to each blocker except (without
  // trample) the last, which just takes the remainder.
  let forced = 0;
  live.forEach((blockerId, index) => {
    if (!trample && index === live.length - 1) return;
    forced += lethalFor(state, registry, attackerId, blockerId);
  });
  return power > forced;
}

/** What an attacker's damage assignment is being decided against: how much
 * there is to assign, what counts as lethal to each blocker in order, and
 * whether the excess may trample over. */
export interface DamageAssignmentOffer {
  readonly power: number;
  readonly lethal: readonly number[];
  readonly trample: boolean;
}

/**
 * The standard combat-damage assignment: lethal down the blocker order, the
 * remainder to the last blocker (or, with trample, over to the defender).
 *
 * **The one copy.** `Game` reaches it through {@link autoAssignForAttacker}
 * when nobody is asked; every controller reaches it directly as its default
 * answer when somebody is.
 */
export function standardAssignment(offer: DamageAssignmentOffer): number[] {
  let remaining = offer.power;
  return offer.lethal.map((lethal, index) => {
    const isLastAndNoTrample = !offer.trample && index === offer.lethal.length - 1;
    const amount = isLastAndNoTrample ? remaining : Math.min(remaining, lethal);
    remaining -= amount;
    return amount;
  });
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
 * rule 510.1c, plus the arithmetic around it.
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
  // Rule 510.1c: an amount may be assigned to a blocker (or trampled over)
  // only once every *earlier* blocker has at least lethal.
  for (let i = 0; i < blockers.length; i += 1) {
    const laterAssigned = assignment[i] > 0;
    if (!laterAssigned && over === 0) continue;
    for (let j = 0; j < i; j += 1) {
      if (assignment[j] < lethal[j]) {
        return "each earlier blocker must be assigned lethal damage first";
      }
    }
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
