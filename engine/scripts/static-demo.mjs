// Static-abilities demo. Alice plays a Goblin Chieftain (other Goblins get
// +1/+1 and haste) and a Glorious Anthem, then swings with a Goblin that was
// only cast this turn.
//
//   npm run play:static -w engine

import { Game, ScriptedController, asObjectId, asPlayerId } from "../dist/index.js";
import { printLog, printSummary } from "./format.mjs";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards) => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const alice = new ScriptedController(A);

const game = Game.create({
  seed: 8,
  shuffle: false,
  rules: { skipFirstDraw: false },
  controllers: { [A]: alice },
  decks: [
    { player: A, cards: pad([]) },
    { player: B, cards: pad([]) },
  ],
});

const spawn = (cardName, controller, sick = false) => {
  game.state.timestampSeq += 1;
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
    enteredBattlefieldOnTurn: sick ? game.state.turn.number : 0,
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
    timestamp: game.state.timestampSeq,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const chieftain = spawn("Goblin Chieftain", A);
const anthem = spawn("Glorious Anthem", A);
const goblin = spawn("Goblin Raider", A, /* sick */ true);

const c = game.characteristics(goblin);
console.log(
  `Goblin Raider is ${c.power}/${c.toughness}, keywords: ${[...c.keywords].join(", ") || "none"}`,
);
console.log("(2/2 printed, +1/+1 from the Chieftain, +1/+1 from the Anthem)\n");

alice.declareAttackersFn = () => [{ attacker: goblin, defender: B }];
game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");

void [chieftain, anthem];
printLog(game);
printSummary(game);
