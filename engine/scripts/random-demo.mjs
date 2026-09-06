// Random-vs-random games: both seats pick uniformly from legalActions().
// Doubles as an engine fuzzer — if legalActions ever offers something dispatch
// refuses, this crashes.
//
//   npm run play:random -w engine
//   npm run play:random -w engine -- --games 50
//   npm run play:random -w engine -- --log        # print the last game's log
//   npm run play:random -w engine -- --players 3  # or 4 — exercises multi-opponent combat

import { Game, RandomController, asPlayerId, createRng } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const games = Number(flag("games", "10"));
const showLog = args.includes("--log");
const numPlayers = Number(flag("players", "2"));

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

/** `[["Forest", 17], ["Grizzly Bears", 4], ...]` -> a flat 40-card list. */
const deck = (entries) =>
  entries.flatMap(([name, count]) => Array(count).fill(name));

// Both decks get a mana base that can actually cast their own spells —
// otherwise one side just sits there and the fuzz only exercises one player.
const deckA = deck([
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
  ["Naturalize", 2],
  ["Prey Upon", 2],
  ["Rabid Bite", 1],
  ["Gladecover Scout", 2],
  ["Darksteel Myr", 1],
  ["Ambush Viper", 2],
]);
const deckB = deck([
  ["Mountain", 6],
  ["Plains", 4],
  ["Swamp", 4],
  ["Island", 5],
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
  ["Unsummon", 2],
  ["Boomerang", 1],
  ["Man-o'-War", 2],
  ["Tome Scour", 1],
  ["Angelic Edict", 1],
  ["Fireball", 2],
  ["Blaze", 1],
  ["Fume Spitter", 2],
  ["Bloodthrone Vampire", 2],
  ["Mind Rot", 2],
  ["Blightning", 2],
  ["Counterspell", 2],
  ["Negate", 1],
  ["Essence Scatter", 1],
  ["Monastery Swiftspear", 3],
]);

// All four seats' decks/commanders, in seating order — sliced down to
// `numPlayers` for a 2-4 player game. Carol/Dave reuse deckA/deckB (no
// commander needed; this is fuzz coverage for multi-defender combat, not a
// Commander-specific scenario) so the extra seats still have decks that can
// actually cast their own spells.
const allSeats = [
  { player: A, cards: deckA, commander: "Ureni of the Unwritten" },
  { player: B, cards: deckB, commander: "Ashmark, Mardu Vanguard" },
  { player: C, cards: deckA },
  { player: D, cards: deckB },
];
const seats = allSeats.slice(0, numPlayers);

let last = null;
const results = [];

for (let seed = 1; seed <= games; seed += 1) {
  const rng = createRng(seed * 7919);
  const pick = () => rng.next();
  const game = Game.create({
    seed,
    mulligans: true,
    controllers: Object.fromEntries(
      seats.map(({ player }) => [player, new RandomController(player, pick)]),
    ),
    decks: seats,
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
const tally = seats
  .map(({ player }) => `${player} ${wins(player)}`)
  .concat(`draws ${wins("draw")}`)
  .join(", ");
console.log(`${games} games — ${tally}`);
console.log(
  `avg turns ${(results.reduce((s, r) => s + r.turns, 0) / games).toFixed(1)}`,
);
