// Scripted Auras & Equipment demo. Alice enchants her Grizzly Bears with Holy
// Strength (+1/+2) and equips it with a Bonesplitter (+2/+0), making it a 5/4.
// Bob then kills it with two Lightning Bolts: Holy Strength falls off to the
// graveyard with its host, but the Bonesplitter stays on the battlefield,
// unattached, ready to equip something else later.
//
//   npm run play:attachments -w engine

import { Game, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";
import { makeSpawn } from "./spawn.mjs";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards) => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const game = Game.create({
  seed: 5,
  shuffle: false,
  rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
  decks: [
    {
      player: A,
      cards: pad(["Plains", "Plains", "Plains", "Holy Strength", "Bonesplitter"]),
    },
    { player: B, cards: pad(["Lightning Bolt", "Lightning Bolt"]) },
  ],
});

const spawn = makeSpawn(game);
const bear = spawn("Grizzly Bears", A);
spawn("Mountain", B);
spawn("Mountain", B);

const handOf = (p) => game.handOf(p).map((id) => [id, game.state.objects[id].cardName]);
const find = (p, name) => handOf(p).find(([, n]) => n === name)?.[0];
const atMain = (s) => s.turn.number === 1 && s.turn.step === "precombat-main";
const stackEmpty = (s) => s.zones.shared.stack.length === 0;

game.advanceUntil(atMain);
for (let i = 0; i < 3; i += 1) {
  game.dispatch({ type: "play-land", player: A, card: find(A, "Plains") });
}

game.dispatch({
  type: "cast-spell",
  player: A,
  card: find(A, "Holy Strength"),
  targets: [{ kind: "object", object: bear }],
});
game.advanceUntil(stackEmpty);

game.dispatch({ type: "cast-spell", player: A, card: find(A, "Bonesplitter") });
game.advanceUntil(stackEmpty);

const bonesplitter = game.battlefield.find(
  (id) => game.state.objects[id].cardName === "Bonesplitter",
);
game.dispatch({
  type: "activate-ability",
  player: A,
  source: bonesplitter,
  abilityIndex: 0,
  targets: [{ kind: "object", object: bear }],
});
game.advanceUntil(stackEmpty);

console.log(`Grizzly Bears is now ${game.characteristics(bear).power}/${game.characteristics(bear).toughness}`);

// Alice passes so Bob can Bolt the (now 5/4) bear twice.
game.dispatch({ type: "pass-priority", player: A });
game.dispatch({
  type: "cast-spell",
  player: B,
  card: find(B, "Lightning Bolt"),
  targets: [{ kind: "object", object: bear }],
});
game.advanceUntil(stackEmpty);

// Priority returns to Alice once the stack empties; she passes again.
game.dispatch({ type: "pass-priority", player: A });
game.dispatch({
  type: "cast-spell",
  player: B,
  card: find(B, "Lightning Bolt"),
  targets: [{ kind: "object", object: bear }],
});
game.advanceUntil(stackEmpty);

printLog(game);
printSummary(game);
