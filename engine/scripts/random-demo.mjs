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
  ["Forest", 11],
  ["Tranquil Thicket", 2],
  ["Mishra's Factory", 2],
  ["Walking Ballista", 2],
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
  ["Contentious Plan", 1],
  ["Fog", 2],
  ["Doubling Season", 1],
  ["Rampant Growth", 2],
  ["Rampaging Baloths", 1],
  ["Juggernaut", 1],
  ["Combat Thresher", 1],
  ["Foundry Inspector", 1],
  ["Sol Ring", 1],
  ["Command Tower", 1],
  ["Prosperous Innkeeper", 1],
]);
// Kept deliberately lean (~50 cards) so the RandomController actually draws
// and plays its threats — a bloated deck just stalls out and the fuzz only
// exercises one side. One or two copies of each mechanic is enough coverage.
const deckB = deck([
  ["Mountain", 6],
  ["Swamp", 6],
  ["Island", 4],
  ["Blinkmoth Nexus", 2],
  ["Forest", 2],
  ["Raging Goblin", 2],
  ["White Knight", 2],
  ["Boggart Brute", 2],
  ["Typhoid Rats", 2],
  ["Monastery Swiftspear", 2],
  ["Vampire Nighthawk", 2],
  ["Thieving Magpie", 2],
  ["Hypnotic Specter", 1],
  ["Mind Control", 2],
  ["Mortivore", 1],
  ["Lord of Extinction", 1],
  ["Clone", 2],
  ["Turn to Frog", 2],
  ["Doom Blade", 2],
  ["Artificial Evolution", 1],
  ["Wurmcoil Engine", 1],
  ["Lightning Bolt", 2],
  ["Fireball", 1],
  ["Volt Charge", 1],
  ["Act of Treason", 2],
  ["Man-o'-War", 2],
  ["Unsummon", 1],
  ["Fume Spitter", 1],
  ["Bloodthrone Vampire", 1],
  ["Mind Rot", 1],
  ["Blightning", 1],
  ["Counterspell", 1],
  ["Negate", 1],
  ["Essence Scatter", 1],
  ["Bonesplitter", 1],
  ["Holy Strength", 1],
  ["Disenchant", 1],
  ["Angelic Edict", 1],
  ["Tome Scour", 1],
  ["Raise the Alarm", 1],
  ["Plains", 5],
  ["Rest in Peace", 1],
  ["Deliberate Course", 2],
  ["Pyroclasm", 1],
  ["Wrath of God", 1],
  ["Diabolic Edict", 2],
  ["Fleshbag Marauder", 2],
  ["Demonic Tutor", 1],
  ["Preordain", 2],
  ["Soul Warden", 1],
  ["Ajani's Pridemate", 1],
  ["Grave Pact", 1],
  ["Zulaport Cutthroat", 1],
  ["Pacifism", 2],
  ["Greed", 1],
  ["Combat Thresher", 1],
  ["Foundry Inspector", 1],
  ["Thalia, Guardian of Thraben", 1],
  ["Sol Ring", 1],
  ["Arcane Signet", 1],
]);

// A lean Dimir deck for Carol — carries the `Sarova, the Undying Current`
// commander (a `leaves-battlefield` + `dies` trigger) so the fuzzer exercises
// the 903.9a "ask before the move" replacement path.
const deckC = deck([
  ["Island", 9],
  ["Swamp", 9],
  ["Prodigal Sorcerer", 3],
  ["Typhoid Rats", 3],
  ["Vengeful Ghoul", 3],
  ["Vampire Nighthawk", 3],
  ["Hypnotic Specter", 2],
  ["Man-o'-War", 2],
  ["Unsummon", 2],
  ["Doom Blade", 2],
  ["Counterspell", 2],
  ["Mind Rot", 1],
  ["Damnation", 1],
  ["Diabolic Edict", 2],
  ["Demonic Tutor", 1],
  ["Preordain", 2],
  ["Opt", 1],
  ["Consider", 2],
  ["Zulaport Cutthroat", 2],
  ["Invisible Stalker", 2],
  ["Greed", 1],
  ["Arcane Signet", 1],
  ["Command Tower", 1],
]);

// All four seats' decks/commanders, in seating order — sliced down to
// `numPlayers` for a 2-4 player game. Dave reuses deckB (no commander needed;
// fuzz coverage for multi-defender combat) so the fourth seat still has a
// deck that can cast its own spells.
const allSeats = [
  { player: A, cards: deckA, commander: "Ureni of the Unwritten" },
  { player: B, cards: deckB, commander: "Ashmark, Mardu Vanguard" },
  { player: C, cards: deckC, commander: "Sarova, the Undying Current" },
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
