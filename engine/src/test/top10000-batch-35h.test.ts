/**
 * Top-10000 batch 35h. Pins the clauses most likely to be wired wrong: a
 * counters filter on an "other creatures" grant (Winged Hive Tyrant), an
 * intervening-if upkeep token plus a life-gain replacement (Pest Rescuer),
 * greatest power read for both halves (Essence Harvest), damage to a
 * destroyed permanent's controller (Cindervines), a leaves-the-battlefield
 * count read as last known (Bloodtracker), a filtered mass reanimation
 * (Knights' Charge), a control Aura on an enchantment (Steal Enchantment)
 * and an Aura-granted upkeep trigger owned by the creature's controller
 * (Verdant Embrace).
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

const setUp = (): { game: Game } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => {
  game.advanceUntil(quiet);
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string, controller: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === controller,
  );
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const activatedEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.activated[index].effect!;

describe("top-10000 batch 35h — Winged Hive Tyrant", () => {
  it("gives flying and haste only to other creatures you control with counters", () => {
    const { game } = setUp();
    spawn(game, "Winged Hive Tyrant");
    const marked = spawn(game, "Grizzly Bears");
    const plain = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[marked].counters = { ...game.state.objects[marked].counters, "+1/+1": 1 };
    game.state.objects[theirs].counters = { ...game.state.objects[theirs].counters, "+1/+1": 1 };
    const m = chars(game, marked);
    expect(m.keywords.has("flying") && m.keywords.has("haste")).toBe(true);
    expect(chars(game, plain).keywords.has("flying")).toBe(false);
    expect(chars(game, theirs).keywords.has("flying")).toBe(false);
  });
});

describe("top-10000 batch 35h — Pest Rescuer", () => {
  it("makes a Pest only while you control none, and adds 1 to life gained", () => {
    const { game } = setUp();
    spawn(game, "Pest Rescuer");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    settle(game);
    expect(named(game, "Pest Token", A)).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    settle(game);
    expect(named(game, "Pest Token", A)).toHaveLength(1);
    const before = life(game, A);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 });
    expect(life(game, A)).toBe(before + 3);
  });
});

describe("top-10000 batch 35h — Essence Harvest", () => {
  it("drains by the greatest power among your creatures", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Winged Hive Tyrant");
    const a0 = life(game, A);
    const b0 = life(game, B);
    game.debugApplyEffect(A, registry.get("Essence Harvest")!.effect!, [{ kind: "player", player: B }]);
    expect(life(game, B)).toBe(b0 - 4);
    expect(life(game, A)).toBe(a0 + 4);
  });
});

describe("top-10000 batch 35h — Cindervines", () => {
  it("destroys the artifact and deals 2 damage to its controller", () => {
    const { game } = setUp();
    const vines = spawn(game, "Cindervines");
    const ring = spawn(game, "Sol Ring", B);
    const a0 = life(game, A);
    const b0 = life(game, B);
    game.debugApplyEffect(A, activatedEffect("Cindervines"), [{ kind: "object", object: ring }], { source: vines });
    expect(game.state.objects[ring].zone).toBe("graveyard");
    expect(life(game, B)).toBe(b0 - 2);
    expect(life(game, A)).toBe(a0);
  });
});

describe("top-10000 batch 35h — Bloodtracker", () => {
  it("draws a card for each +1/+1 counter it had as it left", () => {
    const { game } = setUp();
    const tracker = spawn(game, "Bloodtracker");
    game.state.objects[tracker].counters = { ...game.state.objects[tracker].counters, "+1/+1": 3 };
    const hand0 = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: tracker }]);
    settle(game);
    expect(game.handOf(A).length).toBe(hand0 + 3);
  });
});

describe("top-10000 batch 35h — Knights' Charge", () => {
  it("returns every Knight creature card from your graveyard, and nothing else", () => {
    const { game } = setUp();
    const charge = spawn(game, "Knights' Charge");
    const knight = game.debugSpawn("Chocobo Knights", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, activatedEffect("Knights' Charge"), [], { source: charge });
    settle(game);
    expect(named(game, "Chocobo Knights", A)).toHaveLength(1);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[knight] === undefined || game.state.objects[knight].zone !== "graveyard").toBe(true);
  });
});

describe("top-10000 batch 35h — Steal Enchantment", () => {
  it("takes control of the enchanted enchantment", () => {
    const { game } = setUp();
    const anthem = spawn(game, "Glorious Anthem", B);
    const steal = spawn(game, "Steal Enchantment");
    game.state.objects[steal].attachedTo = anthem;
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    expect(game.state.objects[anthem].controller).toBe(A);
  });
});

describe("top-10000 batch 35h — Verdant Embrace", () => {
  it("pumps the creature and its controller makes the Saproling each upkeep", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const embrace = spawn(game, "Verdant Embrace");
    game.state.objects[embrace].attachedTo = bears;
    const c = chars(game, bears);
    expect([c.power, c.toughness]).toEqual([5, 5]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    settle(game);
    expect(named(game, "Saproling Token", B)).toHaveLength(1);
    expect(named(game, "Saproling Token", A)).toHaveLength(0);
  });
});
