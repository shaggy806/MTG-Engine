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
// Long runs print nothing until the very end, so a game that never terminates
// looks identical to one that's merely slow. `--progress` announces each seed
// on stderr *before* playing it — the last line printed names the culprit.
const showProgress = args.includes("--progress");

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
  ["Beast Within", 1],
  ["Prey Upon", 2],
  ["Rabid Bite", 1],
  ["Gladecover Scout", 2],
  ["Darksteel Myr", 1],
  ["Ambush Viper", 2],
  ["Contentious Plan", 1],
  ["Fog", 2],
  ["Doubling Season", 1],
  ["Rampant Growth", 2],
  ["Splendid Reclamation", 1],
  ["Harrow", 1],
  ["Crop Rotation", 1],
  ["Bojuka Bog", 1],
  ["Aftermath Analyst", 1],
  ["World Shaper", 1],
  ["Ramunap Excavator", 1],
  ["Tireless Provisioner", 1],
  ["Lotus Cobra", 1],
  ["Princess Sarah", 1],
  ["Icetill Explorer", 1],
  ["Sabotender", 1],
  ["Tannuk, Memorial Ensign", 1],
  ["Encroaching Dragonstorm", 1],
  ["Temur Battlecrier", 1],
  ["Mole Man, Moloid Master", 1],
  ["Rydia, Summoner of Mist", 1],
  ["Will of the Sultai", 1],
  ["Craterhoof Behemoth", 1],
  ["Finale of Devastation", 1],
  ["Scourge of Valkas", 1],
  ["Old Gnawbone", 1],
  ["Utvara Hellkite", 1],
  ["Atarka, World Render", 1],
  ["Miirym, Sentinel Wyrm", 1],
  ["Scute Swarm", 1],
  ["Garruk's Uprising", 1],
  ["Defense of the Heart", 1],
  ["Rampaging Baloths", 1],
  ["Juggernaut", 1],
  ["Combat Thresher", 1],
  ["Foundry Inspector", 1],
  ["Urza's Incubator", 1],
  ["Ignoble Hierarch", 1],
  ["Starfield Vocalist", 1],
  ["Lightning Greaves", 1],
  ["Summon: Titan", 1],
  ["Sol Ring", 1],
  ["Command Tower", 1],
  ["Prosperous Innkeeper", 1],
  ["Wilt-Leaf Cavaliers", 1],
  ["Grovewatch Elder", 2],
  ["Moonrise Cultivator", 2],
  ["Longtusk Cub", 2],
  ["Carnage Tyrant", 1],
  ["Kird Ape", 2],
  ["Werebear", 2],
  ["Cinder Elemental", 2],
  ["Lure", 1],
  ["Rendwin, Warden of the Grove", 1],
  ["Sunlit Bastion", 2],
  ["Seraphine, Dawnherald", 1],
  ["Garruk Wildspeaker", 1],
  ["Kiora, Behemoth Beckoner", 1],
  ["Cryptolith Rite", 1],
  ["Chromatic Lantern", 1],
  ["Evolving Wilds", 2],
  ["Temple of Abandon", 1],
  ["Frontier Bivouac", 1],
  ["Rootbound Crag", 1],
  ["Hinterland Harbor", 1],
  ["Farseek", 1],
  ["Karplusan Forest", 1],
  ["Yavimaya Coast", 1],
  ["Stomping Ground", 1],
  ["Sheltered Thicket", 1],
  ["Cinder Glade", 1],
  ["Amulet of Vigor", 1],
  ["Sakura-Tribe Elder", 1],
  ["Bountiful Landscape", 1],
  ["Ganax, Astral Hunter", 1],
  ["Dragon Tempest", 1],
  ["Lotus Field", 1],
  ["Blasphemous Act", 1],
  ["Genesis Ultimatum", 1],
  ["Fanatic of Rhonas", 1],
  ["Orcish Lumberjack", 1],
  ["Boseiju, Who Endures", 1],
  ["Otawara, Soaring City", 1],
  ["Cyclonic Rift", 1],
  ["Fierce Guardianship", 1],
  ["Kalonian Hydra", 1],
  ["Bristly Bill, Spine Sower", 1],
  ["Unnatural Growth", 1],
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
  ["Tear Asunder", 1],
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
  ["Iridescent Vinelasher", 2],
  ["Terror of the Peaks", 1],
  ["Bloodthrone Vampire", 1],
  ["Mind Rot", 1],
  ["Blightning", 1],
  ["Faithless Looting", 2],
  ["Snapcaster Mage", 1],
  ["Rift Bolt", 2],
  ["Behold the Multiverse", 1],
  ["Underworld Rage-Hound", 2],
  ["Counterspell", 1],
  ["An Offer You Can't Refuse", 1],
  ["Rapid Hybridization", 2],
  ["Saw in Half", 1],
  ["Negate", 1],
  ["Essence Scatter", 1],
  ["Bonesplitter", 1],
  ["Holy Strength", 1],
  ["Essence Flux", 1],
  ["Disenchant", 1],
  ["Angelic Edict", 1],
  ["Tome Scour", 1],
  ["Raise the Alarm", 1],
  ["History of Benalia", 1],
  ["Plains", 5],
  ["Rest in Peace", 1],
  ["Anafenza, the Foremost", 1],
  ["Notion Thief", 1],
  ["Deliberate Course", 2],
  ["Pyroclasm", 1],
  ["Gaze of Granite", 1],
  ["Magmaquake", 1],
  ["Kessig Wolf Run", 1],
  ["Wrath of God", 1],
  ["Diabolic Edict", 2],
  ["Fleshbag Marauder", 2],
  ["Korvold, Fae-Cursed King", 1],
  ["Zuran Orb", 1],
  ["Sylvan Safekeeper", 1],
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
  ["Gut Shot", 2],
  ["Flame Javelin", 1],
  ["Chandra, Acolyte of Flame", 1],
  ["Yulra, Kindled Spark", 1],
  ["Evolving Wilds", 2],
  ["Time Warp", 1],
  ["Aggravated Assault", 1],
  ["Rogue's Passage", 1],
  ["Grapeshot", 1],
  ["Bloodbraid Elf", 1],
  ["Twincast", 1],
  ["Nightfall Cultist", 2],
  ["Thorn of the Black Rose", 1],
  ["Coronation Rite", 1],
  ["Gravebound Squire", 2],
  ["Emberclaw Scout", 2],
  ["Sunder Charm", 2],
  ["Duskwood Verdict", 1],
  ["Ardent Recruit", 2],
  ["Ob Nixilis, the Fallen", 1],
  ["Rakdos Charm", 1],
  ["Takenuma, Abandoned Mire", 1],
  ["Eiganjo, Seat of the Empire", 1],
  ["Vandalblast", 1],
  ["Damn", 1],
  ["Deadly Rollick", 1],
  ["Flawless Maneuver", 1],
  ["Hour of Reckoning", 1],
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
  ["Underground Mortuary", 1],
  ["Raucous Theater", 1],
  ["Sulfur Falls", 1],
  ["Wooded Foothills", 1],
  ["Bloodstained Mire", 1],
  ["Blood Crypt", 1],
  ["Overgrown Tomb", 1],
  ["Riveteers Overlook", 1],
  ["Tranquil Thicket", 1],
  ["Vernal Fen", 1],
  ["Turbulent Fen", 1],
  ["Festering Thicket", 1],
  ["Manifold Key", 1],
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
  if (showProgress) process.stderr.write(`seed ${seed}/${games}… `);
  const startedAt = Date.now();
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
  if (showProgress) {
    process.stderr.write(
      `${game.state.turn.number} turns, ${game.events.length} events, ${
        Date.now() - startedAt
      }ms\n`,
    );
  }
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
