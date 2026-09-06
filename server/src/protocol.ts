/**
 * The wire protocol between a client device and the room server. Every
 * message is JSON over one WebSocket per connection.
 */

import type { Action, LegalAction, PlayerId, PlayerView } from "engine";

export interface SeatStatus {
  readonly player: PlayerId;
  /** Someone has claimed this seat (has a `clientToken` on file), regardless
   * of whether their connection is currently up. */
  readonly claimed: boolean;
  /** Whether the claiming connection is live right now. Only meaningful
   * when `claimed` — an unclaimed seat is never `online`. */
  readonly online: boolean;
}

export type ClientMessage =
  | { readonly type: "create-room"; readonly seed?: number }
  | { readonly type: "join-room"; readonly roomId: string }
  | {
      readonly type: "claim-seat";
      readonly roomId: string;
      readonly seat: PlayerId;
      /** Persisted client-side (e.g. localStorage) so a refresh reclaims the same seat. */
      readonly clientToken: string;
    }
  | {
      readonly type: "dispatch";
      readonly roomId: string;
      readonly action: Action;
    }
  | {
      /**
       * Auto-pass this seat's own priority windows for the rest of the
       * current turn — never another seat's. Stops early if this seat is
       * asked for a real decision (blockers/discard/order-blockers).
       */
      readonly type: "pass-turn";
      readonly roomId: string;
    }
  | {
      /**
       * Toggles auto-passing this seat's own priority windows clean through
       * an opponent's turn too, stopping only once it's this seat's own turn
       * again (or a real decision comes up). Calling it again while already
       * active cancels it.
       */
      readonly type: "auto-pass";
      readonly roomId: string;
    }
  | {
      /**
       * Toggles a standing preference: skip this seat's own priority windows
       * where the only legal thing to do is tap for mana, same as one with
       * no options at all. Off by default, since holding priority with mana
       * up (and passing manually) is how a player bluffs having an instant.
       */
      readonly type: "toggle-mana-skip";
      readonly roomId: string;
    };

export type ServerMessage =
  | { readonly type: "room-created"; readonly roomId: string }
  | {
      readonly type: "room-joined";
      readonly roomId: string;
      readonly seats: readonly SeatStatus[];
    }
  | {
      /** Pushed to every connected seat after a room is created/joined or any dispatch settles. */
      readonly type: "state";
      readonly roomId: string;
      readonly seat: PlayerId;
      readonly view: PlayerView;
      readonly actions: readonly LegalAction[];
      readonly seats: readonly SeatStatus[];
      /** Whether *this* seat currently has an auto-pass in effect. */
      readonly autoPassing: boolean;
      /** Whether *this* seat is currently skipping mana-only priority windows. */
      readonly skipManaOnly: boolean;
    }
  | { readonly type: "error"; readonly message: string };
