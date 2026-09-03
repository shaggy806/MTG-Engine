// Scripted abilities demo. Alice ramps a Llanowar Elves, then uses Elves + lands
// to cast Prodigal Sorcerer, and later pings Bob with its {T} ability.
//
//   npm run play:abilities -w engine

import { Game, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

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
      cards: pad([
        "Forest",
        "Llanowar Elves",
        "Island",
        "Island",
        "Prodigal Sorcerer",
      ]),
    },
    { player: B, cards: pad([]) },
  ],
});

const inHand = (n) =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === n);
const onBoard = (n) =>
  game.battlefield.find((id) => game.state.objects[id].cardName === n);
const atMain = (t) => (s) =>
  s.turn.number === t && s.turn.step === "precombat-main";
const stackEmpty = (s) => s.zones.shared.stack.length === 0;

// Turn 1: Forest, then Llanowar Elves.
game.advanceUntil(atMain(1));
game.dispatch({ type: "play-land", player: A, card: inHand("Forest") });
game.dispatch({ type: "cast-spell", player: A, card: inHand("Llanowar Elves") });
game.advanceUntil(stackEmpty);

// Turn 3: two Islands, then Elves + an Island pay for Prodigal Sorcerer {2}{U}.
game.advanceUntil(atMain(3));
game.dispatch({ type: "play-land", player: A, card: inHand("Island") });
game.dispatch({ type: "play-land", player: A, card: inHand("Island") });
game.dispatch({ type: "cast-spell", player: A, card: inHand("Prodigal Sorcerer") });
game.advanceUntil(stackEmpty);

// Turn 5: the Sorcerer is no longer summoning-sick — ping Bob.
game.advanceUntil(atMain(5));
game.dispatch({
  type: "activate-ability",
  player: A,
  source: onBoard("Prodigal Sorcerer"),
  abilityIndex: 0,
  targets: [{ kind: "player", player: B }],
});
game.advanceUntil(stackEmpty);

printLog(game);
printSummary(game);
