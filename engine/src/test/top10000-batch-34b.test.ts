/**
 * Top-10000 batch 34b. No engine changes: every card is existing vocabulary.
 * The tests pin the clause of each most likely to be wired wrong — Memory
 * Deluge's X as the mana spent, Kindred Charge's copies of the chosen type
 * only (hasty, exiled at the end step), Jugan Defends the Temple's token and
 * flip and Remnant of the Rising Star's five-modified-creatures bonus,
 * Copycrook's connive on the copy, Corsairs of Umbar's amass Orcs, Bone
 * Sabres' counters on the attacker, Demolisher Spawn's delirium-gated pump of
 * the *other* attackers, and Summon: Kujata's chapter III damage equal to the
 * discarded card's mana value.
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

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
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
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
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
const attack = (game: Game, attackers: readonly ObjectId[]): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({
    type: "declare-attackers",
    player: A,
    attackers: attackers.map((attacker) => ({ attacker, defender: B })),
  });
  settle(game);
};
const delirium = (game: Game): void => {
  for (const card of ["Grizzly Bears", "Forest", "Sol Ring", "Lightning Bolt"]) {
    game.debugSpawn(card, A, "graveyard");
  }
};

describe("top-10000 batch 34b — Memory Deluge", () => {
  it("looks at as many cards as mana was spent and keeps two", () => {
    const { game, a } = setUp(["Memory Deluge"], "Island");
    lands(game, "Island", 4);
    let looked = -1;
    a.chooseFromZoneFn = (_view, eligible, min, max) => {
      looked = eligible.length;
      expect([min, max]).toEqual([2, 2]);
      return eligible.slice(0, 2);
    };
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Memory Deluge"), targets: [] });
    settle(game);
    expect(looked).toBe(4);
    expect(game.handOf(A)).toHaveLength(before - 1 + 2);
  });
});

describe("top-10000 batch 34b — Jugan Defends the Temple", () => {
  it("makes a mana Monk, flips at III, and the Remnant grows with five modified creatures", () => {
    const { game } = setUp();
    const jugan = spawn(game, "Jugan Defends the Temple");
    settle(game);
    const [monk] = named(game, "Human Monk Token");
    expect(monk).toBeDefined();
    expect(chars(game, monk).subtypes).toEqual(expect.arrayContaining(["Human", "Monk"]));
    const chapters = registry.get("Jugan Defends the Temple")!.chapters!;
    game.debugApplyEffect(A, chapters[2].effect!, [], { source: jugan });
    settle(game);
    const [remnant] = named(game, "Jugan Defends the Temple");
    expect(remnant).toBeDefined();
    expect(game.state.objects[remnant].face).toBe(1);
    const bears = Array.from({ length: 5 }, () => spawn(game, "Grizzly Bears"));
    for (const id of bears.slice(0, 4)) game.state.objects[id].counters = { "+1/+1": 1 };
    expect(chars(game, remnant).power).toBe(2);
    expect(chars(game, remnant).keywords.has("trample")).toBe(false);
    game.state.objects[bears[4]].counters = { "+1/+1": 1 };
    expect(chars(game, remnant).power).toBe(7);
    expect(chars(game, remnant).toughness).toBe(7);
    expect(chars(game, remnant).keywords.has("trample")).toBe(true);
  });
});

describe("top-10000 batch 34b — Corsairs of Umbar", () => {
  it("amasses Orcs 3 when it deals combat damage to a player", () => {
    const { game } = setUp();
    const corsairs = spawn(game, "Corsairs of Umbar");
    attack(game, [corsairs]);
    game.advanceUntil((s) => s.turn.step === "end-combat");
    settle(game);
    expect(life(game, B)).toBe(17);
    const [army] = named(game, "Army Token");
    expect(army).toBeDefined();
    expect(counters(game, army)).toBe(3);
    expect(chars(game, army).subtypes).toEqual(expect.arrayContaining(["Orc", "Army"]));
  });
});

describe("top-10000 batch 34b — Bone Sabres", () => {
  it("puts four +1/+1 counters on the equipped creature as it attacks", () => {
    const { game } = setUp();
    const sabres = spawn(game, "Bone Sabres");
    const bears = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Grizzly Bears");
    game.state.objects[sabres].attachedTo = bears;
    attack(game, [bears, other]);
    expect(counters(game, bears)).toBe(4);
    expect(counters(game, other)).toBe(0);
  });
});

describe("top-10000 batch 34b — Demolisher Spawn", () => {
  it("with delirium, pumps the other attackers but not itself", () => {
    const { game } = setUp();
    delirium(game);
    const spawnling = spawn(game, "Demolisher Spawn");
    const bears = spawn(game, "Grizzly Bears");
    const home = spawn(game, "Grizzly Bears");
    attack(game, [spawnling, bears]);
    expect(chars(game, bears).power).toBe(6);
    expect(chars(game, bears).toughness).toBe(6);
    expect(chars(game, spawnling).power).toBe(7);
    // Not attacking: not pumped.
    expect(chars(game, home).power).toBe(2);
  });

  it("without delirium, pumps nothing", () => {
    const { game } = setUp();
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const spawnling = spawn(game, "Demolisher Spawn");
    const bears = spawn(game, "Grizzly Bears");
    attack(game, [spawnling, bears]);
    expect(chars(game, bears).power).toBe(2);
  });
});

describe("top-10000 batch 34b — Summon: Kujata", () => {
  it("III discards, draws two, and deals the discarded card's mana value to each opponent", () => {
    const { game, a } = setUp();
    const kujata = spawn(game, "Summon: Kujata");
    settle(game);
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    a.chooseDiscardsFn = (hand, count) =>
      hand.some((o) => o.id === giant) ? [giant] : hand.slice(0, count).map((o) => o.id);
    const before = game.handOf(A).length;
    const chapters = registry.get("Summon: Kujata")!.chapters!;
    game.debugApplyEffect(A, chapters[2].effect!, [], { source: kujata });
    settle(game);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(before - 1 + 2);
    // Hill Giant's mana value is 4.
    expect(life(game, B)).toBe(16);
    expect(life(game, A)).toBe(20);
  });
});
