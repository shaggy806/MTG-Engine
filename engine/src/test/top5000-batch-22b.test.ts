/**
 * Top-5000 batch 22b. No engine change: every card is existing vocabulary.
 * These pin the clause of each most likely to be wired wrong.
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
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
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
const obj = (object: ObjectId) => ({ kind: "object" as const, object });

describe("top-5000 batch 22b — Walking Atlas", () => {
  it("puts a land card from the hand onto the battlefield", () => {
    const { game } = setUp(["Forest"]);
    const atlas = spawn(game, "Walking Atlas");
    const handBefore = game.handOf(A).length;
    const landsBefore = game.battlefield.filter((id) => game.state.objects[id].controller === A).length;
    game.dispatch({ type: "activate-ability", player: A, source: atlas, abilityIndex: 0 });
    settle(game);
    expect(game.state.objects[atlas].tapped).toBe(true);
    expect(game.handOf(A)).toHaveLength(handBefore - 1);
    expect(game.battlefield.filter((id) => game.state.objects[id].controller === A)).toHaveLength(landsBefore + 1);
  });
});

describe("top-5000 batch 22b — Syr Ginger, the Meal Ender", () => {
  it("has its keywords only while an opponent controls a planeswalker", () => {
    const { game } = setUp();
    const ginger = spawn(game, "Syr Ginger, the Meal Ender");
    const kw = () => computeCharacteristics(game.state, registry, ginger).keywords;
    expect(kw().has("hexproof")).toBe(false);
    spawn(game, "Garruk Wildspeaker", A);
    expect(kw().has("hexproof")).toBe(false);
    spawn(game, "Garruk Wildspeaker", B);
    expect(kw().has("trample") && kw().has("hexproof") && kw().has("haste")).toBe(true);
  });

  it("grows when another artifact of yours dies, then gains life equal to its power", () => {
    const { game } = setUp();
    const ginger = spawn(game, "Syr Ginger, the Meal Ender");
    const ring = spawn(game, "Sol Ring");
    const theirs = spawn(game, "Mind Stone", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ring)]);
    settle(game);
    expect(counters(game, ginger)).toBe(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)]);
    settle(game);
    expect(counters(game, ginger)).toBe(1);
    lands(game, "Wastes", 2);
    game.dispatch({ type: "activate-ability", player: A, source: ginger, abilityIndex: 0 });
    settle(game);
    expect(zone(game, ginger)).toBe("graveyard");
    expect(life(game, A)).toBe(24);
  });
});

describe("top-5000 batch 22b — Time Stretch", () => {
  it("gives the target player two extra turns", () => {
    const { game } = setUp(["Time Stretch"]);
    lands(game, "Island", 10);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Time Stretch"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(game.state.extraTurns).toEqual([B, B]);
  });
});

describe("top-5000 batch 22b — Lifeblood Hydra", () => {
  it("enters with X counters and, dying, gains life and draws equal to the power it died with", () => {
    const { game } = setUp(["Lifeblood Hydra"], "Forest");
    lands(game, "Forest", 6);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lifeblood Hydra"), targets: [], xValue: 3 });
    settle(game);
    const hydra = named(game, "Lifeblood Hydra")[0];
    expect(counters(game, hydra)).toBe(3);
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(hydra)]);
    settle(game);
    expect(life(game, A)).toBe(23);
    expect(game.handOf(A)).toHaveLength(handBefore + 3);
  });
});

describe("top-5000 batch 22b — Magic Damper", () => {
  it("pumps, grants hexproof and untaps", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].tapped = true;
    game.debugApplyEffect(A, effectOf("Magic Damper"), [obj(bears)]);
    settle(game);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.keywords.has("hexproof")).toBe(true);
    expect(game.state.objects[bears].tapped).toBe(false);
  });
});

describe("top-5000 batch 22b — Cornered by Black Mages", () => {
  it("has the opponent sacrifice a creature and makes the Wizard", () => {
    const { game } = setUp(["Cornered by Black Mages"]);
    lands(game, "Swamp", 3);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Cornered by Black Mages"),
      targets: [{ kind: "player", player: B }],
    });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    const wizards = named(game, "Wizard Token (Kuja)");
    expect(wizards).toHaveLength(1);
    expect(game.state.objects[wizards[0]].controller).toBe(A);
  });
});

describe("top-5000 batch 22b — Mizzium Mortars", () => {
  it("overloaded, deals 4 to each creature you don't control and spares yours", () => {
    const { game } = setUp(["Mizzium Mortars"], "Mountain");
    lands(game, "Mountain", 6);
    const mine = spawn(game, "Hill Giant");
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Hill Giant", B)];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Mizzium Mortars"),
      targets: [],
      overload: true,
    });
    settle(game);
    for (const id of theirs) expect(zone(game, id)).toBe("graveyard");
    expect(zone(game, mine)).toBe("battlefield");
  });
});

describe("top-5000 batch 22b — The Mightstone and Weakstone", () => {
  it("taps for two restricted colorless", () => {
    const { game } = setUp();
    const stones = spawn(game, "The Mightstone and Weakstone");
    game.dispatch({ type: "activate-ability", player: A, source: stones, abilityIndex: 0 });
    expect(pool(game)).toEqual(["C", "C"]);
    expect(game.state.players[A].manaPool.every((unit) => unit.restriction !== undefined)).toBe(true);
  });

  it("its second mode gives a creature -5/-5", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant", B);
    const etb = registry.get("The Mightstone and Weakstone")!.triggered[0].effect!;
    if (etb.kind !== "modal") throw new Error("expected a modal trigger");
    game.debugApplyEffect(A, etb.modes[1].effect, [obj(giant)]);
    settle(game);
    // debugApplyEffect runs no state-based check, so read the -5/-5 itself.
    const c = computeCharacteristics(game.state, registry, giant);
    expect([c.power, c.toughness]).toEqual([-2, -2]);
  });
});

describe("top-5000 batch 22b — Treasure Map", () => {
  it("transforms on the third activation, losing its counters and making three Treasures", () => {
    const { game } = setUp();
    const map = spawn(game, "Treasure Map");
    lands(game, "Wastes", 3);
    for (let i = 1; i <= 3; i += 1) {
      game.state.objects[map].tapped = false;
      game.dispatch({ type: "activate-ability", player: A, source: map, abilityIndex: 0 });
      settle(game);
      if (i < 3) {
        expect(counters(game, map, "landmark")).toBe(i);
        expect(game.state.objects[map].face ?? 0).toBe(0);
      }
    }
    expect(counters(game, map, "landmark")).toBe(0);
    expect(game.state.objects[map].face).toBe(1);
    const treasures = game.battlefield
      .filter((id) => game.state.objects[id].cardName === "Treasure Token")
      .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(treasures).toBe(3);
  });
});

describe("top-5000 batch 22b — Karametra's Acolyte", () => {
  it("adds {G} equal to devotion to green, itself included", () => {
    const { game } = setUp();
    const acolyte = spawn(game, "Karametra's Acolyte");
    spawn(game, "Llanowar Elves");
    spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "activate-ability", player: A, source: acolyte, abilityIndex: 0 });
    expect(pool(game)).toEqual(["G", "G"]);
  });
});

describe("top-5000 batch 22b — Eldrazi Displacer", () => {
  it("blinks another creature back tapped, as a new object", () => {
    const { game } = setUp();
    const displacer = spawn(game, "Eldrazi Displacer");
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].counters = { "+1/+1": 1 };
    lands(game, "Wastes", 3);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: displacer,
      abilityIndex: 0,
      targets: [obj(bears)],
    });
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].tapped).toBe(true);
    expect(game.state.objects[back[0]].controller).toBe(B);
    expect(counters(game, back[0])).toBe(0);
  });

  it("can't target itself", () => {
    const { game } = setUp();
    const displacer = spawn(game, "Eldrazi Displacer");
    lands(game, "Wastes", 3);
    const offers = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && x.source === displacer && x.abilityIndex === 0);
    expect(offers).toHaveLength(0);
  });
});
