// Engine playground: build a two-player game and print its event log.
//
//   npm run play -w engine
//   npm run play -w engine -- --seed 7
//   npm run play -w engine -- --turns 3        # stop before turn 3 instead of playing to the end
//
// The npm script runs `tsc` first, so this always uses a fresh build in ../dist.
// With the default controllers nobody casts anything, so the game runs to a
// deck-out. See cast-demo.mjs for a scripted game with spells.

import { Game, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const seed = Number(flag("seed", "42"));
const stopBeforeTurn = flag("turns", null);

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const deck = (n) =>
  Array.from({ length: n }, (_, i) => (i % 2 ? "Grizzly Bears" : "Forest"));

const game = Game.create({
  seed,
  decks: [
    { player: A, cards: deck(40) },
    { player: B, cards: deck(40) },
  ],
});

if (stopBeforeTurn !== null) {
  game.advanceUntil((s) => s.turn.number >= Number(stopBeforeTurn));
} else {
  game.advance();
}

printLog(game);
printSummary(game);
