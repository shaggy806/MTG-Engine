// Scripted triggers demo. Alice plays Elvish Visionary (ETB: draw a card) and a
// Phyrexian Arena (upkeep: draw + lose 1), then Lightning Bolts a Vengeful Ghoul
// so its death trigger deals 2 back.
//
//   npm run play:triggers -w engine

import { Game, asObjectId, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards) => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const game = Game.create({
  seed: 6,
  shuffle: false,
  rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
  decks: [
    {
      player: A,
      cards: pad([
        "Forest",
        "Forest",
        "Swamp",
        "Swamp",
        "Elvish Visionary",
        "Phyrexian Arena",
        "Mountain",
        "Lightning Bolt",
      ]),
    },
    { player: B, cards: pad([]) },
  ],
});

const inHand = (n) =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === n);
const atMain = (t) => (s) =>
  s.turn.number === t && s.turn.step === "precombat-main";
const stackEmpty = (s) => s.zones.shared.stack.length === 0;

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
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

// Turn 1: two lands + Elvish Visionary (ETB draws a card).
game.advanceUntil(atMain(1));
game.dispatch({ type: "play-land", player: A, card: inHand("Forest") });
game.dispatch({ type: "play-land", player: A, card: inHand("Forest") });
game.dispatch({ type: "cast-spell", player: A, card: inHand("Elvish Visionary") });
game.advanceUntil(stackEmpty);

// Turn 3: Swamps + Phyrexian Arena. Also drop a Vengeful Ghoul for Bob.
game.advanceUntil(atMain(3));
game.dispatch({ type: "play-land", player: A, card: inHand("Swamp") });
game.dispatch({ type: "play-land", player: A, card: inHand("Swamp") });
game.dispatch({ type: "play-land", player: A, card: inHand("Mountain") });
game.dispatch({ type: "cast-spell", player: A, card: inHand("Phyrexian Arena") });
game.advanceUntil(stackEmpty);
const ghoul = spawn("Vengeful Ghoul", B);
game.dispatch({
  type: "cast-spell",
  player: A,
  card: inHand("Lightning Bolt"),
  targets: [{ kind: "object", object: ghoul }],
});
game.advanceUntil(stackEmpty);

// Turn 5: Alice's upkeep fires Phyrexian Arena.
game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "draw");

printLog(game);
printSummary(game);
