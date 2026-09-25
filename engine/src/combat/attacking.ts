/**
 * The attack-declaration rule that constrains a *set* of attackers rather
 * than any single one: a creature that must attack if able (rule 508.1d —
 * "attacks each combat if able", goad, encore) has to be in the declaration.
 *
 * Every other attack check asks "may this creature attack that defender?"
 * and is answered per pair by `eligibility.ts`, which also narrows *which*
 * defenders a goaded or encore creature may be sent at. Whether a required
 * attacker was left out can only be answered once the whole declaration is
 * known.
 *
 * **Checked against the offer, not the board**, as `blocking.ts` is: the
 * `declare-attackers` `LegalAction`'s `mustAttack` and `defendersFor` were
 * computed when attackers were asked for, so the engine's validator and the
 * client's Confirm button run the same check and can't disagree.
 */

import type { AttackerDeclaration, LegalAction } from "../actions.js";
import type { ObjectId } from "../primitives.js";

/** The `declare-attackers` offer, which is all these checks need. */
export type AttackOffer = Extract<LegalAction, { kind: "declare-attackers" }>;

/** `attacker` must attack if able, could have, and wasn't declared. */
export type AttackingViolation = { readonly kind: "must-attack"; readonly attacker: ObjectId };

/** Every rule of this kind `declared` breaks — all of them, so a client can
 * name every creature still to be sent somewhere. */
export function attackingViolations(
  declared: readonly AttackerDeclaration[],
  offer: AttackOffer,
): AttackingViolation[] {
  const attacking = new Set(declared.map((d) => d.attacker));
  return offer.mustAttack
    .filter((id) => !attacking.has(id))
    .map((attacker) => ({ kind: "must-attack", attacker }));
}

/**
 * `declared`, with every creature that must attack and was left out sent at
 * the first defender it may attack. For a driver that doesn't make the
 * choice itself — a bot, a test's scripted player, a seat skipping its own
 * decisions. The client asks the player instead.
 */
export function withRequiredAttackers(
  declared: readonly AttackerDeclaration[],
  offer: AttackOffer,
): AttackerDeclaration[] {
  const out = [...declared];
  for (const { attacker } of attackingViolations(declared, offer)) {
    const defender = offer.defendersFor[attacker]?.[0];
    if (defender !== undefined) out.push({ attacker, defender });
  }
  return out;
}
