/**
 * Two starter decks for the hot-seat client. These are the same mana-honest
 * lists the engine fuzzer uses, so both seats can actually cast their spells.
 */

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

export const DECKS: {
  readonly alice: readonly string[];
  readonly bob: readonly string[];
} = {
  alice: list([
    ['Forest', 17],
    ['Llanowar Elves', 4],
    ['Grizzly Bears', 4],
    ['Elvish Visionary', 4],
    ['Wildwood Sentinel', 2],
    ['Rumbling Baloth', 3],
    ['Craw Wurm', 3],
    ['Giant Growth', 3],
  ]),
  bob: list([
    ['Mountain', 8],
    ['Plains', 6],
    ['Swamp', 4],
    ['Raging Goblin', 3],
    ['Goblin Raider', 3],
    ['White Knight', 3],
    ['Boggart Brute', 3],
    ['Typhoid Rats', 3],
    ['Hill Giant', 2],
    ['Lightning Bolt', 4],
    ['Vampire Nighthawk', 2],
    ['Serra Angel', 2],
    ['Disenchant', 2],
  ]),
}
