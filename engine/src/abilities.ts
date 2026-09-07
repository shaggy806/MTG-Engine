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

/** A non-mana, non-tap component of an ability cost that sacrifices a permanent. */
export type SacrificeCost =
  /** Sacrifice the permanent whose ability this is. */
  | "self"
  /** Sacrifice a creature the activating player controls (their choice; may be
   * the source itself). */
  | "creature-you-control";

export interface AbilityCost {
  /** Mana portion of the cost, e.g. `"{2}"`; `null` for no mana. */
  readonly mana: string | null;
  /** Whether `{T}` (tap this permanent) is part of the cost. */
  readonly tap: boolean;
  /** A sacrifice that is part of the cost, or `undefined` for none. */
  readonly sacrifice?: SacrificeCost;
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
  | {
      /** A permanent left the battlefield — for any destination (graveyard,
       * exile, hand, library, command zone). Broader than `"dies"`, which
       * only fires for a move to a graveyard. Rule 603.6d / 700.4. */
      readonly on: "leaves-battlefield";
      readonly who: TriggerWho;
    }
  | { readonly on: "attacks"; readonly who: TriggerWho }
  | {
      /** This creature dealt combat damage to a player. The ability's first
       * target slot (if any) is auto-filled with that player. */
      readonly on: "deals-combat-damage-to-player";
      readonly who: TriggerWho;
    }
  | { readonly on: "step-begins"; readonly step: Step; readonly who: TriggerWho }
  | {
      /** A spell was cast. `who` is relative to the caster: `"you"` = this
       * permanent's controller cast it. `noncreatureOnly` narrows to a
       * noncreature spell (prowess, rule 702.108). */
      readonly on: "cast-spell";
      readonly who: TriggerWho;
      readonly noncreatureOnly?: boolean;
    }
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

/** A mana ability adds mana, has no targets, and never uses the stack. A cost
 * that includes a sacrifice disqualifies it (the engine's mana-source machinery
 * only knows how to pay a bare `{T}`). */
export function isManaAbility(ability: ActivatedAbility): boolean {
  return (
    ability.targets.length === 0 &&
    ability.cost.sacrifice === undefined &&
    ability.resolve === null &&
    ability.effect !== null &&
    ability.effect.kind === "add-mana"
  );
}
