/**
 * Top-10000 batch 33b. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — an Aura's "if it was historic" leave
 * trigger (Curator's Ward), a threaten that grants myriad (Firbolg Flutist),
 * "this or another artifact" plus a transform that counts itself (Dowsing
 * Device), a per-card mill drain (Dreadhound), "one or more" leaving a
 * graveyard as one trigger (Skeleton Crew), an optional graveyard target
 * beside amass (Treason of Isengard), a Background's grants to commanders
 * only (Cultist of the Absolute), a reflexive mill off the discarded card's
 * mana value (The Ancient One), devotion counting (Reverent Hoplite) and a
 * morbid end-step trigger (Reaper from the Abyss).
 */
import { describe, expect, it } from "vitest";

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

const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const libraryOf = (game: Game, player: PlayerId): readonly ObjectId[] => game.state.zones.perPlayer[player].library;
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
const obj = (object: ObjectId) => ({ kind: "object", object }) as const;
const destroy: EffectSpec = { kind: "destroy", target: 0 };

describe("top-10000 batch 33b — Curator's Ward", () => {
  it("draws two when a historic host leaves, and nothing for a non-historic one", () => {
    const { game } = setUp();
    const stone = spawn(game, "Mind Stone");
    const ward = spawn(game, "Curator's Ward");
    game.state.objects[ward].attachedTo = stone;
    expect(game.characteristics(stone).keywords.has("hexproof")).toBe(true);
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, destroy, [obj(stone)]);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 2);

    const bears = spawn(game, "Grizzly Bears");
    const ward2 = spawn(game, "Curator's Ward");
    game.state.objects[ward2].attachedTo = bears;
    const after = game.handOf(A).length;
    game.debugApplyEffect(A, destroy, [obj(bears)]);
    settle(game);
    expect(game.handOf(A).length).toBe(after);
  });
});

describe("top-10000 batch 33b — Firbolg Flutist", () => {
  it("steals, untaps and gives haste to an opponent's creature", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true, summoningSick: false });
    enter(game, "Firbolg Flutist");
    settle(game);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.characteristics(bears).keywords.has("haste")).toBe(true);
  });
});

describe("top-10000 batch 33b — Dowsing Device", () => {
  it("triggers on itself and on another artifact, and transforms at four artifacts counting itself", () => {
    const { game } = setUp();
    spawn(game, "Mind Stone");
    spawn(game, "Mind Stone");
    const device = enter(game, "Dowsing Device");
    settle(game);
    // Three artifacts: no transform.
    expect(game.characteristics(device).types).toEqual(["artifact"]);
    enter(game, "Sol Ring");
    settle(game);
    expect(game.characteristics(device).types).toEqual(["land"]);
  });
});

describe("top-10000 batch 33b — Dreadhound", () => {
  it("drains for each creature card milled, not for the rest", () => {
    // Eight cards to the opening hand and first draw, then Bears, Wastes, Giant.
    const { game } = setUp([...Array<string>(8).fill("Wastes"), "Grizzly Bears", "Wastes", "Hill Giant"]);
    const start = life(game, B);
    enter(game, "Dreadhound");
    settle(game);
    expect(life(game, B)).toBe(start - 2);
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, destroy, [obj(bears)]);
    settle(game);
    expect(life(game, B)).toBe(start - 3);
  });
});

describe("top-10000 batch 33b — Skeleton Crew", () => {
  it("makes one token for creature cards leaving together, and pumps other Skeletons and Pirates", () => {
    const { game } = setUp();
    const crew = spawn(game, "Skeleton Crew");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(
      A,
      { kind: "return-from-graveyard", filter: { type: "creature" }, destination: "hand", count: "all" },
      [],
      { source: crew },
    );
    settle(game);
    const tokens = named(game, "Skeleton Pirate Token");
    expect(tokens).toHaveLength(1);
    expect(game.characteristics(tokens[0]).power).toBe(3);
    expect(game.characteristics(crew).power).toBe(3);
  });
});

describe("top-10000 batch 33b — Treason of Isengard", () => {
  it("puts the instant on top of the library and amasses Orcs 2", () => {
    const { game } = setUp();
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const def = registry.get("Treason of Isengard")!;
    game.debugApplyEffect(A, def.effect!, [obj(bolt)]);
    settle(game);
    expect(libraryOf(game, A)[0]).toBe(bolt);
    const army = game.battlefield.filter((id) => game.characteristics(id).subtypes.includes("Army"));
    expect(army).toHaveLength(1);
    expect(game.characteristics(army[0]).subtypes).toContain("Orc");
    expect(game.characteristics(army[0]).power).toBe(2);
  });
});

describe("top-10000 batch 33b — Cultist of the Absolute", () => {
  it("pumps and grants only commander creatures its controller owns", () => {
    const { game } = setUp();
    spawn(game, "Cultist of the Absolute");
    const mine = spawn(game, "Grizzly Bears");
    game.state.objects[mine].isCommander = true;
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].isCommander = true;
    const plain = spawn(game, "Grizzly Bears");
    const c = game.characteristics(mine);
    expect([c.power, c.toughness]).toEqual([5, 5]);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.keywords.has("deathtouch")).toBe(true);
    expect(game.characteristics(theirs).power).toBe(2);
    expect(game.characteristics(plain).power).toBe(2);
  });
});

describe("top-10000 batch 33b — The Ancient One", () => {
  it("mills the target player cards equal to the discarded card's mana value", () => {
    const { game, a } = setUp(["Hill Giant"]);
    const one = spawn(game, "The Ancient One");
    a.chooseDiscardsFn = (hand) => [hand.find((o) => o.cardName === "Hill Giant")!.id];
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const before = libraryOf(game, B).length;
    game.debugApplyEffect(A, registry.get("The Ancient One")!.activated[0].effect!, [], { source: one });
    settle(game);
    expect(libraryOf(game, B).length).toBe(before - 4);
  });
});

describe("top-10000 batch 33b — Reverent Hoplite", () => {
  it("makes tokens equal to devotion to white, counting itself", () => {
    const { game } = setUp();
    spawn(game, "Savannah Lions");
    enter(game, "Reverent Hoplite");
    settle(game);
    // Hoplite's {W} and the Lions' {W}.
    expect(named(game, "Human Soldier Token")).toHaveLength(2);
  });
});

describe("top-10000 batch 33b — Reaper from the Abyss", () => {
  it("destroys a non-Demon at the end step only if a creature died this turn", () => {
    const { game, a } = setUp();
    spawn(game, "Reaper from the Abyss");
    const bears = spawn(game, "Grizzly Bears", B);
    a.chooseTargetsFn = () => [obj(bears)];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(zone(game, bears)).toBe("battlefield");
    const victim = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(B, destroy, [obj(victim)]);
    settle(game);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(zone(game, bears)).toBe("graveyard");
  });
});
