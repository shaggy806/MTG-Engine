// Scripted combat-keywords demo. Alice swings with four creatures:
//
//   Craw Wurm       6/4 trample
//   White Knight    2/2 first strike
//   Vampire Nighthawk 2/3 flying, deathtouch, lifelink
//   Boggart Brute   3/2 menace
//
// Bob blocks with what he has:
//   - a Grizzly Bears in front of the White Knight  -> dies to first strike,
//     having dealt nothing back
//   - Typhoid Rats + a Grizzly Bears on the Craw Wurm -> the Wurm assigns just
//     1 to the deathtouch Rats, 2 to the Bear, and TRAMPLES 3 over; the Rats'
//     one point of deathtouch damage still kills the Wurm
//   - nothing can block the flying Nighthawk (2 to Bob, +2 life to Alice)
//   - Bob's spare Hill Giant can't block the Brute alone (menace), so it
//     connects for 3
//
//   npm run play:keywords -w engine

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
  seed: 3,
  shuffle: false,
  rules: { skipFirstDraw: false },
  controllers: { [A]: alice, [B]: bob },
  decks: [
    { player: A, cards: pad([]) },
    { player: B, cards: pad([]) },
  ],
});

const spawn = makeSpawn(game);

const wurm = spawn("Craw Wurm", A);
const knight = spawn("White Knight", A);
const hawk = spawn("Vampire Nighthawk", A);
const brute = spawn("Boggart Brute", A);

const bear1 = spawn("Grizzly Bears", B);
const bear2 = spawn("Grizzly Bears", B);
const rats = spawn("Typhoid Rats", B);
spawn("Hill Giant", B); // free, but can't block the menacing Brute alone

alice.declareAttackersFn = () => [
  { attacker: wurm, defender: B },
  { attacker: knight, defender: B },
  { attacker: hawk, defender: B },
  { attacker: brute, defender: B },
];
bob.declareBlockersFn = () => [
  { blocker: bear1, attacker: knight },
  { blocker: rats, attacker: wurm },
  { blocker: bear2, attacker: wurm },
];
alice.orderBlockersFn = () => [rats, bear2];

game.advanceUntil(
  (s) => s.turn.number === 1 && s.turn.step === "postcombat-main",
);

printLog(game);
printSummary(game);
