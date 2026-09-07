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
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
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

const mkGame = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const boltA = (game: Game, target: TargetLike): void => {
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: named(game, game.handOf(A), "Lightning Bolt"),
    targets: [target],
  });
};
type TargetLike =
  | { kind: "object"; object: ObjectId }
  | { kind: "player"; player: PlayerId };

describe("Ward — Combat Thresher (Ward {2})", () => {
  it("taxes an opponent's targeted spell when they can pay", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const thresher = spawn(game, "Combat Thresher", B);
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain", A);

    boltA(game, { kind: "object", object: thresher });
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid").some((e) => e.object === thresher)).toBe(true);
    expect(game.state.objects[thresher].damageMarked).toBe(3); // the Bolt still hit
    // {R} for the Bolt + {2} for ward = all three Mountains tapped.
    expect(
      game.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Mountain" && game.state.objects[id].tapped,
      ).length,
    ).toBe(3);
  });

  it("counters an opponent's spell when they can't pay the ward", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const thresher = spawn(game, "Combat Thresher", B);
    spawn(game, "Mountain", A); // only enough for the Bolt itself

    boltA(game, { kind: "object", object: thresher });
    game.advanceUntil(settled);

    expect(game.eventsOfType("spell-countered").length).toBeGreaterThan(0);
    expect(game.state.objects[thresher].damageMarked).toBe(0);
    expect(
      game.graveyardOf(A).some((id) => game.state.objects[id].cardName === "Lightning Bolt"),
    ).toBe(true);
  });

  it("does not tax the controller's own spell", () => {
    const { game } = mkGame(["Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    const thresher = spawn(game, "Combat Thresher", A); // Alice's own
    spawn(game, "Mountain", A);

    boltA(game, { kind: "object", object: thresher });
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid")).toHaveLength(0);
    expect(game.state.objects[thresher].damageMarked).toBe(3);
  });

  it("also protects against a targeted ability", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const thresher = spawn(game, "Combat Thresher", B);
    const tim = spawn(game, "Prodigal Sorcerer", A); // {T}: deal 1 to any target
    // no spare mana for Alice — the ward can't be paid

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: tim,
      abilityIndex: 0,
      targets: [{ kind: "object", object: thresher }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[thresher].damageMarked).toBe(0);
    expect(game.eventsOfType("spell-countered").length).toBeGreaterThan(0);
  });
});
