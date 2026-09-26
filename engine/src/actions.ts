/**
 * Actions a player (or agent) submits to the engine via `Game.dispatch`.
 *
 * Every decision the rules ask a player for is one of these — including combat
 * declarations and the cleanup discard — so a UI, a bot, and a replay all drive
 * the engine through the same entry point.
 */

import type { CardType } from "./cards/define.js";
import type { Color, ManaType } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef, TargetSpec } from "./target.js";
import type { TargetCountRange } from "./target-count.js";

/** One creature tapped to help pay a convoke cost (rule 702.51a): it pays
 * for `{1}` (`"generic"`) or one mana of one of its own colors — the
 * player's choice per creature, made as the spell is cast. Omit `pays` to
 * leave it to the engine: one of the cost's coloured pips the creature can
 * pay that's still unpaid, else a generic one. A compacted token stack can
 * be named once per token, up to its size. */
export interface ConvokePayment {
  readonly creature: ObjectId;
  readonly pays?: "generic" | Color;
}

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
  | "cascade"
  /** "Impulse draw" (Dream Pillager, Tectonic Giant, Theater of Horrors) — a
   * card exiled face-up with permission to play it, for its normal cost. */
  | "impulse"
  /** Cast from your graveyard for its normal cost, under a permission a
   * permanent you control grants (Gisa and Geralf: "you may cast a Zombie
   * creature spell from your graveyard"). Unlike flashback, nothing exiles
   * it afterwards — a countered one goes back to the graveyard. */
  | "graveyard-permission";

/**
 * Which permission a card is being played from a graveyard under, when more
 * than one could apply (Karador and Gisa and Geralf both offering the same
 * Zombie; Muldrotha offering an artifact creature as either type).
 *
 * `source` is the permanent whose `castFromGraveyard` static grants it, or
 * **the card itself** for a one-shot permission that lives on the card
 * (Silas Renn, Emry: "choose target artifact card in your graveyard. You may
 * cast that card this turn"). `asType` is the permanent type whose allowance
 * a per-type grant (Muldrotha) spends — the player's choice for a card with
 * several (rule: "if a card has multiple permanent types, choose one as you
 * play it").
 *
 * A `LegalAction` carries one per variant, and the driver echoes it back.
 * An action that omits it is played under the first permission that
 * applies — an unlimited one (Ramunap Excavator) before a limited one.
 */
export interface GraveyardGrant {
  readonly source: ObjectId;
  readonly asType?: CardType;
}

export interface AttackerDeclaration {
  readonly attacker: ObjectId;
  /** A player, or an opponent's planeswalker to attack (rule 508.1). */
  readonly defender: PlayerId | ObjectId;
}

export interface BlockerDeclaration {
  readonly blocker: ObjectId;
  readonly attacker: ObjectId;
}

/**
 * A "tap N untapped … you control" cost's offer (an ability's
 * `AbilityCost.tapOthers`, or Sephara's alternative cost): the driver taps
 * exactly `count` of `choices` and echoes them back as the action's `tap`.
 *
 * A compacted token stack is one id here, and naming it *n* times taps *n* of
 * its tokens; `copies` says how many it has, and lists only stacks, so it's
 * absent on an ordinary board — the same shape as the `sacrifice` decision's.
 *
 * `choices` leaves out any permanent the mana half of the same cost has to
 * tap: one creature can't pay both, since it's no longer untapped. Any
 * `count` of what's left can be tapped with the mana still payable.
 */
export interface TapCostOffer {
  readonly count: number;
  readonly choices: readonly ObjectId[];
  readonly copies?: Readonly<Record<ObjectId, number>>;
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
      /** The graveyard permission this land is played under — see
       * {@link GraveyardGrant}. */
      readonly graveyardGrant?: GraveyardGrant;
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
      readonly targets?: ChosenTargets;
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
      /** Cast for the card's overload cost (rule 702.126) instead of its mana
       * cost — replaces "target" with "each" and takes no targets. Only
       * meaningful for a card with `CardDefinition.overload`. */
      readonly overload?: boolean;
      /** Cast for free under `CardDefinition.freeCastIf`'s permission (Fierce
       * Guardianship: "if you control a commander, you may cast this spell
       * without paying its mana cost") instead of paying the mana cost.
       * Targets are unchanged — only the cost differs. */
      readonly free?: boolean;
      /** Casting for `CardDefinition.alternativeCost` (Sephara) — a second
       * variant, like `free`, whose mana cost is replaced and which taps
       * creatures as part of the cost. The driver echoes it back. */
      readonly altCost?: boolean;
      /** Which branch of a choice of additional costs is being paid — an
       * index into `CardDefinition.additionalCost.options` (Bitter Triumph:
       * 0 to discard, 1 to pay 3 life). Echoed back from the `LegalAction`
       * variant the driver picked; required when the card has options. */
      readonly costOption?: number;
      /** Creatures tapped to help pay a convoke cost (rule 702.51), each
       * with its chosen contribution. Only meaningful for a card with
       * `CardDefinition.convoke`. */
      readonly convoke?: readonly ConvokePayment[];
      /** What an `altCost` cast taps (Sephara's "tap four untapped creatures
       * you control with flying"), picked from the variant's `tapCost` offer.
       * Omitted, the engine picks for a driver that doesn't choose. */
      readonly tap?: readonly ObjectId[];
      /** For `via: "escape"`: the other cards in the caster's graveyard
       * exiled to pay the escape cost (rule 702.139a — "exile N other cards
       * from your graveyard"), picked from the variant's `escapeExile` offer:
       * exactly `count` distinct cards, never the escaping card itself.
       * Omitted, the engine picks the oldest, for a driver that doesn't
       * choose. */
      readonly escapeExile?: readonly ObjectId[];
      /** For `via: "graveyard-permission"`: which permission pays for it —
       * see {@link GraveyardGrant}. Echoed back from the variant. */
      readonly graveyardGrant?: GraveyardGrant;
    }
  | {
      readonly type: "activate-ability";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly abilityIndex: number;
      readonly targets?: ChosenTargets;
      /** The permanent to sacrifice, when the ability's cost is a
       * `"creature-you-control"` sacrifice. Ignored for a `"self"` sacrifice
       * (the source is always what's sacrificed) or no sacrifice. */
      readonly sacrifice?: ObjectId;
      /** What the cost's "tap N untapped … you control" taps
       * (`AbilityCost.tapOthers` — Gravespawn Sovereign's five Zombies),
       * picked from the offer's `tapCost`. Omitted, the engine picks for a
       * driver that doesn't choose. */
      readonly tap?: readonly ObjectId[];
      /** The chosen value for `{X}` in the ability's mana cost (ROADMAP Phase
       * 11 EG-3). Required (and only meaningful) when the cost contains `{X}`;
       * ignored otherwise. Folded into the generic portion when paid and
       * stamped on the ability object so `ctx.x` reads it. */
      readonly xValue?: number;
      /** The colour(s) chosen for a mana ability that produces "one mana of
       * any color" / "N mana in any combination of …" — one entry per mana
       * produced. Only meaningful when activating such an ability on its own;
       * a mana ability activated *to pay a cost* is planned by the engine and
       * never carries this. Omitting it keeps the old fixed default (white, or
       * the first listed colour). */
      readonly manaColors?: readonly ManaType[];
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
      /** Answers a pending commander-replacement decision (rule 903.9): put
       * the commander into the command zone, or leave it in the graveyard or
       * exile it's in (903.9a) / let it go to the hand or library it's headed
       * for (903.9b). */
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
      /** Answers a pending legend-rule decision (rule 704.5j): the one of the
       * offered legendary permanents to keep. */
      readonly type: "legend-rule";
      readonly player: PlayerId;
      readonly keep: ObjectId;
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
      /** Answers a pending "as this enters, choose a creature type" decision
       * (Urza's Incubator — needed-cards P14). `creatureType` must be one of
       * the offered options. */
      readonly type: "choose-creature-type";
      readonly player: PlayerId;
      readonly creatureType: string;
    }
  | {
      /** Answers a pending `choose-modes` decision (a modal spell/ability, or
       * a "you may" clause): the indices into the mode list to apply, distinct,
       * between the decision's `minModes` and `maxModes`. An empty array
       * declines an optional ("you may") mode. */
      readonly type: "choose-modes";
      readonly player: PlayerId;
      readonly modes: readonly number[];
      /** The value chosen for `{X}` when the decision's own cost contains one
       * — Flameblast Dragon's "you may pay {X}{R}". Ignored otherwise. */
      readonly xValue?: number;
    }
  | {
      /** Answers a pending `choose-targets` decision (a triggered ability, or a
       * suspended spell — ROADMAP Phase 11 EG-1): one `TargetRef` per unfilled
       * target slot, in `awaiting.specs` order. */
      readonly type: "choose-targets";
      readonly player: PlayerId;
      readonly targets: ChosenTargets;
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
      /** Answers a pending `proliferate` decision (rule 701.27): the
       * permanents and/or players to give another counter of each kind they
       * already have. Any subset of `awaiting.eligible`, **including the
       * empty one** — "any number" includes none. */
      readonly type: "proliferate";
      readonly player: PlayerId;
      readonly chosen: readonly TargetRef[];
    }
  | {
      /** Answers a pending `scry` / `surveil` decision: the looked-at cards to
       * move away from the top — to the bottom of the library (scry) or the
       * graveyard (surveil). The rest stay on top in their current order. */
      readonly type: "scry";
      readonly player: PlayerId;
      readonly away: readonly ObjectId[];
    };

/** A `cast-spell` offer's convoke part — see `LegalAction`. */
export type ConvokeOffer = NonNullable<Extract<LegalAction, { kind: "cast-spell" }>["convoke"]>;

/**
 * A convoke payment `offer` proves works when the spell is cast with
 * `xValue` as its X: `proof` for a spell without `{X}`, else
 * `xProof.payments` with the generic entries a smaller X doesn't need
 * dropped from the end. What's left is still enough: every generic dropped
 * is one the cost no longer has, and with fewer creatures tapped the mana
 * can pay whatever remains as well as it could before.
 */
export function convokeProofFor(offer: ConvokeOffer, xValue = 0): ConvokePayment[] {
  const x = offer.xProof;
  if (x === undefined) return [...offer.proof];
  let drop = Math.max(0, x.atX - Math.max(0, Math.floor(xValue))) * x.genericPerX;
  const out: ConvokePayment[] = [];
  for (let i = x.payments.length - 1; i >= 0; i -= 1) {
    const p = x.payments[i];
    if (p.pays === "generic" && drop > 0) {
      drop -= 1;
      continue;
    }
    out.push(p);
  }
  return out.reverse();
}

export const actionPlayer = (action: Action): PlayerId => action.player;

/**
 * A thing the player may legally do right now. `targetOptions[i]` lists every
 * legal target for target slot `i`, so a UI can highlight without guessing.
 */
/**
 * Chosen targets, one entry per declared slot. `null` marks an **optional**
 * slot the player chose to leave empty (`TargetSpec` `{ kind: "optional" }` —
 * "up to one target creature"); the engine turns it into a hole so an effect
 * reading `ctx.targets[i]` sees `undefined`, which every effect already
 * checks for. A `null` in a non-optional slot is rejected.
 */
export type ChosenTargets = readonly (TargetRef | null)[];

export type LegalAction =
  | { readonly kind: "pass-priority" }
  | {
      readonly kind: "play-land";
      readonly card: ObjectId;
      readonly cardName: string;
      /** Set when `card` is a multi-face card — the face this action plays.
       * The driver echoes it back in the `play-land` action. */
      readonly face?: number;
      /** Set when the land is played from a graveyard under a limited
       * permission (Muldrotha's land allowance) — one variant per permission
       * that applies. The driver echoes it back. */
      readonly graveyardGrant?: GraveyardGrant;
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
      /** Set when what the spell costs depends on how many targets it has — a
       * "for each target" cost modification reaches it (Hinata,
       * Dawn-Crowned). The spell is affordable only with a number of
       * *distinct* targets (players and objects, each counted once however
       * many slots name it — bar a token stack, which is a target per slot
       * up to its size, `copies`) from `min` to `max`; a driver has to choose
       * targets inside that range (`fitTargetCount`), or the cast is
       * refused. `xCost.maxX` holds anywhere in the range. */
      readonly targetCount?: TargetCountRange;
      /** Present when this is an alternative-permission cast (not from the hand
       * for the printed cost — `"flashback"` / `"escape"` from the graveyard,
       * `"foretell"` from face-down exile). The driver must echo `via` back in
       * the `cast-spell` action. */
      readonly via?: CastVia;
      /** For `via: "graveyard-permission"`: the permission this variant is
       * cast under. A card castable under several (two grantors, or one
       * multi-typed card under Muldrotha) is enumerated once per permission.
       * The driver echoes it back. See {@link GraveyardGrant}. */
      readonly graveyardGrant?: GraveyardGrant;
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
      /** An overloadable spell (rule 702.126) is enumerated **twice**, once
       * normal and once with `overload: true` — this variant's `targetSpecs`
       * is always `[]` (you can't choose targets for an overloaded spell).
       * The driver echoes `overload` back in the `cast-spell` action. */
      readonly overload?: boolean;
      /** The overload cost this variant pays (replaces the mana cost
       * entirely), for labelling. Set with `overload`. */
      readonly overloadCost?: string;
      /** A conditional free-cast permission (`CardDefinition.freeCastIf`) is
       * enumerated **twice** when its condition is currently met — once
       * paying the printed cost, once free — the same "one entry per
       * playable variant" shape as `kicked`/`overload`. `targetSpecs` are
       * unchanged (only the cost differs). The driver echoes `free` back in
       * the `cast-spell` action. */
      readonly free?: boolean;
      /** Casting for `CardDefinition.alternativeCost` (Sephara) — a second
       * variant, like `free`, whose mana cost is replaced and which taps
       * creatures as part of the cost. The driver echoes it back. */
      readonly altCost?: boolean;
      /** What the `altCost` variant may tap, and how many — see
       * {@link TapCostOffer}. */
      readonly tapCost?: TapCostOffer;
      /** Set on a `via: "escape"` variant: the escape cost exiles `count`
       * other cards from the caster's graveyard, and `choices` is every one
       * that could pay it, in graveyard order (oldest first). The driver
       * picks `count` of them and sends them as the action's `escapeExile`. */
      readonly escapeExile?: {
        readonly count: number;
        readonly choices: readonly ObjectId[];
      };
      /** One branch of a choice of additional costs (Bitter Triumph's
       * "discard a card or pay 3 life"). The card is enumerated once per
       * affordable branch, the way a kickable spell is enumerated kicked and
       * unkicked, so the choice is made by picking a variant rather than by
       * answering a decision mid-cast. `costOptionText` is that branch's
       * label, for the button. */
      readonly costOption?: number;
      readonly costOptionText?: string;
      /** A convokable spell (rule 702.51): every untapped creature the
       * player controls is a legal convoke payer. The driver builds a
       * `ConvokePayment[]` (which candidates, and what each pays) and echoes
       * it back as `convoke` in the `cast-spell` action; `[]` or omitted
       * pays the ordinary mana cost in full. `maxGeneric` is the cost's
       * generic amount — an upper bound on how many candidates can validly
       * all pay `"generic"` at once (a driver that doesn't want to reason
       * about colors can always pick any subset of candidates up to this
       * many and have every one pay `"generic"`; paying a specific color
       * instead needs no such cap beyond that color's own pip count, which
       * isn't echoed here — a driver that wants to pay colors reads them
       * off `PlayerView`). Simplest of all is to name the creatures and omit
       * `pays`: the engine then puts each where it helps most. */
      readonly convoke?: {
        readonly candidates: readonly ObjectId[];
        readonly maxGeneric: number;
        /**
         * A payment that is known to work: the greedy allocation
         * `legalActions` itself used to decide this spell is castable at all.
         *
         * This matters because a convoke-only-affordable spell is offered on
         * the strength of that allocation, and it may pay *coloured* pips
         * with matching creatures. A driver that taps the same creatures but
         * has them all pay `"generic"` can therefore still fail to cover the
         * cost — which is correct rules behaviour, and used to crash the
         * fuzzer. A driver with no opinion should echo this back verbatim.
         */
        readonly proof: readonly ConvokePayment[];
        /** Whether the spell can be paid for with mana alone. When it can't,
         * convoking isn't optional, and `proof` is a set that works. */
        readonly manaAffordable: boolean;
        /** The most creatures that can help pay — every generic and
         * coloured pip in the cost, at the largest X offered (`xCost.maxX`)
         * when it has one. Each pays one; past that, a creature has nothing
         * left to pay. */
        readonly maxCreatures: number;
        /**
         * For a spell with `{X}` in its cost: `payments` is known to work
         * with X at `atX` (the offer's `xCost.maxX`), which may be
         * affordable only by convoking for X (Chord of Calling) — `proof`
         * is sized for X=0 and pays nothing towards X. Each unit less of X
         * is `genericPerX` fewer generic to pay (two for `{X}{X}`), so for a
         * smaller X drop that many generic entries per unit —
         * {@link convokeProofFor} does this. Absent when the cost has no
         * `{X}`.
         */
        readonly xProof?: {
          readonly atX: number;
          readonly genericPerX: number;
          readonly payments: readonly ConvokePayment[];
        };
        /** How many tokens each compacted stack among `candidates` has —
         * a stack is named once per token convoking. Only stacks appear, so
         * this is absent on an ordinary board. */
        readonly copies?: Readonly<Record<ObjectId, number>>;
      };
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
      /** Present when the cost taps other permanents ("Tap five untapped
       * Zombies you control") — see {@link TapCostOffer}. */
      readonly tapCost?: TapCostOffer;
      /** Present for a planeswalker loyalty ability — the loyalty counters it
       * adds (negative = removes), so a UI can label it "+1" / "−3". */
      readonly loyalty?: number;
      /** Set when this is a mana ability (rule 605.1a), printed or granted —
       * Citanul Hierophants' "{T}: Add {G}" on every creature included, which
       * a lookup of the source's printed abilities can't see. */
      readonly manaAbility?: true;
      /** The mana this variant of an "any color" / "any combination" mana
       * ability would produce — see the `activate-ability` action's
       * `manaColors`. Such an ability is enumerated once per choice, so a
       * client can offer them as separate menu entries; absent for an ability
       * whose output is fixed. */
      readonly manaColors?: readonly ManaType[];
      /** Set when the ability's cost contains `{X}` (ROADMAP Phase 11 EG-3).
       * `maxX` is the largest value of X this player could currently pay for
       * (0 when only X=0 is affordable). The driver must include `xValue` in
       * the `activate-ability` action; anything from `minX` (0 when absent)
       * to `maxX` is legal.
       *
       * An ability whose target filter reads X (Rydia, Summoner of Mist's
       * "target Saga card with mana value X") is enumerated once per X that
       * has a legal set of targets, with `minX` = `maxX` = that X and
       * `targetOptions` for it. */
      readonly xCost?: { readonly maxX: number; readonly minX?: number };
    }
  | {
      readonly kind: "declare-attackers";
      readonly eligible: readonly ObjectId[];
      /** The union of every attacker's legal defenders — each non-eliminated
       * opponent, plus every planeswalker those opponents control (a
       * planeswalker's id, not a player id). Enough to decide who can be
       * attacked *at all*; use `defendersFor` to build a real declaration. */
      readonly defenders: readonly (PlayerId | ObjectId)[];
      /**
       * Legal defenders **per attacker**, keyed by attacker id.
       *
       * Not every eligible attacker may be sent at every defender: a goaded
       * creature has to attack someone other than its goader when it can
       * (rule 701.38b). `defenders` alone can't say that, and a caller that
       * picks from it uniformly — the fuzzer, or a UI letting you drag an
       * attacker onto any player — builds declarations `dispatch` rejects.
       */
      readonly defendersFor: Readonly<
        Record<ObjectId, readonly (PlayerId | ObjectId)[]>
      >;
      /**
       * The eligible attackers that must attack if able (rule 508.1d —
       * "attacks each combat if able", goad, encore). A declaration has to
       * include every one of them, each at one of its `defendersFor`; which
       * one is the player's choice. `combat/attacking.ts` checks it.
       */
      readonly mustAttack: readonly ObjectId[];
    }
  | {
      readonly kind: "declare-blockers";
      readonly eligible: readonly {
        readonly blocker: ObjectId;
        readonly canBlock: readonly ObjectId[];
        /** How many creatures this entry is: a compacted token stack blocks
         * as every token in it (it's woken up into that many on
         * declaration). Absent for an ordinary one-creature permanent. */
        readonly copies?: number;
      }[];
      /** Attackers with menace: block them with 0 or 2+ creatures, never 1. */
      readonly menaceAttackers: readonly ObjectId[];
      /** Attackers that must be blocked (Lure — rule 509.1c): as many of this
       * defender's creatures as can be must block one of these. With no menace
       * among them, that's every creature able to block one; one with menace
       * forces blocks only in pairs. `combat/blocking.ts`'s `lurePlan` works
       * out how many. */
      readonly mustBlock: readonly ObjectId[];
      /** Attackers that must be blocked **if able** (Anzrag, the
       * Quake-Mole): each has to be blocked by at least one creature (two,
       * with menace) whenever this defender's creatures not needed for
       * `mustBlock` can manage it — `combat/blocking.ts`'s `ifAblePlan`
       * works out how many of them can be at once. Absent when there are
       * none. */
      readonly mustBeBlockedIfAble?: readonly ObjectId[];
    }
  | {
      /** A blocked attacker's controller assigns its combat damage (rule
       * 510.1c — ROADMAP Phase 11 EG-4a). Answer with one amount per blocker
       * in `blockers` order; `power − sum` (0 unless `trample`) tramples over
       * to the defender. `lethal[i]` is lethal damage to `blockers[i]`: any
       * division is legal, but every blocker needs its lethal before any
       * damage tramples over (702.19b). `indestructible[i]` says lethal damage
       * won't destroy it. */
      readonly kind: "assign-combat-damage";
      readonly attacker: ObjectId;
      readonly blockers: readonly ObjectId[];
      /** How much combat damage the attacker assigns: its power, or its
       * toughness under a `combatDamageByToughness` static (Doran, the
       * Siege Tower). */
      readonly power: number;
      readonly lethal: readonly number[];
      readonly trample: boolean;
      readonly indestructible: readonly boolean[];
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
      /** Where the commander stays if the offer is declined — the graveyard
       * or exile it's already in (rule 903.9a) — or goes: the hand or library
       * it hasn't been put into yet (903.9b). */
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
      /** The legend rule: keep one of `options` — legendary permanents you
       * control named `name`, the one you've controlled longest first. */
      readonly kind: "legend-rule";
      readonly name: string;
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
      readonly kind: "choose-creature-type";
      readonly source: ObjectId;
      readonly options: readonly string[];
      /** `options` is the full creature-type catalog (a search picker), not a
       * short fixed menu (buttons). See `AwaitingDecision`. */
      readonly catalog: boolean;
      /**
       * The creature types most represented among the chooser's own cards
       * (hand, library, graveyard, command zone) and everything on the
       * battlefield, most common first. Empty for a non-catalog menu.
       *
       * Only ever computed here, in `legalActions` for the deciding player:
       * it reads their library, so putting it on shared game state would
       * tell opponents what's in their deck.
       */
      readonly suggested: readonly string[];
    }
  | {
      readonly kind: "choose-modes";
      readonly source: ObjectId;
      readonly minModes: number;
      readonly maxModes: number;
      /** Present when the decision's cost contains `{X}` (Flameblast
       * Dragon): the largest X the chooser could pay for right now. The
       * driver echoes its pick back as `xValue`. */
      readonly xCost?: { readonly maxX: number };
      /** Rules text of each mode, in order — index into this is what the
       * `choose-modes` action submits. */
      readonly modeTexts: readonly string[];
      /** A ward payment (rule 702.21a): mode 0 pays the ward cost of
       * `source`, and choosing none lets `spell` — the chooser's own spell or
       * ability that targeted it — be countered. */
      readonly ward?: { readonly spell: ObjectId };
    }
  | {
      readonly kind: "sacrifice";
      readonly count: number;
      /** Permanents this player controls that could be sacrificed. */
      readonly eligible: readonly ObjectId[];
      /**
       * How many permanents an entry stands for, where that is more than one:
       * a compacted token stack is a single id here, and naming it *n* times
       * in the answer sacrifices *n* of its tokens (the engine peels one off
       * per occurrence). Only stacks appear, so this is absent on an ordinary
       * board.
       *
       * Without it, "sacrifice three" with nine Goblins compacted into one
       * stack offered one entry against a count of three and **no answer was
       * accepted at all** — the game stalled there.
       */
      readonly copies?: Readonly<Record<ObjectId, number>>;
    }
  | {
      /** Proliferate (rule 701.27) — choose any number of `eligible`,
       * including none. No `count`: that is the point of the card. */
      readonly kind: "proliferate";
      readonly eligible: readonly TargetRef[];
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
