/**
 * Top-10000 batch 33f. Pins the clause of each new card most likely to be
 * wired wrong: Kari Zev's Ragavan entering attacking and leaving at end of
 * combat, Spectrum Sentinel's opponent's-nonbasic-land trigger, Grimgrin's
 * enters-tapped and sacrifice untap, Itzquinth's paid reflexive bite, Thorn
 * Mammoth's "this or another" fight, Oran-Rief Hydra's Forest "instead",
 * Hadana's Climb transforming at three counters (and Winged Temple's +X/+X),
 * Intelligence Bobblehead's count, and The Reaper's once-a-turn steal.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
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
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
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
const activate = (
  game: Game,
  source: ObjectId,
  abilityIndex: number,
  extra: { sacrifice?: ObjectId; targets?: TargetRef[] } = {},
): void => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets: extra.targets ?? [], ...extra });
  settle(game);
};

describe("top-10000 batch 33f — Kari Zev, Skyship Raider", () => {
  it("makes Ragavan tapped and attacking, then exiles it at end of combat", () => {
    const { game, a } = setUp();
    const kari = spawn(game, "Kari Zev, Skyship Raider");
    a.declareAttackersFn = () => [{ attacker: kari, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    const ragavan = named(game, "Ragavan");
    expect(ragavan).toHaveLength(1);
    expect(game.state.objects[ragavan[0]].tapped).toBe(true);
    expect(game.state.objects[ragavan[0]].attacking).toBe(B);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    // Kari's 1 first-strike damage and Ragavan's 2 both landed; then it left.
    expect(life(game, B)).toBe(17);
    expect(named(game, "Ragavan")).toHaveLength(0);
  });
});

describe("top-10000 batch 33f — Spectrum Sentinel", () => {
  it("gains 1 life for an opponent's nonbasic land, not a basic or your own", () => {
    const { game } = setUp();
    spawn(game, "Spectrum Sentinel");
    enter(game, "Command Tower", B);
    settle(game);
    expect(life(game, A)).toBe(21);
    enter(game, "Forest", B);
    settle(game);
    enter(game, "Command Tower", A);
    settle(game);
    expect(life(game, A)).toBe(21);
  });
});

describe("top-10000 batch 33f — Grimgrin, Corpse-Born", () => {
  it("enters tapped; sacrificing another creature untaps it and adds a counter", () => {
    const { game } = setUp();
    const grim = spawn(game, "Grimgrin, Corpse-Born");
    expect(game.state.objects[grim].tapped).toBe(true);
    const bears = spawn(game, "Grizzly Bears");
    activate(game, grim, 0, { sacrifice: bears });
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.objects[grim].tapped).toBe(false);
    expect(counters(game, grim)).toBe(1);
  });
});

describe("top-10000 batch 33f — Itzquinth, Firstborn of Gishath", () => {
  it("paying {2} has a Dinosaur deal damage equal to its power to another creature, one-sided", () => {
    const { game } = setUp();
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    const itz = enter(game, "Itzquinth, Firstborn of Gishath");
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.objects[itz].damageMarked).toBe(0);
  });
});

describe("top-10000 batch 33f — Thorn Mammoth", () => {
  it("fights when another creature you control enters", () => {
    const { game } = setUp();
    const mammoth = spawn(game, "Thorn Mammoth");
    const giant = spawn(game, "Hill Giant", B);
    enter(game, "Grizzly Bears");
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(game.state.objects[mammoth].damageMarked).toBe(3);
  });
});

describe("top-10000 batch 33f — Oran-Rief Hydra", () => {
  it("gets two counters for a Forest and one for any other land", () => {
    const { game } = setUp();
    const hydra = spawn(game, "Oran-Rief Hydra");
    enter(game, "Forest");
    settle(game);
    expect(counters(game, hydra)).toBe(2);
    enter(game, "Wastes");
    settle(game);
    expect(counters(game, hydra)).toBe(3);
  });
});

describe("top-10000 batch 33f — Hadana's Climb // Winged Temple of Orazca", () => {
  it("transforms once the creature has three counters; the Temple then doubles its power", () => {
    const { game } = setUp();
    const climb = spawn(game, "Hadana's Climb");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 2 };
    game.advanceUntil((s) => s.objects[climb].face === 1 && quiet(s));
    expect(counters(game, bears)).toBe(3);
    lands(game, "Forest", 1);
    lands(game, "Island", 1);
    lands(game, "Wastes", 1);
    activate(game, climb, 1, { targets: [{ kind: "object", object: bears }] });
    const bigger = game.characteristics(bears);
    expect(bigger.power).toBe(10);
    expect(bigger.toughness).toBe(10);
    expect(bigger.keywords.has("flying")).toBe(true);
  });

  it("doesn't transform below three counters", () => {
    const { game } = setUp();
    const climb = spawn(game, "Hadana's Climb");
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(game.state.objects[climb].face ?? 0).toBe(0);
  });
});

describe("top-10000 batch 33f — Intelligence Bobblehead", () => {
  it("draws one card per Bobblehead you control", () => {
    const { game } = setUp();
    const bobble = spawn(game, "Intelligence Bobblehead");
    spawn(game, "Intelligence Bobblehead");
    lands(game, "Wastes", 5);
    const before = game.handOf(A).length;
    activate(game, bobble, 1);
    expect(game.handOf(A).length).toBe(before + 2);
  });
});

describe("top-10000 batch 33f — The Reaper, King No More", () => {
  it("takes an opponent's creature that died with a -1/-1 counter, once a turn", () => {
    const { game } = setUp();
    spawn(game, "The Reaper, King No More");
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].counters = { "-1/-1": 1 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    const stolen = named(game, "Grizzly Bears");
    expect(stolen).toHaveLength(1);
    expect(game.state.objects[stolen[0]].controller).toBe(A);
    const giant = spawn(game, "Hill Giant", B);
    game.state.objects[giant].counters = { "-1/-1": 1 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(named(game, "Hill Giant")).toHaveLength(0);
  });
});
