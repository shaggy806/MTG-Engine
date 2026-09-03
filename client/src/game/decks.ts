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
    ['Wildwood Sentinel', 3],
    ['Rumbling Baloth', 4],
    ['Giant Growth', 4],
  ]),
  bob: list([
    ['Mountain', 12],
    ['Plains', 5],
    ['Raging Goblin', 4],
    ['Goblin Raider', 4],
    ['Goblin Chieftain', 3],
    ['Hill Giant', 4],
    ['Lightning Bolt', 4],
    ['Serra Angel', 2],
    ['Disenchant', 2],
  ]),
}
