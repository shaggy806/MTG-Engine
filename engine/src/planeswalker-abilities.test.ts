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
  return { game, a, b };
};

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  opts: { counters?: Record<string, number> } = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: { ...opts.counters }, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const removeFromBattlefield = (game: Game, id: ObjectId): void => {
  game.state.zones.shared.battlefield = game.state.zones.shared.battlefield.filter((x) => x !== id);
  game.state.objects[id].zone = "graveyard";
  game.state.zones.perPlayer[game.state.objects[id].owner].graveyard.push(id);
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const loyaltyAbility = (game: Game, source: ObjectId, cost: number) =>
  game
    .legalActions(A)
    .find((x) => x.kind === "activate-ability" && x.source === source && x.loyalty === cost);

describe("EG-5 — a static anthem on a planeswalker (Rendwin, Warden of the Grove)", () => {
  it("buffs its controller's creatures, and only theirs", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const rendwin = spawn(game, "Rendwin, Warden of the Grove", A, {
      counters: { loyalty: 4 },
    });
    const myBear = spawn(game, "Grizzly Bears", A);
    const oppBear = spawn(game, "Grizzly Bears", B);

    expect(pt(game, myBear)).toEqual([3, 3]);
    expect(pt(game, oppBear)).toEqual([2, 2]); // not "you control"

    // The anthem is gone the moment Rendwin isn't on the battlefield.
    removeFromBattlefield(game, rendwin);
    expect(pt(game, myBear)).toEqual([2, 2]);
  });

  it("its own +1 token enters already anthem-buffed", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const rendwin = spawn(game, "Rendwin, Warden of the Grove", A, {
      counters: { loyalty: 4 },
    });

    game.dispatch({ type: "activate-ability", player: A, source: rendwin, abilityIndex: 0 });
    game.advanceUntil(settled);
    const token = game.battlefield.find(
      (id) => game.state.objects[id].cardName === "Soldier Token",
    );
    expect(token).toBeDefined();
    expect(pt(game, token!)).toEqual([2, 2]); // 1/1 + the anthem
    expect(game.state.objects[rendwin].counters.loyalty).toBe(5);
  });
});

describe("EG-5 — a triggered ability on a planeswalker (Yulra, Kindled Spark)", () => {
  it("its upkeep trigger fires on your turn, goes on the stack, and targets", () => {
    const { game, a } = mkGame();
    spawn(game, "Yulra, Kindled Spark", A, { counters: { loyalty: 3 } });
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];

    game.advanceUntil(toPrecombat);
    expect(game.state.players[B].life).toBe(19); // 1 damage from the upkeep trigger
    expect(game.eventsOfType("ability-triggered").length).toBeGreaterThan(0);
  });

  it("does not fire on an opponent's upkeep", () => {
    const { game } = mkGame();
    spawn(game, "Yulra, Kindled Spark", A, { counters: { loyalty: 3 } });
    game.advanceUntil(toPrecombat);
    const lifeAfterT1 = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(game.state.players[B].life).toBe(lifeAfterT1);
  });
});

describe("EG-5 — loyalty-ability cap (rule 606.3)", () => {
  it("one loyalty ability per planeswalker per turn, reset next turn", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const yulra = spawn(game, "Yulra, Kindled Spark", A, { counters: { loyalty: 3 } });
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: yulra,
      abilityIndex: 0, // [+1]
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[yulra].counters.loyalty).toBe(4);

    // A second loyalty ability this turn is illegal.
    expect(loyaltyAbility(game, yulra, -2)).toBeUndefined();
    expect(
      game.canDispatch({
        type: "activate-ability",
        player: A,
        source: yulra,
        abilityIndex: 1, // [-2]
      }),
    ).toMatch(/already been activated this turn/);

    // Alice's next turn: available again.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(loyaltyAbility(game, yulra, -2)).toBeDefined();
  });

  it("two different planeswalkers each get their own activation", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const yulra = spawn(game, "Yulra, Kindled Spark", A, { counters: { loyalty: 3 } });
    const rendwin = spawn(game, "Rendwin, Warden of the Grove", A, {
      counters: { loyalty: 4 },
    });
    const bear = spawn(game, "Grizzly Bears", B);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: yulra,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(settled);
    game.dispatch({ type: "activate-ability", player: A, source: rendwin, abilityIndex: 0 });
    game.advanceUntil(settled);

    expect(game.state.objects[yulra].counters.loyalty).toBe(4);
    expect(game.state.objects[rendwin].counters.loyalty).toBe(5);
  });
});
