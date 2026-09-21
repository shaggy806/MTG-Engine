/**
 * The two block-declaration rules that constrain a *set* of blocks rather
 * than any single one: menace (rule 702.111) and "must be blocked" (Lure,
 * rule 509.1c).
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
 * Returns *which* rule was broken and by whom rather than a message, because
 * the engine names creatures from its registry and the client from its view.
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
  | { readonly kind: "must-be-blocked"; readonly blocker: ObjectId };

/**
 * The first set-level rule `blocks` breaks against `offer`, or `null`.
 *
 * Menace is checked before Lure, which is the order the engine has always
 * used and therefore the order its messages come out in.
 */
export function blockingViolations(
  blocks: readonly BlockerDeclaration[],
  offer: BlockOffer,
): BlockingViolation | null {
  const perAttacker = new Map<ObjectId, number>();
  for (const { attacker } of blocks) {
    perAttacker.set(attacker, (perAttacker.get(attacker) ?? 0) + 1);
  }
  for (const [attacker, count] of perAttacker) {
    if (count === 1 && offer.menaceAttackers.includes(attacker)) {
      return { kind: "menace", attacker };
    }
  }

  // Lure: every creature able to block a must-be-blocked attacker has to be
  // blocking one of them. (A must-be-blocked attacker that also has menace
  // isn't forcing: a lone creature isn't "able" to block it, and that
  // combination is left unmodeled — which is why `mustBlock` excludes them.)
  if (offer.mustBlock.length > 0) {
    const blockingAMust = new Set(
      blocks.filter((b) => offer.mustBlock.includes(b.attacker)).map((b) => b.blocker),
    );
    for (const entry of offer.eligible) {
      if (blockingAMust.has(entry.blocker)) continue;
      if (entry.canBlock.some((a) => offer.mustBlock.includes(a))) {
        return { kind: "must-be-blocked", blocker: entry.blocker };
      }
    }
  }
  return null;
}
