/**
 * Actions a player (or agent) submits to the engine via `Game.dispatch`.
 *
 * Every decision the rules ask a player for is one of these — including combat
 * declarations and the cleanup discard — so a UI, a bot, and a replay all drive
 * the engine through the same entry point.
 */

import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef, TargetSpec } from "./target.js";

/** An alternative permission a spell can be cast under, from a zone other than
 * the hand and/or for a cost other than its mana cost (ROADMAP Phase 6):
 * `"flashback"` / `"escape"` cast an instant/sorcery from the graveyard,
 * `"foretell"` casts a card foretold (exiled face-down) on an earlier turn.
 * `"disturb"` casts a transforming DFC's back face from the graveyard (rule
 * 702.150 — ROADMAP Phase 10), `"adventure"` casts the creature half of an
 * adventure card that was exiled by its adventure resolving (rule 715).
 * `"suspend"` (last time counter came off) and `"cascade"` (revealed off the
 * top of the library — ROADMAP Phase 8) are the engine casting a card for
 * free; never dispatched by a player. */
export type CastVia =
  | "flashback"
  | "escape"
  | "foretell"
  | "disturb"
  | "adventure"
  | "suspend"
  | "cascade";

export interface AttackerDeclaration {
  readonly attacker: ObjectId;
  /** A player, or an opponent's planeswalker to attack (rule 508.1). */
  readonly defender: PlayerId | ObjectId;
}

export interface BlockerDeclaration {
  readonly blocker: ObjectId;
  readonly attacker: ObjectId;
}

export type Action =
  | { readonly type: "pass-priority"; readonly player: PlayerId }
  | {
      readonly type: "play-land";
      readonly player: PlayerId;
      readonly card: ObjectId;
      /** Which face of a multi-face card to play (rule 712 — ROADMAP Phase
       * 10). Index into `CardDefinition.faces`; `0` / omitted = the front. */
      readonly face?: number;
    }
  | {
      /** Suspend a card from hand (rule 702.62): a special action, pay the
       * suspend cost, exile it with N time counters. */
      readonly type: "suspend";
      readonly player: PlayerId;
      readonly card: ObjectId;
    }
  | {
      /** Foretell a card from hand (rule 702.144): a special action on your
       * turn, pay `{2}`, exile it face-down to be cast later for its foretell
       * cost. */
      readonly type: "foretell";
      readonly player: PlayerId;
      readonly card: ObjectId;
    }
  | {
      /** Cycle a card from hand (rule 702.29): pay its cycling cost, discard
       * it, draw a card. Any time you could cast an instant. */
      readonly type: "cycle";
      readonly player: PlayerId;
      readonly card: ObjectId;
    }
  | {
      readonly type: "cast-spell";
      readonly player: PlayerId;
      readonly card: ObjectId;
      readonly targets?: readonly TargetRef[];
      /** The modes chosen for a targeted modal spell (rule 700.2 — ROADMAP
       * Phase 11 EG-2): indices into `CardDefinition.castModal.modes`, distinct.
       * `targets` are then the concatenation of those modes' target slots, in
       * mode order. Required (and only meaningful) for a `castModal` card. */
      readonly modes?: readonly number[];
      /** The chosen value for `{X}` in the spell's mana cost. Required (and
       * only meaningful) when the card's cost contains `{X}`; ignored
       * otherwise. */
      readonly xValue?: number;
      /** Which face of a multi-face card to cast (rule 712 — ROADMAP Phase
       * 10). Index into `CardDefinition.faces`; `0` / omitted = the front. */
      readonly face?: number;
      /** Cast under an alternative permission rather than from the hand for the
       * printed cost (ROADMAP Phase 6): `"flashback"` / `"escape"` from the
       * graveyard, `"foretell"` from face-down exile. */
      readonly via?: CastVia;
      /** The permanent to sacrifice for a `CardDefinition.additionalCost`
       * sacrifice (rule 601.2f — Harrow, Crop Rotation). Required (and only
       * meaningful) when the card has one. needed-cards P8. */
      readonly sacrifice?: ObjectId;
      /** Pay the card's kicker cost (rule 702.33), announced as the spell is
       * cast and *before* targets are chosen — it can change the target specs.
       * Only meaningful for a card with `CardDefinition.kicker`. P8. */
      readonly kicked?: boolean;
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
      /** The chosen value for `{X}` in the ability's mana cost (ROADMAP Phase
       * 11 EG-3). Required (and only meaningful) when the cost contains `{X}`;
       * ignored otherwise. Folded into the generic portion when paid and
       * stamped on the ability object so `ctx.x` reads it. */
      readonly xValue?: number;
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
      /** Answers a pending shock-land decision (rule 614.13): `pay` = pay the
       * life to have it enter untapped, otherwise leave it tapped. */
      readonly type: "pay-life-for-untapped";
      readonly player: PlayerId;
      readonly pay: boolean;
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
      /** Answers a pending `choose-targets` decision (a triggered ability, or a
       * suspended spell — ROADMAP Phase 11 EG-1): one `TargetRef` per unfilled
       * target slot, in `awaiting.specs` order. */
      readonly type: "choose-targets";
      readonly player: PlayerId;
      readonly targets: readonly TargetRef[];
    }
  | {
      /** Answers a pending `assign-combat-damage` decision (rule 510.1c —
       * ROADMAP Phase 11 EG-4a): one amount per blocker in `awaiting.blockers`
       * order. `power − sum` (≥ 0, and 0 unless the attacker has trample) is
       * dealt to the defending player / planeswalker. */
      readonly type: "assign-combat-damage";
      readonly player: PlayerId;
      readonly assignment: readonly number[];
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
      /** Set when `card` is a multi-face card — the face this action plays.
       * The driver echoes it back in the `play-land` action. */
      readonly face?: number;
    }
  | {
      readonly kind: "suspend";
      readonly card: ObjectId;
      readonly cardName: string;
      /** Time counters it enters exile with, and the suspend cost. */
      readonly n: number;
      readonly cost: string;
    }
  | {
      readonly kind: "foretell";
      readonly card: ObjectId;
      readonly cardName: string;
    }
  | {
      readonly kind: "cycle";
      readonly card: ObjectId;
      readonly cardName: string;
      /** The cycling cost, e.g. `"{2}"`. */
      readonly cost: string;
    }
  | {
      readonly kind: "cast-spell";
      readonly card: ObjectId;
      readonly cardName: string;
      readonly targetSpecs: readonly TargetSpec[];
      readonly targetOptions: readonly (readonly TargetRef[])[];
      /** Set for a *targeted modal* spell (rule 700.2 — ROADMAP Phase 11 EG-2):
       * the driver picks `minModes..maxModes` of `modes` (each a text label +
       * its own target specs), then targets for the chosen modes, then echoes
       * `modes` + `targets` in the `cast-spell` action. `targetSpecs` /
       * `targetOptions` above are empty in this case. */
      readonly castModal?: {
        readonly minModes: number;
        readonly maxModes: number;
        readonly modes: readonly {
          readonly text: string;
          readonly targetSpecs: readonly TargetSpec[];
          /** Legal `TargetRef`s per slot of this mode, right now. A slot with an
           * empty list has no legal target — the mode can't be chosen. */
          readonly targetOptions: readonly (readonly TargetRef[])[];
        }[];
      };
      /** Set when the spell's cost contains `{X}`. `maxX` is the largest value
       * of X this player could currently pay for (0 when only X=0 is
       * affordable). A driver must include `xValue` in the `cast-spell`
       * action; anything from 0 to `maxX` is legal. */
      readonly xCost?: { readonly maxX: number };
      /** Present when this is an alternative-permission cast (not from the hand
       * for the printed cost — `"flashback"` / `"escape"` from the graveyard,
       * `"foretell"` from face-down exile). The driver must echo `via` back in
       * the `cast-spell` action. */
      readonly via?: CastVia;
      /** Set when `card` is a multi-face card — the face this action casts.
       * The driver echoes it back in the `cast-spell` action. */
      readonly face?: number;
      /** Present when casting this costs an additional sacrifice (rule 601.2f
       * — Harrow "sacrifice a land"): `choices` is every permanent that could
       * pay it. The driver picks one and echoes it as `sacrifice`. P8. */
      readonly sacrifice?: { readonly choices: readonly ObjectId[] };
      /** A kickable spell (rule 702.33) is enumerated **twice**, once unkicked
       * and once with `kicked: true` and the kicker cost folded in — the same
       * "one entry per playable variant" shape `via` / `face` already use, so a
       * driver just shows both. `targetSpecs` are the kicked ones when set.
       * The driver echoes `kicked` back in the `cast-spell` action. P8. */
      readonly kicked?: boolean;
      /** The kicker cost this variant pays, for labelling. Set with `kicked`. */
      readonly kickerCost?: string;
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
      /** Present for a planeswalker loyalty ability — the loyalty counters it
       * adds (negative = removes), so a UI can label it "+1" / "−3". */
      readonly loyalty?: number;
      /** Set when the ability's cost contains `{X}` (ROADMAP Phase 11 EG-3).
       * `maxX` is the largest value of X this player could currently pay for
       * (0 when only X=0 is affordable). The driver must include `xValue` in
       * the `activate-ability` action; anything from 0 to `maxX` is legal. */
      readonly xCost?: { readonly maxX: number };
    }
  | {
      readonly kind: "declare-attackers";
      readonly eligible: readonly ObjectId[];
      /** Every legal defender an attacker can be declared against — each
       * non-eliminated opponent, plus every planeswalker those opponents
       * control (a planeswalker's id, not a player id). */
      readonly defenders: readonly (PlayerId | ObjectId)[];
    }
  | {
      readonly kind: "declare-blockers";
      readonly eligible: readonly {
        readonly blocker: ObjectId;
        readonly canBlock: readonly ObjectId[];
      }[];
      /** Attackers with menace: block them with 0 or 2+ creatures, never 1. */
      readonly menaceAttackers: readonly ObjectId[];
      /** Attackers that must be blocked (Lure — rule 509.1c): every creature
       * this defender controls that's able to block one of these must block a
       * must-be-blocked attacker. Menace ones are excluded. */
      readonly mustBlock: readonly ObjectId[];
    }
  | {
      readonly kind: "order-blockers";
      readonly attacker: ObjectId;
      /** The blockers to order; the current order is the default. */
      readonly blockers: readonly ObjectId[];
    }
  | {
      /** A blocked attacker's controller assigns its combat damage (rule
       * 510.1c — ROADMAP Phase 11 EG-4a). Answer with one amount per blocker
       * in `blockers` order; `power − sum` (0 unless `trample`) tramples over
       * to the defender. `lethal[i]` is the minimum for `blockers[i]` before a
       * later blocker or the defender may be assigned any. */
      readonly kind: "assign-combat-damage";
      readonly attacker: ObjectId;
      readonly blockers: readonly ObjectId[];
      readonly power: number;
      readonly lethal: readonly number[];
      readonly trample: boolean;
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
      /** A shock land just entered tapped — pay `life` to untap it? (rule 614.13) */
      readonly kind: "pay-life-for-untapped";
      readonly source: ObjectId;
      readonly life: number;
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
    }
  | {
      /** A triggered ability / suspended spell needs targets — one per
       * `specs`/`options` slot (ROADMAP Phase 11 EG-1). */
      readonly kind: "choose-targets";
      readonly source: ObjectId;
      readonly cardName: string;
      readonly specs: readonly TargetSpec[];
      readonly options: readonly (readonly TargetRef[])[];
    };
