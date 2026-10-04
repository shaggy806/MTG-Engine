/**
 * Top-5000 batch 22d. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — Lagomos's "five or more creatures died
 * this turn" (any player's), Splash Portal's draw read off the returned
 * creature, Mirrorworks' optional {2}, Piper of the Swarm's three-Rat cost,
 * Elvish Champion reaching every player's Elves but itself, Gimli's
 * "another legendary", Bothersome Quasit's goaded-blocker restriction,
 * Reshape's X bound, Elvish Piper and Stonybrook Banneret.
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
  game.battlefield.filter((id) => (game.state.objects[id].copyOf ?? game.state.objects[id].cardName) === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
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
const canActivate = (game: Game, source: ObjectId, abilityIndex: number): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === abilityIndex);

describe("top-5000 batch 22d — Lagomos, Hand of Hatred", () => {
  it("tutors only once five creatures have died this turn, whoever controlled them", () => {
    const { game } = setUp();
    const lagomos = spawn(game, "Lagomos, Hand of Hatred");
    const victims = [
      spawn(game, "Grizzly Bears", B),
      spawn(game, "Grizzly Bears", B),
      spawn(game, "Grizzly Bears", B),
      spawn(game, "Llanowar Elves", B),
      spawn(game, "Llanowar Elves", A),
    ];
    for (const id of victims.slice(0, 4)) {
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
      settle(game);
    }
    expect(canActivate(game, lagomos, 0)).toBe(false);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: victims[4] }]);
    settle(game);
    expect(canActivate(game, lagomos, 0)).toBe(true);
  });
});

describe("top-5000 batch 22d — Splash Portal", () => {
  it("draws for a Rat that comes back, not for a Bear", () => {
    const { game } = setUp();
    const rat = spawn(game, "Blightbelly Rat");
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Splash Portal"), [{ kind: "object", object: rat }]);
    settle(game);
    expect(named(game, "Blightbelly Rat")).toHaveLength(1);
    expect(game.handOf(A).length).toBe(before + 1);

    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Splash Portal"), [{ kind: "object", object: bears }]);
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    expect(game.handOf(A).length).toBe(before + 1);
  });
});

describe("top-5000 batch 22d — Mirrorworks", () => {
  it("pays {2} for a token copy of another nontoken artifact entering", () => {
    const { game } = setUp(["Ornithopter"]);
    spawn(game, "Mirrorworks");
    lands(game, "Wastes", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    settle(game);
    const thopters = named(game, "Ornithopter");
    expect(thopters).toHaveLength(2);
    expect(thopters.filter((id) => game.state.objects[id].isToken === true)).toHaveLength(1);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Wastes" && game.state.objects[id].tapped)).toHaveLength(2);
  });
});

describe("top-5000 batch 22d — Piper of the Swarm", () => {
  it("gives Rats menace and steals a creature for three of them", () => {
    const { game } = setUp();
    const piper = spawn(game, "Piper of the Swarm");
    lands(game, "Swamp", 4);
    game.debugApplyEffect(A, { kind: "create-token", token: "Rat Token", count: 3 }, []);
    settle(game);
    const rat = named(game, "Rat Token")[0];
    expect(computeCharacteristics(game.state, registry, rat).keywords.has("menace")).toBe(true);
    expect(computeCharacteristics(game.state, registry, piper).keywords.has("menace")).toBe(false);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: piper,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(named(game, "Rat Token")).toHaveLength(0);
    expect(game.state.objects[bears].controller).toBe(A);
  });
});

describe("top-5000 batch 22d — Elvish Champion", () => {
  it("pumps every player's other Elves and gives them forestwalk, but not itself", () => {
    const { game } = setUp();
    const champion = spawn(game, "Elvish Champion");
    const theirs = spawn(game, "Llanowar Elves", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const elf = computeCharacteristics(game.state, registry, theirs);
    expect([elf.power, elf.toughness]).toEqual([2, 2]);
    expect(elf.keywords.has("forestwalk")).toBe(true);
    const self = computeCharacteristics(game.state, registry, champion);
    expect([self.power, self.toughness]).toEqual([2, 2]);
    expect(self.keywords.has("forestwalk")).toBe(false);
    expect(computeCharacteristics(game.state, registry, bears).power).toBe(2);
  });
});

describe("top-5000 batch 22d — Gimli of the Glittering Caves", () => {
  it("grows for another legendary creature entering, not a nonlegendary one", () => {
    const { game } = setUp();
    const gimli = spawn(game, "Gimli of the Glittering Caves");
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, gimli)).toBe(0);
    game.debugSpawn("Isamaru, Hound of Konda", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, gimli)).toBe(1);
  });
});

describe("top-5000 batch 22d — Bothersome Quasit", () => {
  it("stops an opponent's goaded creature from blocking, not an ungoaded one", () => {
    const { game } = setUp();
    spawn(game, "Bothersome Quasit");
    const goaded = spawn(game, "Grizzly Bears", B);
    const free = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "goad", target: 0 }, [{ kind: "object", object: goaded }]);
    settle(game);
    expect(computeCharacteristics(game.state, registry, goaded).restrictions.has("cant-block")).toBe(true);
    expect(computeCharacteristics(game.state, registry, free).restrictions.has("cant-block")).toBe(false);
  });
});

describe("top-5000 batch 22d — Reshape", () => {
  const run = (x: number): Game => {
    const { game } = setUp(["Reshape"], "Mind Stone");
    lands(game, "Island", 2 + x);
    const ring = spawn(game, "Ornithopter");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Reshape"), targets: [], xValue: x, sacrifice: ring });
    expect(zone(game, ring)).toBe("graveyard");
    settle(game);
    return game;
  };
  it("finds an artifact of mana value X or less, and nothing above it", () => {
    expect(named(run(1), "Mind Stone")).toHaveLength(0);
    expect(named(run(2), "Mind Stone")).toHaveLength(1);
  });
});

describe("top-5000 batch 22d — Elvish Piper", () => {
  it("puts a creature card from hand onto the battlefield", () => {
    const { game } = setUp(["Grizzly Bears"]);
    const piper = spawn(game, "Elvish Piper");
    spawn(game, "Forest");
    const bears = inHand(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: piper, abilityIndex: 0 });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("top-5000 batch 22d — Stonybrook Banneret", () => {
  it("takes {1} off a Merfolk or Wizard spell", () => {
    const { game } = setUp(["Stonybrook Banneret"]);
    spawn(game, "Island");
    const card = inHand(game, "Stonybrook Banneret");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);
    expect(castable()).toBe(false);
    spawn(game, "Stonybrook Banneret");
    expect(castable()).toBe(true);
  });
});
