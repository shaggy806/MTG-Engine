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

import type { StaticCondition } from "./cards/define.js";
import type { EffectSpec, SpellResolver } from "./effects.js";
import type { GameEvent } from "./events.js";
import type { CardFilter } from "./filter.js";
import type { TargetSpec } from "./target.js";
import type { Step } from "./turn.js";

/** A non-mana, non-tap component of an ability cost that sacrifices a permanent. */
export type SacrificeCost =
  /** Sacrifice the permanent whose ability this is. */
  | "self"
  /** Sacrifice a creature the activating player controls (their choice; may be
   * the source itself). */
  | "creature-you-control"
  /** Sacrifice a permanent the activating player controls matching `filter`
   * (their choice — Zuran Orb "Sacrifice a land", Orcish Lumberjack "Sacrifice
   * a Forest"). needed-cards P6. */
  | { readonly filter: CardFilter };

export interface AbilityCost {
  /** Mana portion of the cost, e.g. `"{2}"`; `null` for no mana. */
  readonly mana: string | null;
  /** Whether `{T}` (tap this permanent) is part of the cost. */
  readonly tap: boolean;
  /** A sacrifice that is part of the cost, or `undefined` for none. */
  readonly sacrifice?: SacrificeCost;
  /** Life to pay as part of the cost (Greed: "Pay 2 life"). Rule 118.4 — a
   * player can't pay more life than they have. */
  readonly payLife?: number;
  /** Counters to remove from the source as part of the cost (Walking
   * Ballista: "Remove a +1/+1 counter from ~"). */
  readonly removeCounter?: { readonly kind: string; readonly count: number };
  /** Energy counters to pay ({E} — rule 122 / ROADMAP Phase 10; automatic,
   * like `payLife`). */
  readonly payEnergy?: number;
}

export interface ActivatedAbility {
  readonly cost: AbilityCost;
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
  readonly text: string;
  /** True for abilities like Equip that function only as a sorcery (rule 602.3). */
  readonly sorcerySpeed?: boolean;
  /**
   * A loyalty ability (rule 606) — present ⇒ this ability's cost is "add
   * `loyaltyCost` loyalty counters to the source" (negative removes them),
   * it functions only as a sorcery, and only one loyalty ability of a given
   * permanent may be activated each turn. `cost.mana` / `cost.tap` are
   * ignored; a loyalty ability with a target is fine ("+1: Untap two target
   * lands"). Uses the stack like any other activated ability.
   */
  readonly loyaltyCost?: number;
  /** "…another target X" (Manifold Key: "Untap another target artifact") —
   * the source permanent itself is excluded from every target slot's legal
   * options. Without it a self-untap-style ability can target itself and
   * become a repeatable no-net-cost loop the fuzzer's tick budget catches;
   * mirrors `TriggerSpec.otherOnly`. needed-cards P17. */
  readonly otherOnly?: boolean;
}

/** Who the triggering object must be relative to the ability's source. */
export type TriggerWho = "self" | "you-control" | "any" | "you";

export type TriggerSpec =
  | {
      readonly on: "enters-battlefield";
      readonly who: TriggerWho;
      /** Narrow which entering permanent counts (Soul Warden: a creature;
       * landfall: a land). */
      readonly filter?: CardFilter;
      /** "another …" — the source permanent entering doesn't count. */
      readonly otherOnly?: boolean;
    }
  | {
      readonly on: "dies";
      readonly who: TriggerWho;
      readonly filter?: CardFilter;
      readonly otherOnly?: boolean;
    }
  | {
      /** A permanent left the battlefield — for any destination (graveyard,
       * exile, hand, library, command zone). Broader than `"dies"`, which
       * only fires for a move to a graveyard. Rule 603.6d / 700.4. */
      readonly on: "leaves-battlefield";
      readonly who: TriggerWho;
    }
  | {
      /** A player gained life (Ajani's Pridemate). `who` is whose life. */
      readonly on: "gains-life";
      readonly who: TriggerWho;
    }
  | {
      /** A player lost life. `who` is whose life. */
      readonly on: "loses-life";
      readonly who: TriggerWho;
    }
  | {
      readonly on: "attacks";
      readonly who: TriggerWho;
      /** Narrow which attacker counts (Utvara Hellkite / Atarka, World
       * Render: "a Dragon you control"). needed-cards P11. */
      readonly filter?: CardFilter;
    }
  | {
      /** Exalted (rule 702.111a — needed-cards P15): a creature you control
       * attacked alone this combat — exactly one attacker was declared.
       * `who: "you-control"` = the lone attacker is yours. The attacker isn't
       * a target; an effect reads it via `ResolutionContext.triggerObject`
       * (a `modify-pt` with `target: "trigger-object"`). */
      readonly on: "attacks-alone";
      readonly who: TriggerWho;
    }
  | {
      /** A player sacrificed a permanent (Korvold, Mayhem Devil — rule 701.19).
       * `who` is relative to the sacrificing player: `"you"` = this permanent's
       * controller sacrificed one, `"any"` = anyone did. needed-cards P6. */
      readonly on: "sacrifice";
      readonly who: TriggerWho;
    }
  | {
      /** A permanent turned over to its other face (rule 712.10 — ROADMAP
       * Phase 10b). `who: "self"` = this permanent transformed; `"you-control"`
       * = one you control did. `intoFront` narrows to a transform *into* the
       * front (`true`) or back (`false`) face. */
      readonly on: "transforms";
      readonly who: TriggerWho;
      readonly intoFront?: boolean;
      readonly filter?: CardFilter;
    }
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
       * noncreature spell (prowess, rule 702.108). `firstEachTurn` narrows to
       * the caster's first spell of the turn. */
      readonly on: "cast-spell";
      readonly who: TriggerWho;
      readonly noncreatureOnly?: boolean;
      readonly firstEachTurn?: boolean;
    }
  | {
      /** *This* spell (the one carrying the ability) was cast — a triggered
       * ability that lives on the card on the stack, not a permanent (cascade,
       * storm — rules 702.85 / 702.40). ROADMAP Phase 8. */
      readonly on: "this-cast";
    }
  /** Escape hatch: match the raw event yourself. */
  | { readonly on: "predicate"; readonly match: (event: GameEvent) => boolean };

export interface TriggeredAbility {
  readonly trigger: TriggerSpec;
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
  /**
   * An *intervening-if* clause (rule 603.4) — "When ~ enters, **if** you
   * control a creature with power 4 or greater, draw a card". The condition is
   * checked twice: as the trigger event happens (a false condition means the
   * ability never triggers at all) and again as the ability resolves (a
   * condition that has since become false removes it from the stack with no
   * effect). Evaluated from the source's controller's perspective, counting
   * the source itself. needed-cards P7.
   */
  readonly condition?: StaticCondition;
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
    // A loyalty ability uses the stack even if it adds mana (rule 606.3).
    ability.loyaltyCost === undefined &&
    ability.targets.length === 0 &&
    // A "Sacrifice this: Add …" mana ability (Treasure) is fine — the payment
    // machinery handles a self-sacrifice. A "sacrifice a creature you
    // control" cost isn't (it needs a choice).
    (ability.cost.sacrifice === undefined || ability.cost.sacrifice === "self") &&
    // A `Pay N life` cost is fine — a mana ability may cost life (rule 605.1a
    // says nothing about costs; the trikelands, City of Brass-likes). It's
    // auto-paid, same as a Phyrexian pip.
    ability.cost.removeCounter === undefined &&
    ability.cost.payEnergy === undefined &&
    ability.resolve === null &&
    ability.effect !== null &&
    ability.effect.kind === "add-mana"
  );
}
