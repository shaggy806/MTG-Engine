/**
 * Exalted (rule 702.111a — needed-cards P15): "Whenever a creature you
 * control attacks alone, that creature gets +1/+1 until end of turn."
 *
 * New: a dedicated `attacked-alone` event, fired once per declare-attackers
 * action (not per `attacker-declared` event, which would wrongly read as
 * "alone" for the first of several simultaneously-declared attackers) +
 * `TriggerSpec.on: "attacks-alone"` + `EffectTargetRef` `"trigger-object"`
 * (the lone attacker, not a target and not the ability's own source).
 */
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

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const mkGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad([]) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a };
};

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

describe("Ignoble Hierarch — Exalted", () => {
  it("pumps the lone attacker +1/+1", () => {
    const { game, a } = mkGame();
    spawn(game, "Ignoble Hierarch", A);
    const wurm = spawn(game, "Craw Wurm", A); // 6/4
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];

    game.advanceUntil(toPostcombat);

    expect(game.characteristics(wurm)).toMatchObject({ power: 7, toughness: 5 });
  });

  it("does not trigger when two creatures attack together", () => {
    const { game, a } = mkGame();
    spawn(game, "Ignoble Hierarch", A);
    const wurm = spawn(game, "Craw Wurm", A); // 6/4
    const bear = spawn(game, "Grizzly Bears", A); // 2/2
    a.declareAttackersFn = () => [
      { attacker: wurm, defender: B },
      { attacker: bear, defender: B },
    ];

    game.advanceUntil(toPostcombat);

    expect(game.characteristics(wurm)).toMatchObject({ power: 6, toughness: 4 });
    expect(game.characteristics(bear)).toMatchObject({ power: 2, toughness: 2 });
  });

  it("stacks across multiple Exalted sources", () => {
    const { game, a } = mkGame();
    spawn(game, "Ignoble Hierarch", A);
    spawn(game, "Ignoble Hierarch", A);
    const wurm = spawn(game, "Craw Wurm", A); // 6/4
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];

    game.advanceUntil(toPostcombat);

    expect(game.characteristics(wurm)).toMatchObject({ power: 8, toughness: 6 });
  });

  it("only pumps its controller's lone attacker, not an opponent's", () => {
    const { game, a } = mkGame();
    spawn(game, "Ignoble Hierarch", B); // an opponent's Exalted
    const wurm = spawn(game, "Craw Wurm", A); // 6/4
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];

    game.advanceUntil(toPostcombat);

    expect(game.characteristics(wurm)).toMatchObject({ power: 6, toughness: 4 });
  });
});
