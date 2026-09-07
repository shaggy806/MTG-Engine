/**
 * The event log. Every observable change to game state emits an event; the
 * ordered log is the engine's audit trail and the basis for future replay and
 * networking.
 */

import type { ManaType } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef } from "./target.js";
import type { Phase, Step } from "./turn.js";

interface Base {
  /** Monotonic sequence number, assigned when the event is appended. */
  readonly seq: number;
}

export type GameEvent =
  | (Base & {
      readonly type: "game-started";
      readonly players: readonly PlayerId[];
      readonly startingPlayer: PlayerId;
      readonly seed: number;
    })
  | (Base & {
      readonly type: "turn-began";
      readonly turn: number;
      readonly activePlayer: PlayerId;
    })
  | (Base & {
      readonly type: "step-began";
      readonly step: Step;
      readonly phase: Phase;
    })
  | (Base & { readonly type: "priority-received"; readonly player: PlayerId })
  | (Base & { readonly type: "priority-passed"; readonly player: PlayerId })
  | (Base & { readonly type: "permanent-untapped"; readonly object: ObjectId })
  | (Base & {
      readonly type: "card-drawn";
      readonly player: PlayerId;
      readonly object: ObjectId;
    })
  | (Base & {
      readonly type: "draw-from-empty-library";
      readonly player: PlayerId;
    })
  | (Base & {
      readonly type: "cards-discarded";
      readonly player: PlayerId;
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      readonly type: "cards-chosen-from-zone";
      readonly player: PlayerId;
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      /** A player shuffled their library (after a search / tutor). */
      readonly type: "library-shuffled";
      readonly player: PlayerId;
    })
  | (Base & {
      /** A scry / surveil resolved: `looked` cards seen, `movedAway` put on
       * the bottom (scry) or into the graveyard (surveil). */
      readonly type: "scried";
      readonly player: PlayerId;
      readonly mode: "scry" | "surveil";
      readonly looked: number;
      readonly movedAway: number;
    })
  | (Base & {
      readonly type: "damage-cleared";
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      readonly type: "land-played";
      readonly player: PlayerId;
      readonly object: ObjectId;
    })
  | (Base & { readonly type: "permanent-tapped"; readonly object: ObjectId })
  | (Base & {
      readonly type: "mana-added";
      readonly player: PlayerId;
      readonly mana: ManaType;
      readonly amount: number;
    })
  | (Base & {
      readonly type: "spell-cast";
      readonly player: PlayerId;
      readonly object: ObjectId;
      readonly targets: readonly TargetRef[];
      /** The value chosen for `{X}`, or `null` when the cost had no `{X}`. */
      readonly x: number | null;
    })
  | (Base & { readonly type: "spell-resolved"; readonly object: ObjectId })
  | (Base & {
      readonly type: "ability-activated";
      readonly source: ObjectId;
      readonly player: PlayerId;
      readonly onStack: boolean;
    })
  | (Base & { readonly type: "ability-resolved"; readonly source: ObjectId })
  | (Base & {
      readonly type: "ability-triggered";
      readonly source: ObjectId;
      readonly controller: PlayerId;
    })
  | (Base & {
      readonly type: "trigger-removed";
      readonly source: ObjectId;
      readonly reason: string;
    })
  | (Base & {
      readonly type: "pt-modified";
      readonly object: ObjectId;
      readonly power: number;
      readonly toughness: number;
      readonly duration: "end-of-turn" | "permanent";
    })
  | (Base & {
      readonly type: "counter-added";
      readonly object: ObjectId;
      readonly counter: string;
      readonly amount: number;
    })
  | (Base & {
      /** Counters removed (from a `removeCounter` ability cost — Walking
       * Ballista). */
      readonly type: "counter-removed";
      readonly object: ObjectId;
      readonly counter: string;
      readonly amount: number;
    })
  | (Base & {
      readonly type: "keyword-granted";
      readonly object: ObjectId;
      readonly keyword: string;
      readonly duration: "end-of-turn" | "permanent";
    })
  | (Base & {
      readonly type: "pt-modifier-expired";
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      /** A permanent became a creature via an "animate" effect (a man-land's
       * activated ability — rule 613 layer 4). */
      readonly type: "permanent-animated";
      readonly object: ObjectId;
      readonly power: number;
      readonly toughness: number;
      readonly duration: "end-of-turn" | "permanent";
    })
  | (Base & {
      /** A text-changing effect replaced a creature-type word (Artificial
       * Evolution — rule 612 / layer 3). */
      readonly type: "text-changed";
      readonly object: ObjectId;
      readonly from: string;
      readonly to: string;
    })
  | (Base & {
      readonly type: "attacker-declared";
      readonly attacker: ObjectId;
      readonly defender: PlayerId;
    })
  | (Base & {
      readonly type: "blocker-declared";
      readonly blocker: ObjectId;
      readonly attacker: ObjectId;
    })
  | (Base & {
      readonly type: "spell-fizzled";
      readonly object: ObjectId;
      readonly reason: string;
    })
  | (Base & {
      readonly type: "spell-countered";
      readonly object: ObjectId;
    })
  | (Base & {
      /** A player paid a permanent's ward cost (rule 702.21) to keep their
       * spell/ability from being countered. */
      readonly type: "ward-paid";
      readonly object: ObjectId;
      readonly player: PlayerId;
    })
  | (Base & {
      readonly type: "control-changed";
      readonly object: ObjectId;
      readonly controller: PlayerId;
      readonly untilEndOfTurn: boolean;
    })
  | (Base & {
      /** A Clone-style permanent chose what to copy (rule 707); `copyOf` is
       * `null` when it copied nothing. */
      readonly type: "permanent-copied";
      readonly object: ObjectId;
      readonly copyOf: string | null;
    })
  | (Base & {
      readonly type: "permanent-entered-battlefield";
      readonly object: ObjectId;
    })
  | (Base & {
      /** A permanent left the battlefield, for any destination. Fires
       * alongside (and just before) `permanent-destroyed` when the
       * destination is a graveyard; on its own otherwise. The hook for
       * `leaves-battlefield` triggers (rule 603.6d). */
      readonly type: "permanent-left-battlefield";
      readonly object: ObjectId;
      readonly toZone: "graveyard" | "exile" | "hand" | "library" | "command";
    })
  | (Base & {
      readonly type: "permanent-attached";
      readonly source: ObjectId;
      readonly target: ObjectId;
    })
  | (Base & {
      readonly type: "damage-dealt";
      readonly source: ObjectId;
      readonly target: TargetRef;
      readonly amount: number;
      /** True for combat damage (rule 510) — as opposed to burn, abilities, etc. */
      readonly combat: boolean;
    })
  | (Base & {
      readonly type: "life-changed";
      readonly player: PlayerId;
      readonly delta: number;
      readonly life: number;
    })
  | (Base & {
      readonly type: "permanent-destroyed";
      readonly object: ObjectId;
      readonly reason: string;
    })
  | (Base & {
      readonly type: "permanent-returned-to-hand";
      readonly object: ObjectId;
      readonly owner: PlayerId;
    })
  | (Base & {
      readonly type: "permanent-exiled";
      readonly object: ObjectId;
    })
  | (Base & {
      readonly type: "permanent-sacrificed";
      readonly object: ObjectId;
      readonly player: PlayerId;
    })
  | (Base & {
      readonly type: "permanent-destroy-prevented";
      readonly object: ObjectId;
      readonly reason: string;
    })
  | (Base & {
      /** A Fog-style effect resolved — all combat damage is prevented for the
       * rest of the turn (rule 614 replacement, turn-scoped). */
      readonly type: "combat-damage-prevention-set";
    })
  | (Base & {
      /** Damage was prevented by a replacement effect (Fog) — the event fires
       * in place of `damage-dealt`. */
      readonly type: "damage-prevented";
      readonly source: ObjectId;
      readonly target: TargetRef;
      readonly amount: number;
    })
  | (Base & {
      /** A card that would have gone to a graveyard was exiled instead (Rest
       * in Peace — rule 614). */
      readonly type: "graveyard-replaced-with-exile";
      readonly object: ObjectId;
    })
  | (Base & {
      /** A modal spell/ability's controller (or a "you may" clause) chose
       * which modes to apply — `modes` are indices into the mode list, or
       * empty for a declined "you may". */
      readonly type: "modes-chosen";
      readonly source: ObjectId;
      readonly modes: readonly number[];
    })
  | (Base & {
      readonly type: "cards-milled";
      readonly player: PlayerId;
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      readonly type: "player-lost";
      readonly player: PlayerId;
      readonly reason: string;
    })
  | (Base & {
      readonly type: "game-ended";
      readonly winner: PlayerId | null;
      readonly reason: string;
    })
  | (Base & {
      readonly type: "mulligan-taken";
      readonly player: PlayerId;
      /** Total mulligans this player has now taken. */
      readonly count: number;
    })
  | (Base & {
      readonly type: "hand-kept";
      readonly player: PlayerId;
      /** Mulligans taken before keeping this hand (0 for the opening hand). */
      readonly mulligans: number;
    })
  | (Base & {
      readonly type: "cards-put-on-bottom";
      readonly player: PlayerId;
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      /** The owner of a commander in a hidden zone chose whether to move it to
       * the command zone instead (rule 903.9a). `from` is where it had gone. */
      readonly type: "commander-zone-decision";
      readonly object: ObjectId;
      readonly toCommandZone: boolean;
      readonly from: "graveyard" | "exile" | "hand" | "library";
    });

export type GameEventType = GameEvent["type"];

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** A {@link GameEvent} without its `seq`, as passed to the emitter. */
export type GameEventInput = DistributiveOmit<GameEvent, "seq">;

/** The event variant for a given `type` discriminant. */
export type EventOfType<K extends GameEventType> = Extract<
  GameEvent,
  { type: K }
>;
