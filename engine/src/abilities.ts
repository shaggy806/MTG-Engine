/**
 * Activated abilities: `[cost]: [effect]` printed on a permanent.
 *
 * The cost and effect reuse the same vocabulary as spells. A *mana ability*
 * ({@link isManaAbility}) produces mana, targets nothing, and resolves
 * immediately without using the stack (rule 605).
 */

import type { EffectSpec, SpellResolver } from "./effects.js";
import type { TargetSpec } from "./target.js";

export interface AbilityCost {
  /** Mana portion of the cost, e.g. `"{2}"`; `null` for no mana. */
  readonly mana: string | null;
  /** Whether `{T}` (tap this permanent) is part of the cost. */
  readonly tap: boolean;
}

export interface ActivatedAbility {
  readonly cost: AbilityCost;
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  /** Imperative resolution (takes precedence over `effect`), or `null`. */
  readonly resolve: SpellResolver | null;
  readonly text: string;
}

/** A mana ability adds mana, has no targets, and never uses the stack. */
export function isManaAbility(ability: ActivatedAbility): boolean {
  return (
    ability.targets.length === 0 &&
    ability.resolve === null &&
    ability.effect !== null &&
    ability.effect.kind === "add-mana"
  );
}
