/**
 * What a spell or ability has done "this way" — the cards it made players
 * discard, draw or mill, the permanents it made them sacrifice, and what it
 * destroyed, exiled, returned to a hand, put into a graveyard or put onto the
 * battlefield. Read off the events of the resolution under way: every event
 * since `GameState.resolutionSince` is its own, because nothing else happens
 * while it resolves, across the decisions it waits on too. Behind the
 * `thisWay` amount, the `this-way` condition and the `thisWay` filter clause.
 */

import type { ThisWayKind } from "./effects.js";
import type { GameEvent } from "./events.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

/** One object the resolution did something to. */
export interface ThisWayEntry {
  readonly object: ObjectId;
  /**
   * Whose it counts as: the player who discarded, drew, milled or sacrificed
   * it; for a permanent destroyed, exiled or returned to a hand, its
   * controller as it left; for a card put into a graveyard, or moved from
   * anywhere but the battlefield, its owner; for a permanent put onto the
   * battlefield, its controller there.
   */
  readonly player: PlayerId;
  /** It left the battlefield doing so, so it is asked about as it last
   * existed there (rule 608.2h). */
  readonly departed: boolean;
  /** How many permanents it stands for: a token stack that went whole. */
  readonly count: number;
}

/** The events since `seq` (inclusive), oldest first. The log is append-only
 * and in `seq` order, so this walks back from its end. */
export function eventsSince(state: GameState, seq: number): readonly GameEvent[] {
  const log = state.eventLog;
  let i = log.length;
  while (i > 0 && log[i - 1].seq >= seq) i -= 1;
  return log.slice(i);
}

/**
 * What the resolution that began at event `since` — by default the one under
 * way, and nothing between resolutions — has done `what` to, each object
 * once, oldest first.
 */
export function thisWayEntries(
  state: GameState,
  what: ThisWayKind,
  since: number | undefined = state.resolutionSince,
): ThisWayEntry[] {
  if (since === undefined) return [];
  const out: ThisWayEntry[] = [];
  const seen = new Set<ObjectId>();
  const add = (object: ObjectId, player: PlayerId | undefined, departed: boolean): void => {
    if (player === undefined || seen.has(object)) return;
    seen.add(object);
    // A compacted stack moved whole is every token in it; it keeps its
    // `stackCount` until the tokens cease to exist.
    const count = departed ? (state.objects[object]?.stackCount ?? 1) : 1;
    out.push({ object, player, departed, count });
  };
  // Who controlled a permanent as it left: its last-known information, or a
  // ceased token's.
  const leftBy = (id: ObjectId): PlayerId | undefined =>
    state.objects[id]?.lastKnown?.controller ?? state.ceasedTokens?.[id]?.controller;
  const ownerOf = (id: ObjectId): PlayerId | undefined => state.objects[id]?.owner;
  for (const event of eventsSince(state, since)) {
    switch (what) {
      case "discarded":
        if (event.type === "cards-discarded") for (const id of event.objects) add(id, event.player, false);
        break;
      case "milled":
        if (event.type === "cards-milled") for (const id of event.objects) add(id, event.player, false);
        break;
      case "drawn":
        if (event.type === "card-drawn") add(event.object, event.player, false);
        break;
      case "sacrificed":
        if (event.type === "permanent-sacrificed") add(event.object, event.player, true);
        break;
      case "destroyed":
        // A destroy effect's, not a creature dying of damage or the legend
        // rule (both of which share the event).
        if (event.type === "permanent-destroyed" && event.reason === "destroyed") {
          add(event.object, leftBy(event.object), true);
        }
        break;
      case "exiled":
        if (event.type === "permanent-left-battlefield" && event.toZone === "exile") {
          add(event.object, leftBy(event.object), true);
        } else if (event.type === "cards-put-into-exile") {
          for (const { object, from } of event.arrivals) {
            add(object, from === "battlefield" ? leftBy(object) : ownerOf(object), from === "battlefield");
          }
        }
        break;
      case "returned-to-hand":
        if (event.type === "permanent-returned-to-hand") {
          const fromBattlefield = event.from === undefined;
          add(event.object, fromBattlefield ? leftBy(event.object) : event.owner, fromBattlefield);
        }
        break;
      case "put-into-graveyard":
        // Whose graveyard: its owner's, wherever it came from.
        if (event.type === "cards-put-into-graveyard") {
          for (const { object, from } of event.arrivals) add(object, ownerOf(object), from === "battlefield");
        }
        break;
      case "put-onto-battlefield":
        // Moved there from a zone — not a token created, nor a permanent
        // spell resolving.
        if (event.type === "permanent-entered-battlefield") {
          const object = state.objects[event.object];
          const entry = object?.entry;
          if (entry !== undefined && entry.cast === undefined && entry.from !== "stack") {
            add(event.object, object.controller, false);
          }
        }
        break;
    }
  }
  return out;
}
