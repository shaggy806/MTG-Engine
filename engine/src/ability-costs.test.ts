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
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, targets: null,
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

describe("payLife ability cost — Greed", () => {
  it("draws a card and pays 2 life", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const greed = spawn(game, "Greed", A);
    spawn(game, "Swamp", A);
    const life0 = game.state.players[A].life;
    const hand0 = game.handOf(A).length;

    game.dispatch({ type: "activate-ability", player: A, source: greed, abilityIndex: 0 });
    game.advanceUntil(settled);

    expect(game.state.players[A].life).toBe(life0 - 2);
    expect(game.handOf(A).length).toBe(hand0 + 1);
  });

  it("can't be activated with less life than the cost", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const greed = spawn(game, "Greed", A);
    spawn(game, "Swamp", A);
    game.state.players[A].life = 1;

    expect(
      game.canDispatch({ type: "activate-ability", player: A, source: greed, abilityIndex: 0 }),
    ).not.toBeNull();
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === greed),
    ).toBe(false);
  });
});

describe("removeCounter ability cost — Walking Ballista", () => {
  it("pings for 1 and removes a +1/+1 counter, and stops when out of counters", () => {
    const { game } = mkGame(["Walking Ballista"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 4; i += 1) spawn(game, "Swamp", A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Walking Ballista"),
      xValue: 2,
    });
    game.advanceUntil(settled);
    const ballista = named(game, game.battlefield, "Walking Ballista");
    const goblin = spawn(game, "Raging Goblin", B); // 1/1
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(2);

    // Remove a counter -> 1 damage to the Goblin (kills it).
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ballista,
      abilityIndex: 1,
      targets: [{ kind: "object", object: goblin }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[goblin]?.zone).toBe("graveyard");

    // Fire the last counter at Bob.
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ballista,
      abilityIndex: 1,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(19);
    // 0 counters -> the ability is gone, and the 0/0 Ballista dies to an SBA.
    expect(game.battlefield.includes(ballista)).toBe(false);
  });
});
