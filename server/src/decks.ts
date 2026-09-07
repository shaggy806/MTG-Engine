/**
 * The starter decks a new room is seeded with — up to four seats, sliced
 * down to however many players a room asks for. Same mana-honest lists as
 * the client's hot-seat decks and the engine fuzzer, duplicated rather than
 * imported since `server` and `client` are independent workspaces.
 */

import { asPlayerId } from "engine";
import type { PlayerId } from "engine";

export const ALICE: PlayerId = asPlayerId("alice");
export const BOB: PlayerId = asPlayerId("bob");
export const CAROL: PlayerId = asPlayerId("carol");
export const DAVE: PlayerId = asPlayerId("dave");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

export interface SeatDeck {
  readonly id: PlayerId;
  readonly cards: readonly string[];
  /** No commander configured means a plain (non-Commander) 40-card deck. */
  readonly commander?: string;
}

/** Every seat a room could have, in seating order — sliced to however many
 * players were asked for (2-4). */
export const SEATS: readonly SeatDeck[] = [
  {
    id: ALICE,
    commander: "Ureni of the Unwritten",
    cards: list([
      ["Forest", 15],
      ["Llanowar Elves", 4],
      ["Grizzly Bears", 4],
      ["Elvish Visionary", 4],
      ["Wildwood Sentinel", 2],
      ["Rumbling Baloth", 2],
      ["Craw Wurm", 2],
      ["Giant Growth", 3],
      ["Explorer's Insight", 1],
      ["Grave Recall", 1],
      ["Oracle of Mul Daya", 1],
      ["Mossback Dragon", 1],
    ]),
  },
  {
    id: BOB,
    commander: "Ashmark, Mardu Vanguard",
    cards: list([
      ["Mountain", 8],
      ["Plains", 6],
      ["Swamp", 4],
      ["Raging Goblin", 3],
      ["Goblin Raider", 3],
      ["White Knight", 3],
      ["Boggart Brute", 3],
      ["Typhoid Rats", 3],
      ["Hill Giant", 2],
      ["Lightning Bolt", 4],
      ["Vampire Nighthawk", 2],
      ["Serra Angel", 2],
      ["Disenchant", 2],
    ]),
  },
  {
    id: CAROL,
    commander: "Sarova, the Undying Current",
    cards: list([
      ["Island", 10],
      ["Swamp", 10],
      ["Prodigal Sorcerer", 4],
      ["Typhoid Rats", 4],
      ["Vengeful Ghoul", 4],
      ["Vampire Nighthawk", 4],
      ["Phyrexian Arena", 2],
      ["Levitation", 2],
      ["Jump", 2],
    ]),
  },
  // Dave has no commander yet — a plain 40-card deck for now.
  {
    id: DAVE,
    cards: list([
      ["Mountain", 9],
      ["Plains", 9],
      ["White Knight", 3],
      ["Fencing Ace", 3],
      ["Raging Goblin", 3],
      ["Goblin Raider", 3],
      ["Goblin Chieftain", 2],
      ["Serra Angel", 2],
      ["Lightning Bolt", 4],
      ["Disenchant", 2],
    ]),
  },
];

/** Alice's and Bob's commanders/decks addressed by name, for tests that
 * construct a `Game` directly rather than going through a room. */
export const COMMANDERS: { readonly alice: string; readonly bob: string } = {
  alice: SEATS[0].commander as string,
  bob: SEATS[1].commander as string,
};

export const DECKS: {
  readonly alice: readonly string[];
  readonly bob: readonly string[];
} = {
  alice: SEATS[0].cards,
  bob: SEATS[1].cards,
};
