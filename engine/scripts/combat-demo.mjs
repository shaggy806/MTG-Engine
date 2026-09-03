// Scripted combat demo: Alice attacks with a Hill Giant and a Serra Angel.
// Bob double-blocks the Giant with two Grizzly Bears (one bear dies, one lives,
// the Giant dies) and can't block the flying Angel, so it connects for 4.
//
//   npm run play:combat -w engine

import { Game, ScriptedController, asObjectId, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

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

const spawn = (cardName, controller) => {
  const id = asObjectId(`demo-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: false,
    damageMarked: 0,
    enteredBattlefieldOnTurn: 0,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

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
