// Random-vs-random games: both seats pick uniformly from legalActions().
// Doubles as an engine fuzzer — if legalActions ever offers something dispatch
// refuses, this crashes.
//
//   npm run play:random -w engine
//   npm run play:random -w engine -- --games 50
//   npm run play:random -w engine -- --log        # print the last game's log

import { Game, RandomController, asPlayerId, createRng } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const games = Number(flag("games", "10"));
const showLog = args.includes("--log");

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** `[["Forest", 17], ["Grizzly Bears", 4], ...]` -> a flat 40-card list. */
const deck = (entries) =>
  entries.flatMap(([name, count]) => Array(count).fill(name));

// Both decks get a mana base that can actually cast their own spells —
// otherwise one side just sits there and the fuzz only exercises one player.
const deckA = deck([
  ["Forest", 17],
  ["Llanowar Elves", 4],
  ["Grizzly Bears", 4],
  ["Elvish Visionary", 4],
  ["Wildwood Sentinel", 2],
  ["Rumbling Baloth", 3],
  ["Craw Wurm", 3],
  ["Giant Growth", 3],
]);
const deckB = deck([
  ["Mountain", 6],
  ["Plains", 6],
  ["Swamp", 4],
  ["Raging Goblin", 3],
  ["Goblin Raider", 3],
  ["White Knight", 3],
  ["Boggart Brute", 3],
  ["Typhoid Rats", 3],
  ["Hill Giant", 1],
  ["Lightning Bolt", 4],
  ["Vampire Nighthawk", 2],
  ["Serra Angel", 1],
  ["Disenchant", 2],
  ["Raise the Alarm", 2],
  ["Holy Strength", 2],
  ["Bonesplitter", 2],
  ["Wurmcoil Engine", 1],
]);

let last = null;
const results = [];

for (let seed = 1; seed <= games; seed += 1) {
  const rng = createRng(seed * 7919);
  const pick = () => rng.next();
  const game = Game.create({
    seed,
    controllers: {
      [A]: new RandomController(A, pick),
      [B]: new RandomController(B, pick),
    },
    decks: [
      { player: A, cards: deckA },
      { player: B, cards: deckB },
    ],
  });

  game.advance();
  last = game;
  results.push({
    seed,
    winner: game.winner ?? "draw",
    reason: game.state.result.reason,
    turns: game.state.turn.number,
    events: game.events.length,
  });
}

if (showLog && last !== null) {
  printLog(last);
  printSummary(last);
  console.log("");
}

console.log(`seed  winner  turns  events  reason`);
for (const r of results) {
  console.log(
    `${String(r.seed).padStart(4)}  ${String(r.winner).padEnd(6)}  ${String(
      r.turns,
    ).padStart(5)}  ${String(r.events).padStart(6)}  ${r.reason}`,
  );
}

const wins = (who) => results.filter((r) => r.winner === who).length;
console.log("");
console.log(
  `${games} games — alice ${wins("alice")}, bob ${wins("bob")}, draws ${wins("draw")}`,
);
console.log(
  `avg turns ${(results.reduce((s, r) => s + r.turns, 0) / games).toFixed(1)}`,
);
