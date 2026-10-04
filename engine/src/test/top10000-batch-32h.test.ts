/**
 * Top-10000 batch 32h. Pins the clauses most likely to be wired wrong:
 * Pernicious Deed's X against mana value and card type, Nylea's
 * Intervention's twice X to fliers only, Telling Time's three destinations,
 * Monstrosity of the Lake's paid tap-and-stun, Go-Shintai of Ancient Wars'
 * reflexive Shrine count, Sage of the Maze's X/X Citizen, Soulstone
 * Sanctuary's lasting animation, Molten Primordial's steal and Wargate's
 * mana value cap.
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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
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
const def = (name: string) => registry.get(name)!;

describe("top-10000 batch 32h — Pernicious Deed", () => {
  it("destroys artifacts, creatures and enchantments of mana value X or less, never lands", () => {
    const { game } = setUp();
    const deed = spawn(game, "Pernicious Deed");
    const ring = spawn(game, "Sol Ring");
    const bears = spawn(game, "Grizzly Bears", B);
    const agent = spawn(game, "Agent of the Iron Throne", B);
    const giant = spawn(game, "Hill Giant", B);
    const forest = spawn(game, "Forest", B);
    game.debugApplyEffect(A, def("Pernicious Deed").activated[0].effect!, [], { source: deed, x: 3 });
    settle(game);
    expect(zone(game, ring)).toBe("graveyard");
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, agent)).toBe("graveyard");
    expect(zone(game, giant)).toBe("battlefield");
    expect(zone(game, forest)).toBe("battlefield");
  });
});

describe("top-10000 batch 32h — Nylea's Intervention", () => {
  it("deals twice X to each creature with flying and none to the rest", () => {
    const { game } = setUp();
    const angel = spawn(game, "Serra Angel", B);
    const giant = spawn(game, "Hill Giant", B);
    const mode = def("Nylea's Intervention").castModal!.modes[1].effect as EffectSpec;
    game.debugApplyEffect(A, mode, [], { x: 1 });
    expect(game.state.objects[angel].damageMarked).toBe(2);
    expect(game.state.objects[giant].damageMarked).toBe(0);
  });
});

describe("top-10000 batch 32h — Telling Time", () => {
  it("puts one of the top three into hand, one on top and one on the bottom", () => {
    const { game } = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const elves = game.debugSpawn("Llanowar Elves", A, "library");
    const three = [elves, bears, giant];
    game.debugApplyEffect(A, def("Telling Time").effect!, []);
    settle(game);
    const toHand = three.filter((id) => game.handOf(A).includes(id));
    expect(toHand).toHaveLength(1);
    const library = game.libraryOf(A);
    const top = library[0];
    const bottom = library.at(-1)!;
    expect(three).toContain(top);
    expect(three).toContain(bottom);
    expect(new Set([toHand[0], top, bottom]).size).toBe(3);
  });
});

describe("top-10000 batch 32h — Monstrosity of the Lake", () => {
  it("for {5}, taps every opposing creature and stuns each, leaving yours alone", () => {
    const { game } = setUp();
    const monster = spawn(game, "Monstrosity of the Lake");
    const islands = lands(game, "Island", 5);
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves");
    game.debugApplyEffect(A, def("Monstrosity of the Lake").triggered[0].effect!, [], { source: monster });
    settle(game);
    expect(islands.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(counters(game, bears, "stun")).toBe(1);
    expect(game.state.objects[elves].tapped).toBe(false);
    expect(counters(game, elves, "stun")).toBe(0);
  });
});

describe("top-10000 batch 32h — Go-Shintai of Ancient Wars", () => {
  it("for {1}, deals damage equal to the Shrines you control to the target player", () => {
    const { game, a } = setUp();
    const shintai = spawn(game, "Go-Shintai of Ancient Wars");
    spawn(game, "Go-Shintai of Life's Origin");
    spawn(game, "Mountain");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    game.debugApplyEffect(A, def("Go-Shintai of Ancient Wars").triggered[0].effect!, [], { source: shintai });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-10000 batch 32h — Sage of the Maze", () => {
  it("makes a land an X/X Citizen with haste, X twice the Gates you control", () => {
    const { game } = setUp();
    const sage = spawn(game, "Sage of the Maze");
    lands(game, "Azorius Guildgate", 2);
    const forest = spawn(game, "Forest");
    game.debugApplyEffect(A, def("Sage of the Maze").activated[1].effect!, [{ kind: "object", object: forest }], {
      source: sage,
    });
    const c = computeCharacteristics(game.state, registry, forest);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect(c.subtypes).toContain("Citizen");
    expect(c.subtypes).toContain("Forest");
    expect(c.keywords.has("haste")).toBe(true);
  });
});

describe("top-10000 batch 32h — Soulstone Sanctuary", () => {
  it("becomes a 3/3 vigilant creature land that is still one next turn", () => {
    const { game } = setUp();
    const sanctuary = spawn(game, "Soulstone Sanctuary");
    game.debugApplyEffect(A, def("Soulstone Sanctuary").activated[1].effect!, [], { source: sanctuary });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const c = computeCharacteristics(game.state, registry, sanctuary);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("land");
    expect(c.keywords.has("vigilance")).toBe(true);
  });
});

describe("top-10000 batch 32h — Molten Primordial", () => {
  it("steals the chosen creature, untapped and hasty, until end of turn", () => {
    const { game } = setUp();
    const primordial = spawn(game, "Molten Primordial");
    const giant = spawn(game, "Hill Giant", B);
    game.state.objects[giant].tapped = true;
    game.debugApplyEffect(A, def("Molten Primordial").triggered[0].effect!, [{ kind: "object", object: giant }], {
      source: primordial,
    });
    settle(game);
    expect(game.state.objects[giant].controller).toBe(A);
    expect(game.state.objects[giant].tapped).toBe(false);
    expect(computeCharacteristics(game.state, registry, giant).keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[giant].controller).toBe(B);
  });
});

describe("top-10000 batch 32h — Wargate", () => {
  it("offers only permanent cards of mana value X or less", () => {
    const { game, a } = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return eligible.filter((id) => id === bears);
    };
    game.debugApplyEffect(A, def("Wargate").effect!, [], { x: 2 });
    settle(game);
    expect(offered).toContain(bears);
    expect(offered).not.toContain(giant);
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, giant)).toBe("library");
  });
});
