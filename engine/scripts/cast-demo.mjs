// Scripted casting demo: Alice ramps two lands, plays a bear, then Bolts it
// with her own Lightning Bolt to show targeting, the stack, and creature death.
//
//   npm run play:cast -w engine

import { Game, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards) => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const game = Game.create({
  seed: 7,
  shuffle: false,
  rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
  decks: [
    {
      player: A,
      cards: pad(["Forest", "Mountain", "Mountain", "Grizzly Bears", "Lightning Bolt"]),
    },
    { player: B, cards: pad([]) },
  ],
});

const hand = () => game.handOf(A).map((id) => [id, game.state.objects[id].cardName]);
const find = (name) => hand().find(([, n]) => n === name)?.[0];
const atMain = (s) => s.turn.number === 1 && s.turn.step === "precombat-main";

game.advanceUntil(atMain);

game.dispatch({ type: "play-land", player: A, card: find("Forest") });
game.dispatch({ type: "play-land", player: A, card: find("Mountain") });
game.dispatch({ type: "play-land", player: A, card: find("Mountain") });

const bears = find("Grizzly Bears");
game.dispatch({ type: "cast-spell", player: A, card: bears });
game.advanceUntil((s) => s.zones.shared.stack.length === 0);

game.dispatch({
  type: "cast-spell",
  player: A,
  card: find("Lightning Bolt"),
  targets: [{ kind: "object", object: bears }],
});
game.advanceUntil((s) => s.zones.shared.stack.length === 0);

printLog(game);
printSummary(game);
