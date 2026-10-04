/**
 * Top-5000 batch 28h. No engine change: each card is existing vocabulary.
 * These pin the clause of each most likely to be wired wrong — a count read
 * from the target opponent's side (Villainous Wrath), a graveyard name count
 * plus one (Ancestral Anger), a subtype CDA and an "if you do" copy
 * (Uchuulon), land creatures only (Bumi), every graveyard (Liliana Vess),
 * the Brainstorm put-back (Brainstone) and "other Dragons" (Stormscale Scion).
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
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};
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

describe("top-5000 batch 28h — Villainous Wrath", () => {
  it("drains the target opponent by their creature count, then destroys every creature", () => {
    const { game } = setUp();
    const mine = spawn(game, "Grizzly Bears");
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Hill Giant", B), spawn(game, "Grizzly Bears", B)];
    game.debugApplyEffect(A, effectOf("Villainous Wrath"), [{ kind: "player", player: B }]);
    settle(game);
    // Three, theirs — not four (every creature) and not one (yours).
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(20);
    for (const id of [mine, ...theirs]) expect(zone(game, id)).toBe("graveyard");
  });
});

describe("top-5000 batch 28h — Ancestral Anger", () => {
  it("gives trample and +X/+0 for 1 plus the Ancestral Angers in your graveyard only, then draws", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.debugSpawn("Ancestral Anger", A, "graveyard");
    game.debugSpawn("Ancestral Anger", A, "graveyard");
    game.debugSpawn("Ancestral Anger", B, "graveyard");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Ancestral Anger"), [{ kind: "object", object: bears }]);
    settle(game);
    expect(pt(game, bears)).toEqual([5, 2]);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("trample")).toBe(true);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });
});

describe("top-5000 batch 28h — Uchuulon", () => {
  it("counts Crabs, Oozes and Horrors, and copies itself only when it exiles a card", () => {
    const { game } = setUp();
    const uchuulon = spawn(game, "Uchuulon");
    spawn(game, "Grizzly Bears");
    expect(pt(game, uchuulon)).toEqual([1, 4]);
    spawn(game, "Acidic Slime");
    expect(pt(game, uchuulon)).toEqual([2, 4]);
    const trigger = registry.get("Uchuulon")!.triggered[0].effect!;
    // No target chosen: nothing exiled, so no copy.
    game.debugApplyEffect(A, trigger, [], { source: uchuulon });
    settle(game);
    expect(named(game, "Uchuulon")).toHaveLength(1);
    const card = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugApplyEffect(A, trigger, [{ kind: "object", object: card }], { source: uchuulon });
    settle(game);
    expect(zone(game, card)).toBe("exile");
    expect(named(game, "Uchuulon")).toHaveLength(2);
    expect(pt(game, uchuulon)).toEqual([3, 4]);
  });
});

describe("top-5000 batch 28h — Bumi, Eclectic Earthbender", () => {
  it("puts two counters on each land creature you control, not on other creatures or lands", () => {
    const { game } = setUp();
    const bumi = spawn(game, "Bumi, Eclectic Earthbender");
    const forest = spawn(game, "Forest");
    const plain = spawn(game, "Forest");
    const theirs = spawn(game, "Forest", B);
    const def = registry.get("Bumi, Eclectic Earthbender")!;
    game.debugApplyEffect(A, def.triggered[0].effect!, [{ kind: "object", object: forest }], { source: bumi });
    game.debugApplyEffect(B, { kind: "earthbend", target: 0, amount: 1 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(counters(game, forest)).toBe(1);
    game.debugApplyEffect(A, def.triggered[1].effect!, [], { source: bumi });
    settle(game);
    expect(counters(game, forest)).toBe(3);
    expect(counters(game, plain)).toBe(0);
    expect(counters(game, bumi)).toBe(0);
    expect(counters(game, theirs)).toBe(1);
  });
});

describe("top-5000 batch 28h — Liliana Vess", () => {
  it("−8 puts every creature card from every graveyard onto the battlefield under your control", () => {
    const { game } = setUp();
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const theirs = game.debugSpawn("Hill Giant", B, "graveyard");
    const land = game.debugSpawn("Forest", B, "graveyard");
    game.debugApplyEffect(A, registry.get("Liliana Vess")!.activated[2].effect!, []);
    settle(game);
    expect(zone(game, mine)).toBe("battlefield");
    expect(zone(game, theirs)).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
    expect(zone(game, land)).toBe("graveyard");
  });
});

describe("top-5000 batch 28h — Brainstone", () => {
  it("draws three, then puts two cards from hand back on top", () => {
    const { game } = setUp();
    const hand = game.handOf(A).length;
    const library = game.state.zones.perPlayer[A].library.length;
    game.debugApplyEffect(A, registry.get("Brainstone")!.activated[0].effect!, []);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(game.state.zones.perPlayer[A].library).toHaveLength(library - 1);
  });
});

describe("top-5000 batch 28h — Stormscale Scion", () => {
  it("pumps other Dragons you control, not itself, not a non-Dragon", () => {
    const { game } = setUp();
    const scion = spawn(game, "Stormscale Scion");
    const shivan = spawn(game, "Shivan Dragon");
    const theirs = spawn(game, "Shivan Dragon", B);
    const bears = spawn(game, "Grizzly Bears");
    expect(pt(game, scion)).toEqual([4, 4]);
    expect(pt(game, shivan)).toEqual([6, 6]);
    expect(pt(game, theirs)).toEqual([5, 5]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});
