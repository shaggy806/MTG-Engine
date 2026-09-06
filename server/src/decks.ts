/**
 * The two starter decks a new room is seeded with. Same mana-honest lists as
 * the client's hot-seat decks and the engine fuzzer, duplicated rather than
 * imported since `server` and `client` are independent workspaces.
 */

import { asPlayerId } from "engine";
import type { PlayerId } from "engine";

export const ALICE: PlayerId = asPlayerId("alice");
export const BOB: PlayerId = asPlayerId("bob");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

export const COMMANDERS: { readonly alice: string; readonly bob: string } = {
  alice: "Ureni of the Unwritten",
  bob: "Ashmark, Mardu Vanguard",
};

export const DECKS: {
  readonly alice: readonly string[];
  readonly bob: readonly string[];
} = {
  alice: list([
    ["Forest", 16],
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
  ]),
  bob: list([
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
};
