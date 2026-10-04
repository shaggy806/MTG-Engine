/**
 * Top-5000 batch 22a — no engine change. One test per card whose behaviour is
 * more than a stat line or an already-tested shape: "that creature's
 * controller" (Repercussion), a filter whose mana value reads a live count
 * (Beseech the Queen), a graveyard ability with a sacrifice cost (Cauldron
 * Familiar), the next-spell copy (Galvanic Iteration), a reveal with a
 * permanent-card pick then a token (Malevolent Rumble), and a lord over other
 * Cats (Regal Caracal).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
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
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object", object }) as const;
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

describe("top-5000 batch 22a — Repercussion", () => {
  it("deals the damage a creature was dealt to that creature's controller, even when it dies", () => {
    const { game } = setUp(["Lightning Bolt"]);
    lands(game, "Mountain", 1);
    spawn(game, "Repercussion");
    const bears = spawn(game, "Grizzly Bears", B);
    const theirs = life(game, B);
    const mine = life(game, A);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lightning Bolt"), targets: [obj(bears)] });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    // The full 3 dealt, not the 2 toughness; to Bob, not to Repercussion's controller.
    expect(life(game, B)).toBe(theirs - 3);
    expect(life(game, A)).toBe(mine);
  });
});

describe("top-5000 batch 22a — Beseech the Queen", () => {
  it("offers only cards with mana value up to the number of lands you control", () => {
    const { game, a } = setUp(["Beseech the Queen"]);
    lands(game, "Swamp", 3);
    const giant = game.debugSpawn("Hill Giant", A, "library"); // mana value 4
    const bears = game.debugSpawn("Grizzly Bears", A, "library"); // mana value 2
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return [bears];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Beseech the Queen"), targets: [] });
    settle(game);
    expect(eligible).toContain(bears);
    expect(eligible).not.toContain(giant);
    expect(zone(game, bears)).toBe("hand");
  });
});

describe("top-5000 batch 22a — Cauldron Familiar", () => {
  it("comes back from the graveyard for a Food, and drains as it enters", () => {
    const { game } = setUp();
    const familiar = game.debugSpawn("Cauldron Familiar", A, "graveyard");
    const food = game.debugSpawn("Food Token", A, "battlefield");
    const theirs = life(game, B);
    const mine = life(game, A);
    game.dispatch({ type: "activate-ability", player: A, source: familiar, abilityIndex: 0, targets: [], sacrifice: food });
    settle(game);
    expect(game.battlefield).not.toContain(food);
    expect(named(game, "Cauldron Familiar")).toHaveLength(1);
    expect(life(game, B)).toBe(theirs - 1);
    expect(life(game, A)).toBe(mine + 1);
  });
});

describe("top-5000 batch 22a — Galvanic Iteration", () => {
  it("copies the next instant or sorcery spell you cast this turn", () => {
    const { game } = setUp(["Galvanic Iteration", "Divination"]);
    lands(game, "Mountain", 2);
    lands(game, "Island", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Galvanic Iteration"), targets: [] });
    settle(game);
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Divination"), targets: [] });
    settle(game);
    // Divination left the hand; it and its copy drew two each.
    expect(game.handOf(A)).toHaveLength(before - 1 + 4);
  });
});

describe("top-5000 batch 22a — Malevolent Rumble", () => {
  it("takes a permanent card of the top four, bins the rest, and makes a Spawn", () => {
    const { game, a } = setUp(["Malevolent Rumble"]);
    lands(game, "Forest", 2);
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const shock = game.debugSpawn("Shock", A, "library");
    const giant = game.debugSpawn("Hill Giant", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return [bears];
    };
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Malevolent Rumble"), targets: [] });
    settle(game);
    expect([...eligible].sort()).toEqual([bears, giant].sort());
    expect(zone(game, bears)).toBe("hand");
    for (const id of [bolt, shock, giant]) expect(zone(game, id)).toBe("graveyard");
    expect(tokenCount(game, "Eldrazi Spawn Token")).toBe(1);
  });
});

describe("top-5000 batch 22a — Regal Caracal", () => {
  it("makes two lifelink Cats and pumps other Cats, not itself", () => {
    const { game } = setUp();
    const caracal = game.debugSpawn("Regal Caracal", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(tokenCount(game, "Lifelink Cat Token")).toBe(2);
    const cat = named(game, "Lifelink Cat Token")[0];
    const c = computeCharacteristics(game.state, registry, cat);
    expect([c.power, c.toughness]).toEqual([2, 2]);
    const self = computeCharacteristics(game.state, registry, caracal);
    expect([self.power, self.toughness]).toEqual([3, 3]);
    expect(self.keywords.has("lifelink")).toBe(false);
    // A Cat that isn't a token gets lifelink from it too.
    const familiar = spawn(game, "Cauldron Familiar");
    const f = computeCharacteristics(game.state, registry, familiar);
    expect([f.power, f.toughness]).toEqual([2, 2]);
    expect(f.keywords.has("lifelink")).toBe(true);
  });
});
