import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { tapped?: boolean; sick?: boolean } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: opts.tapped ?? false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: opts.sick ? game.state.turn.number : 0,
    summoningSick: opts.sick ?? false,
    loyaltyActivatedThisTurn: false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    timestamp: 0,
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    controlEndsAtCleanup: false,
    copyOf: null,
    counters: {},
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

describe("Utvara Hellkite — attacks trigger filtered to Dragons", () => {
  it("makes a 6/6 Dragon token when a Dragon it controls attacks", () => {
    const { game, a } = makeGame();
    const hellkite = spawn(game, "Utvara Hellkite", A);
    const bear = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [
      { attacker: hellkite, defender: B },
      { attacker: bear, defender: B },
    ];

    game.advanceUntil(toPostcombat);

    const tokens = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "6/6 Dragon Token",
    );
    expect(tokens).toHaveLength(1);
  });

  it("does not trigger off a non-Dragon attacker", () => {
    const { game, a } = makeGame();
    spawn(game, "Utvara Hellkite", A, { tapped: true }); // stays home
    const bear = spawn(game, "Grizzly Bears", A);
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];

    game.advanceUntil(toPostcombat);

    expect(
      game.battlefield.some((id) => game.state.objects[id].cardName === "6/6 Dragon Token"),
    ).toBe(false);
  });
});

describe("Atarka, World Render — grants the attacking Dragon double strike", () => {
  it("gives the triggering Dragon double strike, not itself when it didn't attack", () => {
    const { game, a } = makeGame();
    const atarka = spawn(game, "Atarka, World Render", A, { tapped: true }); // stays home
    const otherDragon = spawn(game, "Old Gnawbone", A);
    a.declareAttackersFn = () => [{ attacker: otherDragon, defender: B }];

    game.advanceUntil(toPostcombat);

    expect(game.state.objects[otherDragon].modifiers).toContainEqual(
      expect.objectContaining({ keywords: ["double-strike"] }),
    );
    expect(game.state.objects[atarka].modifiers).toHaveLength(0);
  });
});
