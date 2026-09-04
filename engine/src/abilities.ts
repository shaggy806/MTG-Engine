/**
 * Abilities printed on a permanent.
 *
 * - Activated: `[cost]: [effect]`. A *mana ability* ({@link isManaAbility})
 *   produces mana, targets nothing, and resolves immediately without the stack.
 * - Triggered: "when/whenever/at ...". Detected after game events and put on the
 *   stack the next time a player would receive priority (rule 603).
 *
 * Costs and effects reuse the spell vocabulary.
 */

import type { EffectSpec, SpellResolver } from "./effects.js";
import type { GameEvent } from "./events.js";
import type { TargetSpec } from "./target.js";
import type { Step } from "./turn.js";

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
  readonly resolve: SpellResolver | null;
  readonly text: string;
  /** True for abilities like Equip that function only as a sorcery (rule 602.3). */
  readonly sorcerySpeed?: boolean;
}

/** Who the triggering object must be relative to the ability's source. */
export type TriggerWho = "self" | "you-control" | "any" | "you";

export type TriggerSpec =
  | { readonly on: "enters-battlefield"; readonly who: TriggerWho }
  | { readonly on: "dies"; readonly who: TriggerWho }
  | { readonly on: "attacks"; readonly who: TriggerWho }
  | { readonly on: "step-begins"; readonly step: Step; readonly who: TriggerWho }
  /** Escape hatch: match the raw event yourself. */
  | { readonly on: "predicate"; readonly match: (event: GameEvent) => boolean };

export interface TriggeredAbility {
  readonly trigger: TriggerSpec;
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
  readonly text: string;
}

/** The shape shared by both ability kinds once on the stack. */
export interface StackAbility {
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
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
