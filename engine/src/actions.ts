/**
 * Actions a player (or agent) submits to the engine via `Game.dispatch`.
 *
 * Every decision the rules ask a player for is one of these — including combat
 * declarations and the cleanup discard — so a UI, a bot, and a replay all drive
 * the engine through the same entry point.
 */

import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef, TargetSpec } from "./target.js";

export interface AttackerDeclaration {
  readonly attacker: ObjectId;
  readonly defender: PlayerId;
}

export interface BlockerDeclaration {
  readonly blocker: ObjectId;
  readonly attacker: ObjectId;
}

export type Action =
  | { readonly type: "pass-priority"; readonly player: PlayerId }
  | { readonly type: "play-land"; readonly player: PlayerId; readonly card: ObjectId }
  | {
      readonly type: "cast-spell";
      readonly player: PlayerId;
      readonly card: ObjectId;
      readonly targets?: readonly TargetRef[];
      /** The chosen value for `{X}` in the spell's mana cost. Required (and
       * only meaningful) when the card's cost contains `{X}`; ignored
       * otherwise. */
      readonly xValue?: number;
    }
  | {
      readonly type: "activate-ability";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly abilityIndex: number;
      readonly targets?: readonly TargetRef[];
      /** The permanent to sacrifice, when the ability's cost is a
       * `"creature-you-control"` sacrifice. Ignored for a `"self"` sacrifice
       * (the source is always what's sacrificed) or no sacrifice. */
      readonly sacrifice?: ObjectId;
    }
  | {
      readonly type: "declare-attackers";
      readonly player: PlayerId;
      readonly attackers: readonly AttackerDeclaration[];
    }
  | {
      readonly type: "declare-blockers";
      readonly player: PlayerId;
      readonly blocks: readonly BlockerDeclaration[];
    }
  | {
      readonly type: "order-blockers";
      readonly player: PlayerId;
      readonly attacker: ObjectId;
      /** The blockers of `attacker`, in damage-assignment order. */
      readonly order: readonly ObjectId[];
    }
  | {
      readonly type: "discard";
      readonly player: PlayerId;
      readonly cards: readonly ObjectId[];
    }
  | {
      /** Answers a pending "look at N cards, choose some" decision (e.g. look
       * at the top of your library, or search your graveyard). */
      readonly type: "choose-from-zone";
      readonly player: PlayerId;
      readonly chosen: readonly ObjectId[];
    }
  | {
      /** Answers a pending mulligan decision: keep the current hand, or
       * shuffle it back and draw a fresh one (the London mulligan). */
      readonly type: "mulligan";
      readonly player: PlayerId;
      readonly keep: boolean;
    }
  | {
      /** Answers a pending "put N cards on the bottom of your library"
       * decision after keeping a mulliganed hand. */
      readonly type: "put-on-bottom";
      readonly player: PlayerId;
      readonly cards: readonly ObjectId[];
    }
  | {
      /** Answers a pending commander-replacement decision (rule 903.9a):
       * move the commander to the command zone, or leave it where it went. */
      readonly type: "commander-replacement";
      readonly player: PlayerId;
      readonly toCommandZone: boolean;
    }
  | {
      /** Answers a pending "choose what this Clone copies" decision (rule 707).
       * `copy` is a permanent from the offered options, or `null` to copy
       * nothing. */
      readonly type: "choose-copy";
      readonly player: PlayerId;
      readonly copy: ObjectId | null;
    }
  | {
      /** Answers a pending text-change decision (Artificial Evolution — layer
       * 3): replace the creature-type word `from` with `to`. */
      readonly type: "choose-text";
      readonly player: PlayerId;
      readonly from: string;
      readonly to: string;
    }
  | {
      /** Answers a pending `choose-modes` decision (a modal spell/ability, or
       * a "you may" clause): the indices into the mode list to apply, distinct,
       * between the decision's `minModes` and `maxModes`. An empty array
       * declines an optional ("you may") mode. */
      readonly type: "choose-modes";
      readonly player: PlayerId;
      readonly modes: readonly number[];
    }
  | {
      /** Answers a pending `sacrifice` decision (a sacrifice effect — Diabolic
       * Edict): the permanents this player sacrifices. */
      readonly type: "sacrifice";
      readonly player: PlayerId;
      readonly permanents: readonly ObjectId[];
    }
  | {
      /** Answers a pending `scry` / `surveil` decision: the looked-at cards to
       * move away from the top — to the bottom of the library (scry) or the
       * graveyard (surveil). The rest stay on top in their current order. */
      readonly type: "scry";
      readonly player: PlayerId;
      readonly away: readonly ObjectId[];
    };

export type ActionType = Action["type"];

export const actionPlayer = (action: Action): PlayerId => action.player;

/**
 * A thing the player may legally do right now. `targetOptions[i]` lists every
 * legal target for target slot `i`, so a UI can highlight without guessing.
 */
export type LegalAction =
  | { readonly kind: "pass-priority" }
  | {
      readonly kind: "play-land";
      readonly card: ObjectId;
      readonly cardName: string;
    }
  | {
      readonly kind: "cast-spell";
      readonly card: ObjectId;
      readonly cardName: string;
      readonly targetSpecs: readonly TargetSpec[];
      readonly targetOptions: readonly (readonly TargetRef[])[];
      /** Set when the spell's cost contains `{X}`. `maxX` is the largest value
       * of X this player could currently pay for (0 when only X=0 is
       * affordable). A driver must include `xValue` in the `cast-spell`
       * action; anything from 0 to `maxX` is legal. */
      readonly xCost?: { readonly maxX: number };
    }
  | {
      readonly kind: "activate-ability";
      readonly source: ObjectId;
      readonly abilityIndex: number;
      readonly cardName: string;
      readonly text: string;
      readonly targetSpecs: readonly TargetSpec[];
      readonly targetOptions: readonly (readonly TargetRef[])[];
      /** Present when the cost includes sacrificing a creature you control:
       * `choices` is every permanent that could be sacrificed to pay it. A
       * `"self"` sacrifice is implicit (no field) — the source is always used. */
      readonly sacrifice?: { readonly choices: readonly ObjectId[] };
    }
  | {
      readonly kind: "declare-attackers";
      readonly eligible: readonly ObjectId[];
      /** Every legal opponent an attacker can be declared against. */
      readonly defenders: readonly PlayerId[];
    }
  | {
      readonly kind: "declare-blockers";
      readonly eligible: readonly {
        readonly blocker: ObjectId;
        readonly canBlock: readonly ObjectId[];
      }[];
      /** Attackers with menace: block them with 0 or 2+ creatures, never 1. */
      readonly menaceAttackers: readonly ObjectId[];
    }
  | {
      readonly kind: "order-blockers";
      readonly attacker: ObjectId;
      /** The blockers to order; the current order is the default. */
      readonly blockers: readonly ObjectId[];
    }
  | {
      readonly kind: "discard";
      readonly count: number;
      readonly from: readonly ObjectId[];
    }
  | {
      readonly kind: "choose-from-zone";
      /** Candidates, already revealed to this player. */
      readonly ids: readonly ObjectId[];
      /** The subset of `ids` that may actually be chosen (equal to `ids`
       * when the effect doesn't restrict the choice). */
      readonly eligible: readonly ObjectId[];
      readonly min: number;
      readonly max: number;
    }
  | {
      readonly kind: "mulligan";
      /** Mulligans already taken; this decision would be number `count + 1`. */
      readonly count: number;
    }
  | {
      readonly kind: "put-on-bottom";
      readonly count: number;
      readonly from: readonly ObjectId[];
    }
  | {
      readonly kind: "commander-replacement";
      readonly commander: ObjectId;
      /** Where the commander would go if left where the rules put it (before
       * the owner's 903.9a choice). */
      readonly intendedZone: "graveyard" | "exile" | "hand" | "library";
    }
  | {
      readonly kind: "choose-copy";
      readonly source: ObjectId;
      /** Permanents this Clone may copy; `null` (copy nothing) is also legal. */
      readonly options: readonly ObjectId[];
    }
  | {
      readonly kind: "choose-text";
      readonly source: ObjectId;
      readonly target: ObjectId;
      /** Creature-type words on the target — the one to replace. */
      readonly fromOptions: readonly string[];
      /** Creature types the replacement may be. */
      readonly toOptions: readonly string[];
    }
  | {
      readonly kind: "choose-modes";
      readonly source: ObjectId;
      readonly minModes: number;
      readonly maxModes: number;
      /** Rules text of each mode, in order — index into this is what the
       * `choose-modes` action submits. */
      readonly modeTexts: readonly string[];
    }
  | {
      readonly kind: "sacrifice";
      readonly count: number;
      /** Permanents this player controls that could be sacrificed. */
      readonly eligible: readonly ObjectId[];
    }
  | {
      readonly kind: "scry";
      readonly mode: "scry" | "surveil";
      /** The top cards of the library, in order — revealed to this player. */
      readonly cards: readonly ObjectId[];
    };
