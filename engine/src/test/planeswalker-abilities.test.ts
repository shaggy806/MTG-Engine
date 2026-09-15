import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

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

describe("EG-5 — loyalty abilities that target (Garruk Wildspeaker)", () => {
  it("[+1] untaps two target lands and adds a loyalty counter", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });
    const forest1 = spawn(game, "Forest", A);
    const forest2 = spawn(game, "Forest", A);
    game.state.objects[forest1].tapped = true;
    game.state.objects[forest2].tapped = true;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: garruk,
      abilityIndex: 0, // [+1]
      targets: [
        { kind: "object", object: forest1 },
        { kind: "object", object: forest2 },
      ],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[forest1].tapped).toBe(false);
    expect(game.state.objects[forest2].tapped).toBe(false);
    expect(game.state.objects[garruk].counters.loyalty).toBe(4);
  });

  it("[-1] creates a 3/3 Beast and pays the loyalty", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });

    game.dispatch({ type: "activate-ability", player: A, source: garruk, abilityIndex: 1 });
    game.advanceUntil(settled);

    const token = game.battlefield.find(
      (id) => game.state.objects[id].cardName === "3/3 Beast Token",
    );
    expect(token).toBeDefined();
    expect(pt(game, token!)).toEqual([3, 3]);
    expect(game.state.objects[garruk].counters.loyalty).toBe(2);
  });

  it("[-4] pumps the team until end of turn, and only its controller's", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    // Loyalty 5, not 4 — at 4 the [-4] would leave a 0-loyalty planeswalker,
    // which state-based actions put into the graveyard before we can read it.
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 5 } });
    const myBear = spawn(game, "Grizzly Bears", A);
    const oppBear = spawn(game, "Grizzly Bears", B);

    game.dispatch({ type: "activate-ability", player: A, source: garruk, abilityIndex: 2 });
    game.advanceUntil(settled);

    expect(pt(game, myBear)).toEqual([5, 5]);
    expect(game.characteristics(myBear).keywords.has("trample")).toBe(true);
    expect(pt(game, oppBear)).toEqual([2, 2]);
    expect(game.state.objects[garruk].counters.loyalty).toBe(1);

    // "Until end of turn" — gone by Bob's turn.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(pt(game, myBear)).toEqual([2, 2]);
  });
});

describe("EG-5 — an emblem outlives its planeswalker", () => {
  it("Elspeth's [-7] anthem keeps applying after she is gone", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const elspeth = spawn(game, "Elspeth, Sun's Champion", A, { counters: { loyalty: 7 } });
    const bear = spawn(game, "Grizzly Bears", A);

    game.dispatch({ type: "activate-ability", player: A, source: elspeth, abilityIndex: 2 });
    game.advanceUntil(settled);
    expect(pt(game, bear)).toEqual([4, 4]);

    removeFromBattlefield(game, elspeth);
    expect(pt(game, bear)).toEqual([4, 4]); // the emblem is not a permanent
    expect(game.characteristics(bear).keywords.has("flying")).toBe(true);
  });
});

describe("EG-5 — loyalty-ability cap (rule 606.3)", () => {
  it("one loyalty ability per planeswalker per turn, reset next turn", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });

    game.dispatch({ type: "activate-ability", player: A, source: garruk, abilityIndex: 1 }); // [-1]
    game.advanceUntil(settled);
    expect(game.state.objects[garruk].counters.loyalty).toBe(2);

    // A second loyalty ability this turn is illegal.
    expect(loyaltyAbility(game, garruk, 1)).toBeUndefined();
    expect(
      game.canDispatch({
        type: "activate-ability",
        player: A,
        source: garruk,
        abilityIndex: 1,
      }),
    ).toMatch(/already been activated this turn/);

    // Alice's next turn: available again.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(loyaltyAbility(game, garruk, -1)).toBeDefined();
  });

  it("two different planeswalkers each get their own activation", () => {
    const { game } = mkGame();
    game.advanceUntil(toPrecombat);
    const garruk = spawn(game, "Garruk Wildspeaker", A, { counters: { loyalty: 3 } });
    const elspeth = spawn(game, "Elspeth, Sun's Champion", A, { counters: { loyalty: 4 } });

    game.dispatch({ type: "activate-ability", player: A, source: garruk, abilityIndex: 1 });
    game.advanceUntil(settled);
    game.dispatch({ type: "activate-ability", player: A, source: elspeth, abilityIndex: 0 });
    game.advanceUntil(settled);

    expect(game.state.objects[garruk].counters.loyalty).toBe(2);
    expect(game.state.objects[elspeth].counters.loyalty).toBe(5);
  });
});
