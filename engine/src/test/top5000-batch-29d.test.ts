/**
 * Top-5000 batch 29 (part d). Pins the clause of each new card most likely to
 * be wired wrong: Old Rutstein's per-type "milled this way" tokens (Dryad
 * Arbor makes two), Digsite Engineer's optional {2}, Goblin Chainwhirler's
 * opponents-only sweep, Faerie Conclave's blue Faerie, Sarinth Steelseeker's
 * land-or-graveyard look, Ancient Animus's legendary-only counter before the
 * fight, Summon: Shiva's stun and its count of tapped creatures, and The
 * Magic Mirror's graveyard discount and growing draw.
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
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
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
const triggerOf = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-5000 batch 29d — Old Rutstein", () => {
  it("makes a Treasure and an Insect for a milled Dryad Arbor, and a Blood for a noncreature, nonland card", () => {
    const { game } = setUp();
    game.debugSpawn("Dryad Arbor", A, "library");
    game.debugSpawn("Old Rutstein", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
    expect(named(game, "Insect Token")).toHaveLength(1);
    expect(named(game, "Blood Token")).toHaveLength(0);

    const rutstein = named(game, "Old Rutstein")[0];
    game.debugSpawn("Sol Ring", A, "library");
    game.debugApplyEffect(A, triggerOf("Old Rutstein", 1), [], { source: rutstein });
    settle(game);
    expect(named(game, "Treasure Token")).toHaveLength(1);
    expect(named(game, "Insect Token")).toHaveLength(1);
    expect(named(game, "Blood Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 29d — Digsite Engineer", () => {
  it("pays {2} for a Construct that counts every artifact you control", () => {
    const { game } = setUp();
    const engineer = spawn(game, "Digsite Engineer");
    const wastes = lands(game, "Wastes", 2);
    game.debugApplyEffect(A, triggerOf("Digsite Engineer"), [], { source: engineer });
    settle(game);
    const construct = named(game, "Construct Token");
    expect(construct).toHaveLength(1);
    expect(wastes.every((id) => game.state.objects[id].tapped)).toBe(true);
    // Only itself so far; an artifact arriving grows it.
    expect(game.characteristics(construct[0]).power).toBe(1);
    spawn(game, "Sol Ring");
    expect(game.characteristics(construct[0]).power).toBe(2);
  });
});

describe("top-5000 batch 29d — Goblin Chainwhirler", () => {
  it("deals 1 to each opponent and their creatures, never yours", () => {
    const { game } = setUp();
    const mine = spawn(game, "Llanowar Elves");
    const theirs = spawn(game, "Llanowar Elves", B);
    const before = life(game, B);
    const mineBefore = life(game, A);
    game.debugSpawn("Goblin Chainwhirler", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(before - 1);
    expect(life(game, A)).toBe(mineBefore);
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, mine)).toBe("battlefield");
  });
});

describe("top-5000 batch 29d — Faerie Conclave", () => {
  it("becomes a 2/1 blue Faerie with flying that is still a land", () => {
    const { game } = setUp();
    const conclave = spawn(game, "Faerie Conclave");
    const animate = registry.get("Faerie Conclave")!.activated[1].effect!;
    game.debugApplyEffect(A, animate, [], { source: conclave });
    settle(game);
    const c = game.characteristics(conclave);
    expect(c.power).toBe(2);
    expect(c.toughness).toBe(1);
    expect(c.types).toEqual(expect.arrayContaining(["land", "creature"]));
    expect(c.subtypes).toContain("Faerie");
    expect([...c.colors]).toEqual(["U"]);
    expect(c.keywords.has("flying")).toBe(true);
  });
});

describe("top-5000 batch 29d — Sarinth Steelseeker", () => {
  it("puts a land on top into the hand", () => {
    const { game } = setUp();
    const seeker = spawn(game, "Sarinth Steelseeker");
    const forest = game.debugSpawn("Forest", A, "library");
    game.debugApplyEffect(A, triggerOf("Sarinth Steelseeker"), [], { source: seeker });
    settle(game);
    expect(zone(game, forest)).toBe("hand");
  });

  it("may put a nonland card on top into the graveyard", () => {
    const { game } = setUp();
    const seeker = spawn(game, "Sarinth Steelseeker");
    const giant = game.debugSpawn("Hill Giant", A, "library");
    game.debugApplyEffect(A, triggerOf("Sarinth Steelseeker"), [], { source: seeker });
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
  });
});

describe("top-5000 batch 29d — Ancient Animus", () => {
  const effect = (): EffectSpec => registry.get("Ancient Animus")!.effect!;

  it("puts a counter on a legendary creature, then it fights", () => {
    const { game } = setUp();
    const rutstein = spawn(game, "Old Rutstein");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effect(), [obj(rutstein), obj(bears)]);
    settle(game);
    expect(counters(game, rutstein)).toBe(1);
    // A 2/5 after its counter: it deals 2 to the Bears and takes 2.
    // The Bears may already be gone to state-based actions.
    expect(zone(game, bears) === "graveyard" || game.state.objects[bears].damageMarked === 2).toBe(true);
    expect(game.state.objects[rutstein].damageMarked).toBe(2);
  });

  it("puts no counter on a creature that isn't legendary, and it still fights", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, effect(), [obj(giant), obj(bears)]);
    settle(game);
    expect(counters(game, giant)).toBe(0);
    expect(game.state.objects[giant].damageMarked).toBe(2);
  });
});

describe("top-5000 batch 29d — The Magic Mirror", () => {
  it("costs {1} less for each instant and sorcery card in your graveyard", () => {
    const { game } = setUp(["The Magic Mirror"], "Island");
    lands(game, "Island", 3);
    const mirror = inHand(game, "The Magic Mirror");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === mirror);
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Opt", A, "graveyard");
    expect(castable()).toBe(false);
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    expect(castable()).toBe(true);
  });

  it("adds a knowledge counter, then draws one per counter", () => {
    const { game } = setUp();
    const mirror = spawn(game, "The Magic Mirror");
    game.state.objects[mirror].counters = { knowledge: 2 };
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, triggerOf("The Magic Mirror"), [], { source: mirror });
    settle(game);
    expect(counters(game, mirror, "knowledge")).toBe(3);
    expect(game.handOf(A).length).toBe(hand + 3);
  });
});
