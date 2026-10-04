/**
 * Top-5000 batch 21g. No engine changes: every card here is existing
 * vocabulary. The tests pin the clause of each most likely to be wired
 * wrong — the experience count and tapped-and-attacking Rebels, and the
 * graveyard return that taps a Rebel (Otharri), the Lesson rider on earthbend
 * (Toph), converge read on
 * the way in (Crystalline Crawler), "except it's an artifact" (Machine God's
 * Effigy), the mana-value gate and "if you do" (Sanctum of Ugin), "another"
 * Elf's toughness (Wolverine Riders) and both X token batches (Farmer
 * Cotton).
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
/** How many permanents of that name, a token stack counting as every token in it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
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
const cast = (game: Game, name: string, xValue?: number): void => {
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: inHand(game, name),
    targets: [],
    ...(xValue !== undefined ? { xValue } : {}),
  });
  settle(game);
};

describe("top-5000 batch 21g — Otharri, Suns' Glory", () => {
  it("gets an experience counter, then makes a tapped, attacking Rebel per counter", () => {
    const { game } = setUp();
    const otharri = spawn(game, "Otharri, Suns' Glory");
    game.state.players[A].counters.experience = 1;
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: otharri, defender: B }] });
    settle(game);
    expect(game.state.players[A].counters.experience).toBe(2);
    expect(howMany(game, "Rebel Token")).toBe(2);
    for (const rebel of named(game, "Rebel Token")) {
      expect(game.state.objects[rebel].tapped).toBe(true);
      expect(game.state.objects[rebel].attacking).toBe(B);
    }
  });

  it("returns from the graveyard tapped by tapping a Rebel, and not without one", () => {
    const { game } = setUp();
    lands(game, "Mountain", 2);
    lands(game, "Plains", 2);
    const otharri = game.debugSpawn("Otharri, Suns' Glory", A, "graveyard");
    const offered = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === otharri);
    expect(offered()).toBe(false);
    const rebel = spawn(game, "Rebel Token");
    expect(offered()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: otharri, abilityIndex: 0 });
    expect(game.state.objects[rebel].tapped).toBe(true);
    // The cost doesn't exile it: it waits in the graveyard for the effect.
    expect(zone(game, otharri)).toBe("graveyard");
    settle(game);
    expect(zone(game, otharri)).toBe("battlefield");
    expect(game.state.objects[otharri].tapped).toBe(true);
  });
});

describe("top-5000 batch 21g — Toph, Hardheaded Teacher", () => {
  it("earthbends 1 for any spell, with an extra counter only for a Lesson", () => {
    const { game } = setUp(["Environmental Sciences", "Sol Ring"]);
    spawn(game, "Toph, Hardheaded Teacher");
    const wastes = lands(game, "Wastes", 3);
    const total = (): number => wastes.reduce((n, id) => n + counters(game, id), 0);
    cast(game, "Environmental Sciences");
    expect(total()).toBe(2);
    const bent = wastes.find((id) => counters(game, id) > 0)!;
    expect(chars(game, bent).types).toContain("creature");
    expect(chars(game, bent).types).toContain("land");
    cast(game, "Sol Ring");
    expect(total()).toBe(3);
  });
});

describe("top-5000 batch 21g — Crystalline Crawler", () => {
  it("enters with a counter per colour of mana spent to cast it", () => {
    const { game } = setUp(["Crystalline Crawler"]);
    spawn(game, "Plains");
    spawn(game, "Island");
    spawn(game, "Swamp");
    spawn(game, "Wastes");
    cast(game, "Crystalline Crawler");
    const crawler = named(game, "Crystalline Crawler");
    expect(crawler).toHaveLength(1);
    expect(counters(game, crawler[0])).toBe(3);
  });
});

describe("top-5000 batch 21g — Machine God's Effigy", () => {
  it("copies a creature as an artifact that isn't a creature, with {T}: Add {U}", () => {
    const { game } = setUp(["Machine God's Effigy"]);
    lands(game, "Wastes", 4);
    spawn(game, "Grizzly Bears", B);
    cast(game, "Machine God's Effigy");
    const effigy = game.battlefield.find((id) => game.state.objects[id].copyOf === "Grizzly Bears")!;
    expect(effigy).toBeDefined();
    expect(chars(game, effigy).types).toEqual(["artifact"]);
    expect(chars(game, effigy).subtypes).not.toContain("Bear");
    const tap = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === effigy);
    expect(tap).toBeDefined();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: effigy,
      abilityIndex: (tap as { abilityIndex: number }).abilityIndex,
    });
    expect(pool(game)).toEqual(["U"]);
  });
});

describe("top-5000 batch 21g — Sanctum of Ugin", () => {
  it("is sacrificed to find a colorless creature only for a colorless spell of mana value 7+", () => {
    const { game } = setUp(["Wurmcoil Engine", "Myr Battlesphere"]);
    lands(game, "Wastes", 13);
    const sanctum = spawn(game, "Sanctum of Ugin");
    const thopter = game.debugSpawn("Ornithopter", A, "library");
    cast(game, "Wurmcoil Engine");
    expect(zone(game, sanctum)).toBe("battlefield");
    expect(zone(game, thopter)).toBe("library");
    cast(game, "Myr Battlesphere");
    expect(zone(game, sanctum)).toBe("graveyard");
    expect(zone(game, thopter)).toBe("hand");
  });
});

describe("top-5000 batch 21g — Wolverine Riders", () => {
  it("gains life equal to another entering Elf's toughness, not its own or an opponent's", () => {
    const { game } = setUp();
    spawn(game, "Wolverine Riders");
    const before = life(game, A);
    game.debugSpawn("Wolverine Riders", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(before + 4);
    game.debugSpawn("Llanowar Elves", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(before + 4);
  });
});

describe("top-5000 batch 21g — Farmer Cotton", () => {
  it("makes X Halflings and X Food", () => {
    const { game } = setUp(["Farmer Cotton"]);
    spawn(game, "Forest");
    spawn(game, "Plains");
    lands(game, "Wastes", 2);
    cast(game, "Farmer Cotton", 2);
    expect(howMany(game, "Halfling Token")).toBe(2);
    expect(howMany(game, "Food Token")).toBe(2);
  });
});
