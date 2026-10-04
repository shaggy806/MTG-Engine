/**
 * Top-10000 batch 34e. No engine changes: each test pins the clause of one
 * authored card most likely to be wired wrong.
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
const keywordsOf = (game: Game, id: ObjectId): ReadonlySet<string> =>
  computeCharacteristics(game.state, registry, id).keywords;

describe("top-10000 batch 34e — Pia Nalaar, Consul of Revival", () => {
  it("gives Thopters you control haste, and nothing else", () => {
    const { game } = setUp();
    spawn(game, "Pia Nalaar, Consul of Revival");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Thopter Token", count: 1 });
    settle(game);
    const [thopter] = named(game, "Thopter Token");
    expect(keywordsOf(game, thopter).has("haste")).toBe(true);
    expect(keywordsOf(game, bears).has("haste")).toBe(false);
    game.debugApplyEffect(B, { kind: "create-token", token: "Thopter Token", count: 1 });
    settle(game);
    const theirs = named(game, "Thopter Token").find((id) => game.state.objects[id].controller === B)!;
    expect(keywordsOf(game, theirs).has("haste")).toBe(false);
  });
});

describe("top-10000 batch 34e — Faerie Bladecrafter", () => {
  it("drains each opponent for its power as it last existed", () => {
    const { game } = setUp();
    const faerie = spawn(game, "Faerie Bladecrafter");
    game.state.objects[faerie].counters = { "+1/+1": 2 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: faerie }]);
    settle(game);
    expect(life(game, B)).toBe(16);
    expect(life(game, A)).toBe(24);
  });
});

describe("top-10000 batch 34e — Forerunner of the Legion", () => {
  it("puts the Vampire card it finds on top of the library", () => {
    const { game } = setUp();
    const vampire = game.debugSpawn("Bloodghast", A, "library");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Wastes", A, "library");
    expect(game.libraryOf(A)[0]).not.toBe(vampire);
    game.debugSpawn("Forerunner of the Legion", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.libraryOf(A)[0]).toBe(vampire);
  });
});

describe("top-10000 batch 34e — Kamahl's Druidic Vow", () => {
  it("offers lands and legendary permanents of mana value X or less, and bins the rest", () => {
    const { game, a } = setUp(["Kamahl's Druidic Vow"], "Forest");
    lands(game, "Forest", 5);
    spawn(game, "Arbaaz Mir");
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const kokusho = game.debugSpawn("Kokusho, the Evening Star", A, "library");
    const thalia = game.debugSpawn("Thalia, Guardian of Thraben", A, "library");
    const forest = game.debugSpawn("Forest", A, "library");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible;
    };
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Kamahl's Druidic Vow"),
      targets: [],
      xValue: 3,
    });
    settle(game);
    expect([...offered].sort()).toEqual([forest, thalia].sort());
    expect(zone(game, forest)).toBe("battlefield");
    expect(zone(game, thalia)).toBe("battlefield");
    expect(zone(game, kokusho)).toBe("graveyard");
    expect(zone(game, giant)).toBe("library");
  });

  it("can't be cast without a legendary creature or planeswalker", () => {
    const { game } = setUp(["Kamahl's Druidic Vow"], "Forest");
    lands(game, "Forest", 5);
    const vow = inHand(game, "Kamahl's Druidic Vow");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === vow)).toBe(false);
  });
});

describe("top-10000 batch 34e — Mona Lisa, Science Geek", () => {
  it("adds mana of one color equal to its power", () => {
    const { game } = setUp();
    const mona = spawn(game, "Mona Lisa, Science Geek");
    game.state.objects[mona].counters = { "+1/+1": 2 };
    game.dispatch({ type: "activate-ability", player: A, source: mona, abilityIndex: 0, manaColors: ["G", "G", "G"] });
    expect(pool(game)).toEqual(["G", "G", "G"]);
  });
});

describe("top-10000 batch 34e — Shield-Wall Sentinel", () => {
  it("finds only a creature card with defender", () => {
    const { game, a } = setUp();
    const bank = game.debugSpawn("Fog Bank", A, "library");
    game.debugSpawn("Grizzly Bears", A, "library");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible.slice(0, 1);
    };
    game.debugSpawn("Shield-Wall Sentinel", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(offered).toEqual([bank]);
    expect(zone(game, bank)).toBe("hand");
  });
});

describe("top-10000 batch 34e — Fateful Absence", () => {
  it("destroys the creature and its controller gets the Clue", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effectOf("Fateful Absence"), [{ kind: "object", object: bears }]);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    const clues = named(game, "Clue Token");
    expect(clues).toHaveLength(1);
    expect(game.state.objects[clues[0]].controller).toBe(B);
  });
});

describe("top-10000 batch 34e — Crystal Shard", () => {
  it("bounces a creature whose controller can't pay {1}, for either cost", () => {
    const { game } = setUp();
    const shard = spawn(game, "Crystal Shard");
    spawn(game, "Island");
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: shard,
      abilityIndex: 1,
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    expect(zone(game, bears)).toBe("hand");
  });
});

describe("top-10000 batch 34e — Go-Shintai of Lost Wisdom", () => {
  it("mills the target player one card per Shrine you control", () => {
    const { game } = setUp();
    const shintai = spawn(game, "Go-Shintai of Lost Wisdom");
    spawn(game, "Go-Shintai of Ancient Wars");
    const end = registry.get("Go-Shintai of Lost Wisdom")!.triggered[0].effect!;
    const mill = (end as Extract<EffectSpec, { kind: "may" }>).effect as Extract<
      EffectSpec,
      { kind: "reflexive-trigger" }
    >;
    const before = game.libraryOf(B).length;
    game.debugApplyEffect(A, mill.effect, [{ kind: "player", player: B }], { source: shintai });
    settle(game);
    expect(game.libraryOf(B)).toHaveLength(before - 2);
  });
});

describe("top-10000 batch 34e — Sunderflock", () => {
  it("costs less by the greatest Elemental mana value, and bounces non-Elementals when cast", () => {
    const { game } = setUp(["Sunderflock"], "Island");
    lands(game, "Island", 2);
    const flock = inHand(game, "Sunderflock");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === flock);
    expect(castable()).toBe(false);
    const other = spawn(game, "Sunderflock");
    expect(castable()).toBe(true);
    const bears = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: flock, targets: [] });
    settle(game);
    expect(zone(game, flock)).toBe("battlefield");
    expect(zone(game, other)).toBe("battlefield");
    expect(zone(game, bears)).toBe("hand");
  });
});

describe("top-10000 batch 34e — Hidden Blade", () => {
  it("attaches as it enters, and an Assassin gains deathtouch", () => {
    const { game } = setUp();
    const assassin = spawn(game, "Hired Blade");
    const blade = game.debugSpawn("Hidden Blade", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[blade].attachedTo).toBe(assassin);
    const c = computeCharacteristics(game.state, registry, assassin);
    expect(c.power).toBe(4);
    expect(c.keywords.has("first-strike")).toBe(true);
    expect(c.keywords.has("deathtouch")).toBe(true);
  });

  it("gives a non-Assassin no deathtouch", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.debugSpawn("Hidden Blade", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(keywordsOf(game, bears).has("first-strike")).toBe(true);
    expect(keywordsOf(game, bears).has("deathtouch")).toBe(false);
  });
});

describe("top-10000 batch 34e — Glimmer of Genius", () => {
  it("scries, draws two and gives two energy", () => {
    const { game } = setUp();
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Glimmer of Genius"));
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 2);
    expect(game.state.players[A].energy).toBe(2);
  });
});
