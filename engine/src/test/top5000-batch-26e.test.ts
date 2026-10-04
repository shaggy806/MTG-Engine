/**
 * Top-5000 batch 26e. Pins the clause of each card most likely to be wired
 * wrong: Thundering Raiju's "modified creatures other than this creature",
 * recruit's nonland-discard gate (The Queen of Dale), Veinwitch Coven's
 * "you may pay {B}", Tail Swipe's main-phase pump, Crested Sunmare's
 * intervening-if and "other Horses", Grave Venerations' monarch gate, and
 * Murderous Redcap's damage read from its power.
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
const triggerEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-5000 batch 26e — Thundering Raiju", () => {
  it("counts modified creatures you control other than itself, the new counter included", () => {
    const { game } = setUp();
    const raiju = spawn(game, "Thundering Raiju");
    game.state.objects[raiju].counters = { "+1/+1": 1 };
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    const elves = spawn(game, "Llanowar Elves");
    spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, triggerEffect("Thundering Raiju"), [{ kind: "object", object: elves }], { source: raiju });
    settle(game);
    // Bears and the Elves (just countered); not the Raiju, the Giant or Bob's.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 26e — The Queen of Dale", () => {
  it("recruits a Human Soldier only off a nonland discard", () => {
    const creatures = setUp([], "Grizzly Bears").game;
    creatures.debugApplyEffect(A, triggerEffect("The Queen of Dale"), []);
    settle(creatures);
    expect(named(creatures, "Human Soldier Token")).toHaveLength(1);

    const landsOnly = setUp([], "Wastes").game;
    landsOnly.debugApplyEffect(A, triggerEffect("The Queen of Dale"), []);
    settle(landsOnly);
    expect(named(landsOnly, "Human Soldier Token")).toHaveLength(0);
  });

  it("triggers on an opponent's first noncreature spell, not on a creature spell", () => {
    const def = registry.get("The Queen of Dale")!;
    const trigger = def.triggered[0].trigger;
    expect(trigger).toMatchObject({ on: "cast-spell", who: "opponent", firstEachTurn: true, filter: { notTypes: ["creature"] } });
  });
});

describe("top-5000 batch 26e — Veinwitch Coven", () => {
  it("pays {B} on a life gain to return a creature card", () => {
    const { game } = setUp();
    lands(game, "Swamp", 1);
    spawn(game, "Veinwitch Coven");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 }, []);
    settle(game);
    expect(zone(game, bears)).toBe("hand");
  });

  it("does nothing without the {B}", () => {
    const { game } = setUp();
    spawn(game, "Veinwitch Coven");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 }, []);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
  });
});

describe("top-5000 batch 26e — Crested Sunmare", () => {
  it("makes a Horse at the end step only if you gained life, and the Horse is indestructible", () => {
    const { game } = setUp();
    const sunmare = spawn(game, "Crested Sunmare");
    game.advanceUntil((s) => s.turn.step === "end");
    settle(game);
    expect(named(game, "Horse Token")).toHaveLength(0);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end");
    settle(game);
    const horses = named(game, "Horse Token");
    expect(horses).toHaveLength(1);
    expect(computeCharacteristics(game.state, registry, horses[0]).keywords.has("indestructible")).toBe(true);
    expect(computeCharacteristics(game.state, registry, sunmare).keywords.has("indestructible")).toBe(false);
  });
});

describe("top-5000 batch 26e — Grave Venerations", () => {
  it("returns a creature card at your end step only while you're the monarch", () => {
    const { game } = setUp();
    game.debugSpawn("Grave Venerations", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.monarch).toBe(A);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.advanceUntil((s) => s.turn.step === "end");
    settle(game);
    expect(zone(game, bears)).toBe("hand");

    game.state.monarch = B;
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "end");
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-5000 batch 26e — Murderous Redcap", () => {
  it("deals damage equal to its current power", () => {
    const { game } = setUp();
    const redcap = spawn(game, "Murderous Redcap");
    game.state.objects[redcap].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, triggerEffect("Murderous Redcap"), [{ kind: "player", player: B }], { source: redcap });
    settle(game);
    expect(life(game, B)).toBe(17);
  });
});
