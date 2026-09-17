// What does the evaluation actually think things are worth?
//
//   npm run bot:audit -w engine
//   npm run bot:audit -w engine -- --champion ramp
//   npm run bot:audit -w engine -- --weights-file data/fitted.json
//
// Two sections, both of which exist because a win rate can't tell you *why* a
// vector is wrong, only that it is.
//
// **Card prices.** Spawn one permanent onto an otherwise fixed board and print
// the change in score. This is how the largest gap in the evaluation was found:
// the shipped defaults price a Sol Ring at 1.00 and a Grizzly Bears at 8.00,
// because `lands` filters on the land type and nothing else counts a permanent
// as *mana*. A rock or a dork is scored as a generic permanent, so the bot
// cannot see that the most powerful accelerant in Commander accelerates.
//
// **Curve checks.** Several features are linear where the real value is
// strongly non-linear, which no amount of weight tuning can fix — a weight
// scales a curve, it can't bend one. Losing five life at 40 and at 8 are not
// the same event; the twelfth land and the second are not the same card. Each
// check prints the marginal value at two points, and a ratio of 1.00 means the
// evaluation is blind to a difference every Commander player treats as basic.
//
// See `docs/plans/smarter-bots.md`.

import { readFileSync } from "node:fs";

import {
  DEFAULT_WEIGHTS,
  Game,
  asPlayerId,
  championById,
  createDefaultRegistry,
  evaluateState,
  normalizeWeights,
} from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const champion = flag("champion", null);
const weightsFile = flag("weights-file", null);
const base = champion !== null ? championById(champion).weights : DEFAULT_WEIGHTS;
const fromFile = weightsFile !== null ? JSON.parse(readFileSync(weightsFile, "utf8")) : {};
const weights = normalizeWeights({ ...base, ...fromFile, ...JSON.parse(flag("weights", "{}")) });

const registry = createDefaultRegistry();
const A = asPlayerId("alice");
const B = asPlayerId("bob");
const deck = (player) => ({ player, cards: Array(60).fill("Forest") });

/** A two-player game paused at Alice's precombat main, for `setup` to build on. */
function board(setup = () => {}) {
  const game = Game.create({ seed: 3, registry, decks: [deck(A), deck(B)] });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  setup(game);
  return game;
}

const score = (game) => evaluateState(game.state, registry, A, weights);

/** The change in score from putting one `name` onto the battlefield. */
function priceOf(name, setup) {
  const game = board(setup);
  const before = score(game);
  game.debugSpawn(name, A, "battlefield", { summoningSick: false });
  return score(game) - before;
}

console.log(`evaluation audit: ${champion ?? weightsFile ?? "current defaults"}\n`);

// --- what a permanent is worth ------------------------------------------

const CARDS = [
  ["Forest", "a land"],
  ["Sol Ring", "2 mana for 1 — the format's best accelerant"],
  ["Arcane Signet", "a 2-mana rock"],
  ["Mind Stone", "a 2-mana rock that cashes in for a card"],
  ["Thran Dynamo", "3 mana for 4"],
  ["Llanowar Elves", "a 1-mana dork"],
  ["Solemn Simulacrum", "a body that ramps and draws"],
  ["Phyrexian Arena", "a card every turn, forever"],
  ["Lightning Greaves", "haste and protection, repeatable"],
  ["Grizzly Bears", "a vanilla 2/2"],
  ["Craw Wurm", "a vanilla 6/4"],
];

console.log("what one permanent is worth:");
const widest = Math.max(...CARDS.map(([n]) => n.length));
for (const [name, note] of CARDS) {
  if (!registry.has(name)) continue;
  console.log(`  ${name.padEnd(widest)}  ${priceOf(name).toFixed(2).padStart(7)}   ${note}`);
}

// --- where the model is linear and the game is not ----------------------

/**
 * How much the score moves for the same change, measured at two different
 * places on the curve. A ratio near 1 means the evaluation treats them as
 * identical events, which for every check below is wrong.
 */
function curve(label, at, change, low, high, expectation) {
  const delta = (point) => {
    const game = board((g) => at(g, point));
    const before = score(game);
    change(game);
    return score(game) - before;
  };
  const a = delta(low.value);
  const b = delta(high.value);
  const ratio = b === 0 ? Infinity : a / b;
  console.log(
    `  ${label.padEnd(34)} ${low.label.padEnd(14)} ${a.toFixed(2).padStart(7)}   ` +
      `${high.label.padEnd(14)} ${b.toFixed(2).padStart(7)}   ratio ${ratio.toFixed(2)}`,
  );
  console.log(`      expected: ${expectation}`);
}

console.log("\nwhere the model is linear and the game is not:");

curve(
  "losing 5 life",
  (g, life) => {
    g.state.players[A].life = life;
  },
  (g) => {
    g.state.players[A].life -= 5;
  },
  { label: "at 8 life", value: 8 },
  { label: "at 40 life", value: 40 },
  "far worse near death than at a full life total; linear `life` says identical",
);

curve(
  "one more land",
  (g, n) => {
    for (let i = 0; i < n; i += 1) g.debugSpawn("Forest", A, "battlefield");
  },
  (g) => g.debugSpawn("Forest", A, "battlefield"),
  { label: "on 1 land", value: 1 },
  { label: "on 11 lands", value: 11 },
  "the 2nd land is worth several times the 12th — a 1-drop dork is +50% of turn-2 mana",
);

curve(
  "milling 10",
  (g, n) => {
    g.state.zones.perPlayer[A].library = g.state.zones.perPlayer[A].library.slice(0, n);
  },
  (g) => {
    g.state.zones.perPlayer[A].library = g.state.zones.perPlayer[A].library.slice(0, -10);
  },
  { label: "on 12 cards", value: 12 },
  { label: "on 52 cards", value: 52 },
  "near-fatal on a thin library, irrelevant on a full one; linear `library` says identical",
);

console.log("\nnote: a ratio of 1.00 means the evaluation cannot tell the two situations apart,");
console.log("and no weight can fix that — a weight scales a curve, it cannot bend one.");
