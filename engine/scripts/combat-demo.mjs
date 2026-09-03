// Scripted combat demo: Alice attacks with a Hill Giant and a Serra Angel.
// Bob double-blocks the Giant with two Grizzly Bears (one bear dies, one lives,
// the Giant dies) and can't block the flying Angel, so it connects for 4.
//
//   npm run play:combat -w engine

import { Game, ScriptedController, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";
import { makeSpawn } from "./spawn.mjs";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards) => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const alice = new ScriptedController(A);
const bob = new ScriptedController(B);

const game = Game.create({
  seed: 9,
  shuffle: false,
  rules: { skipFirstDraw: false },
  controllers: { [A]: alice, [B]: bob },
  decks: [
    { player: A, cards: pad([]) },
    { player: B, cards: pad([]) },
  ],
});

const spawn = makeSpawn(game);

const giant = spawn("Hill Giant", A);
const angel = spawn("Serra Angel", A);
const bear1 = spawn("Grizzly Bears", B);
const bear2 = spawn("Grizzly Bears", B);

alice.declareAttackersFn = () => [
  { attacker: giant, defender: B },
  { attacker: angel, defender: B },
];
bob.declareBlockersFn = () => [
  { blocker: bear1, attacker: giant },
  { blocker: bear2, attacker: giant },
];
alice.orderBlockersFn = () => [bear1, bear2];

game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");

printLog(game);
printSummary(game);
