/**
 * Top-5000 batch 26 (group g). No engine change: each card is existing
 * vocabulary. These pin the clauses most likely to be wired wrong — the
 * counters filter on Chocobo Knights' grant, Dazzling Denial's Bird tax,
 * Sandstone Oracle's hand-size difference, Ninja Pizza's granted mana ability
 * and second-main trigger, Tavern Brawler's granted upkeep impulse and its
 * mana-value pump, Kheru Goldkeeper's "during your turn", Blue Sun's
 * Twilight's X ≥ 5 copy, Archmage of Echoes' Faerie-or-Wizard filter, and
 * Vraan's once-a-turn drain.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const triggerOf = (name: string, i = 0): EffectSpec => registry.get(name)!.triggered[i].effect!;
const power = (game: Game, id: ObjectId): number => computeCharacteristics(game.state, registry, id).power;

describe("top-5000 batch 26g — Herd Baloth", () => {
  it("makes a 4/4 Beast once when counters are put on it", () => {
    const { game } = setUp();
    const baloth = spawn(game, "Herd Baloth");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 }, [
      { kind: "object", object: baloth },
    ]);
    settle(game);
    const beasts = named(game, "Beast Token");
    expect(beasts).toHaveLength(1);
    expect(power(game, beasts[0])).toBe(4);
  });
});

describe("top-5000 batch 26g — Chocobo Knights", () => {
  it("gives double strike only to creatures you control with a counter on them", () => {
    const { game } = setUp();
    const knights = spawn(game, "Chocobo Knights");
    const countered = spawn(game, "Grizzly Bears");
    game.state.objects[countered].counters = { "+1/+1": 1 };
    const plain = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, triggerOf("Chocobo Knights"), [], { source: knights });
    settle(game);
    const has = (id: ObjectId): boolean =>
      computeCharacteristics(game.state, registry, id).keywords.has("double-strike");
    expect(has(countered)).toBe(true);
    expect(has(plain)).toBe(false);
    expect(has(knights)).toBe(false);
    expect(has(theirs)).toBe(false);
  });
});

describe("top-5000 batch 26g — Dazzling Denial", () => {
  // B casts Opt on its own turn with {2} left over; A answers with the Denial.
  const denial = (bird: boolean): { game: Game; opt: ObjectId } => {
    const b = new ScriptedController(B);
    b.chooseModesFn = () => [0];
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new ScriptedController(A), [B]: b },
      decks: [
        { player: A, cards: Array<string>(40).fill("Island") },
        { player: B, cards: Array<string>(40).fill("Island") },
      ],
    });
    lands(game, "Island", 2);
    lands(game, "Island", 3, B);
    if (bird) spawn(game, "Birds of Paradise");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    const opt = game.debugSpawn("Opt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: opt, targets: [] });
    game.advanceUntil((s) => s.priority.holder === A);
    const card = game.debugSpawn("Dazzling Denial", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [{ kind: "object", object: opt }] });
    game.advanceUntil(quiet);
    return { game, opt };
  };

  it("lets its controller pay {2} without a Bird", () => {
    const { game, opt } = denial(false);
    expect(zone(game, opt)).toBe("graveyard");
    expect(game.eventsOfType("spell-countered").some((e) => e.object === opt)).toBe(false);
  });

  it("asks {4} instead with a Bird, which two lands can't pay", () => {
    const { game, opt } = denial(true);
    expect(game.eventsOfType("spell-countered").some((e) => e.object === opt)).toBe(true);
  });
});

describe("top-5000 batch 26g — Mysidian Elder", () => {
  it("makes Kuja's 0/1 Wizard as it enters", () => {
    const { game } = setUp();
    game.debugSpawn("Mysidian Elder", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(named(game, "Wizard Token (Kuja)")).toHaveLength(1);
  });
});

describe("top-5000 batch 26g — Sandstone Oracle", () => {
  it("draws the difference when the opponent has more, and nothing otherwise", () => {
    const { game } = setUp();
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Wastes", B, "hand");
    const theirs = game.handOf(B).length;
    expect(theirs).toBeGreaterThan(game.handOf(A).length);
    game.debugApplyEffect(A, triggerOf("Sandstone Oracle"), []);
    settle(game);
    expect(game.handOf(A)).toHaveLength(theirs);
    // Now level: the difference is 0.
    game.debugApplyEffect(A, triggerOf("Sandstone Oracle"), []);
    settle(game);
    expect(game.handOf(A)).toHaveLength(theirs);
  });
});

describe("top-5000 batch 26g — Ninja Pizza", () => {
  it("gives Foods a sacrifice-for-any-colour mana ability", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Food Token", count: 1 }, []);
    settle(game);
    const food = named(game, "Food Token")[0];
    // With no mana, the Food's own {2} ability can't be activated.
    const tapFood = () =>
      game.legalActions(A).find((x) => x.kind === "activate-ability" && x.source === food);
    expect(tapFood()).toBeUndefined();
    spawn(game, "Ninja Pizza");
    const action = tapFood();
    expect(action).toBeDefined();
    if (action === undefined || action.kind !== "activate-ability") throw new Error("no granted ability");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: food,
      abilityIndex: action.abilityIndex,
      manaColors: ["R"],
    });
    expect(pool(game)).toEqual(["R"]);
    expect(named(game, "Food Token")).toHaveLength(0);
  });

  it("makes a Food at the beginning of your second main phase only", () => {
    const { game } = setUp();
    spawn(game, "Ninja Pizza");
    expect(named(game, "Food Token")).toHaveLength(0);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
    settle(game);
    expect(named(game, "Food Token")).toHaveLength(1);
    // The opponent's second main phase isn't yours.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    settle(game);
    expect(named(game, "Food Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 26g — Vraan, Executioner Thane", () => {
  it("drains once a turn for other creatures of yours dying, not for itself", () => {
    const { game } = setUp();
    const vraan = spawn(game, "Vraan, Executioner Thane");
    const first = spawn(game, "Grizzly Bears");
    const second = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: first }]);
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: second }]);
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(zone(game, vraan)).toBe("battlefield");
  });
});

describe("top-5000 batch 26g — Tavern Brawler", () => {
  it("gives your commander an upkeep impulse that pumps it by the exiled card's mana value", () => {
    // Every card in the library is a Hill Giant (mana value 4).
    const { game } = setUp([], "Hill Giant");
    lands(game, "Mountain", 4);
    spawn(game, "Tavern Brawler");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const other = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    settle(game);
    expect(power(game, commander)).toBe(6);
    expect(power(game, other)).toBe(2);
    const exiled = game.state.zones.shared.exile.filter(
      (id) => game.state.objects[id].cardName === "Hill Giant" && game.state.objects[id].owner === A,
    );
    expect(exiled).toHaveLength(1);
    expect(
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === exiled[0]),
    ).toBe(true);
  });
});

describe("top-5000 batch 26g — Kheru Goldkeeper", () => {
  it("makes a Treasure when a card leaves your graveyard on your turn, not on theirs", () => {
    const { game } = setUp();
    spawn(game, "Kheru Goldkeeper");
    const returnIt = (card: ObjectId): void => {
      game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [
        { kind: "object", object: card },
      ]);
      settle(game);
    };
    returnIt(game.debugSpawn("Grizzly Bears", A, "graveyard"));
    expect(named(game, "Treasure Token")).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    returnIt(game.debugSpawn("Grizzly Bears", A, "graveyard"));
    expect(named(game, "Treasure Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 26g — Blue Sun's Twilight", () => {
  it("steals and copies at X = 5", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Blue Sun's Twilight"), [{ kind: "object", object: giant }], { x: 5 });
    settle(game);
    expect(game.state.objects[giant].controller).toBe(A);
    const giants = named(game, "Hill Giant");
    expect(giants).toHaveLength(2);
    expect(giants.every((id) => game.state.objects[id].controller === A)).toBe(true);
  });

  it("only steals at X = 4", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Blue Sun's Twilight"), [{ kind: "object", object: giant }], { x: 4 });
    settle(game);
    expect(game.state.objects[giant].controller).toBe(A);
    expect(named(game, "Hill Giant")).toHaveLength(1);
  });
});

describe("top-5000 batch 26g — Archmage of Echoes", () => {
  it("copies a Wizard permanent spell, not a Bear", () => {
    const { game } = setUp(["Prodigal Sorcerer", "Grizzly Bears"]);
    lands(game, "Island", 4);
    lands(game, "Forest", 4);
    spawn(game, "Archmage of Echoes");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Prodigal Sorcerer"), targets: [] });
    settle(game);
    expect(named(game, "Prodigal Sorcerer")).toHaveLength(2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears"), targets: [] });
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
  });
});
