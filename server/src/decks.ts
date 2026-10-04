/**
 * The starter decks a new room seat falls back to when nobody brought their
 * own (see `PendingRoom.claimSeat`'s `deck` param, and `addBot`, which never
 * brings its own) — up to four seats, sliced down to however many players a
 * room asks for. The actual card lists live in `engine`'s `SAMPLE_DECKS`
 * (shared with the client's deck builder, which offers all of them as
 * ready-made "starter decks"); this just pairs the first four `bench` decks
 * (`BENCH_DECKS`, the ones the bots are measured on and pilot best) with this
 * server's fixed seat identities.
 */

import { BENCH_DECKS, asPlayerId } from "engine";
import type { PlayerId } from "engine";

export const ALICE: PlayerId = asPlayerId("alice");
export const BOB: PlayerId = asPlayerId("bob");
export const CAROL: PlayerId = asPlayerId("carol");
export const DAVE: PlayerId = asPlayerId("dave");

export interface SeatDeck {
  readonly id: PlayerId;
  readonly name: string;
  readonly cards: readonly string[];
  /** No commanders configured means a plain (non-Commander) 40-card deck. */
  readonly commanders?: readonly string[];
}

/** Every seat a room could have, in seating order — sliced to however many
 * players were asked for (2-4). */
export const SEATS: readonly SeatDeck[] = [ALICE, BOB, CAROL, DAVE].map((id, i) => ({
  id,
  name: BENCH_DECKS[i].name,
  commanders: BENCH_DECKS[i].commanders,
  cards: BENCH_DECKS[i].cards,
}));

/** Alice's and Bob's decks addressed by name, for tests that construct a
 * `Game` directly rather than going through a room. */
export const DECKS: {
  readonly alice: readonly string[];
  readonly bob: readonly string[];
} = {
  alice: SEATS[0].cards,
  bob: SEATS[1].cards,
};
