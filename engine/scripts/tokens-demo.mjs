// Scripted token demo. Alice casts Raise the Alarm for two 1/1 Soldier tokens,
// then Disenchants Bob's Wurmcoil Engine — its dies trigger creates two more
// tokens, a 3/3 deathtouch Wurm and a 3/3 lifelink Wurm.
//
//   npm run play:tokens -w engine

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
  seed: 4,
  shuffle: false,
  rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
  decks: [
    {
      player: A,
      cards: pad(["Plains", "Plains", "Plains", "Plains", "Raise the Alarm", "Disenchant"]),
    },
    { player: B, cards: pad([]) },
  ],
});

const spawn = makeSpawn(game);
const wurmcoil = spawn("Wurmcoil Engine", B);

const hand = () => game.handOf(A).map((id) => [id, game.state.objects[id].cardName]);
const find = (name) => hand().find(([, n]) => n === name)?.[0];
const atMain = (s) => s.turn.number === 1 && s.turn.step === "precombat-main";
const stackEmpty = (s) => s.zones.shared.stack.length === 0;

game.advanceUntil(atMain);

for (let i = 0; i < 4; i += 1) {
  game.dispatch({ type: "play-land", player: A, card: find("Plains") });
}

game.dispatch({ type: "cast-spell", player: A, card: find("Raise the Alarm") });
game.advanceUntil(stackEmpty);

game.dispatch({
  type: "cast-spell",
  player: A,
  card: find("Disenchant"),
  targets: [{ kind: "object", object: wurmcoil }],
});
game.advanceUntil(stackEmpty);

printLog(game);
printSummary(game);
