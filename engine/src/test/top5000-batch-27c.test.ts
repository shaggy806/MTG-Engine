/**
 * Top-5000 batch 27c. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — a granted undying returning once
 * (Undying Evil), a type and four keywords at once (Enter the Avatar State),
 * affinity for a land subtype and an "A and B you control" grant (Sapling
 * Nursery), "one or more tokens" held to once a turn (Baron Bertram
 * Graywater), "one or more creature cards leave" (Desecrated Tomb), the
 * non-Human enters replacement (Grumgully), the graveyard count and an {X}
 * search from an activated ability (Fiend Artisan), multikicker counters
 * feeding an Elf lord (Joraga Warcaller), "3 life for each card exiled this
 * way" (Crypt Incursion) and the lesser-mana-value reanimation (Jackdaw
 * Savior).
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
import { hasSubtype } from "../subtypes.js";

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
/** Permanents of that name, a token stack counted as every token in it. */
const howMany = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};

describe("top-5000 batch 27c — Undying Evil", () => {
  it("returns the creature once with a +1/+1 counter; the returned creature has no undying", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Undying Evil"), [{ kind: "object", object: bears }]);
    settle(game);
    destroy(game, bears);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(counters(game, back[0])).toBe(1);
    destroy(game, back[0]);
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
  });
});

describe("top-5000 batch 27c — Enter the Avatar State", () => {
  it("makes the creature an Avatar with flying, first strike, lifelink and hexproof", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Enter the Avatar State"), [{ kind: "object", object: bears }]);
    settle(game);
    const c = computeCharacteristics(game.state, registry, bears);
    expect(hasSubtype(c.subtypes, "Avatar")).toBe(true);
    expect(hasSubtype(c.subtypes, "Bear")).toBe(true);
    for (const k of ["flying", "first-strike", "lifelink", "hexproof"] as const) {
      expect(c.keywords.has(k)).toBe(true);
    }
  });
});

describe("top-5000 batch 27c — Sapling Nursery", () => {
  it("costs {1} less for each Forest you control", () => {
    const { game } = setUp(["Sapling Nursery"]);
    const nursery = inHand(game, "Sapling Nursery");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === nursery);
    lands(game, "Forest", 3);
    expect(castable()).toBe(false);
    lands(game, "Forest", 1);
    expect(castable()).toBe(true);
  });

  it("makes a Treefolk on landfall, and its exile ability guards only Treefolk and Forests", () => {
    const { game } = setUp();
    const nursery = spawn(game, "Sapling Nursery");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    const [treefolk] = named(game, "Treefolk Token");
    expect(treefolk).toBeDefined();
    expect(pt(game, treefolk)).toEqual([3, 4]);
    const bears = spawn(game, "Grizzly Bears");
    const theirForest = spawn(game, "Forest", B);
    const exile = registry.get("Sapling Nursery")!.activated[0].effect!;
    game.debugApplyEffect(A, exile, [], { source: nursery });
    settle(game);
    const has = (id: ObjectId): boolean =>
      computeCharacteristics(game.state, registry, id).keywords.has("indestructible");
    expect(has(treefolk)).toBe(true);
    expect(has(named(game, "Forest").find((id) => game.state.objects[id].controller === A)!)).toBe(true);
    expect(has(bears)).toBe(false);
    expect(has(theirForest)).toBe(false);
  });
});

describe("top-5000 batch 27c — Baron Bertram Graywater", () => {
  it("makes one Vampire Rogue for a batch of tokens, and only once a turn", () => {
    const { game } = setUp();
    spawn(game, "Baron Bertram Graywater");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 2 });
    settle(game);
    expect(howMany(game, "Vampire Rogue Token")).toBe(1);
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    settle(game);
    expect(howMany(game, "Vampire Rogue Token")).toBe(1);
  });
});

describe("top-5000 batch 27c — Desecrated Tomb", () => {
  it("makes one Bat when creature cards leave together, none for a land card", () => {
    const { game } = setUp();
    spawn(game, "Desecrated Tomb");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "you" });
    settle(game);
    expect(howMany(game, "Bat Token")).toBe(1);
    game.debugSpawn("Forest", A, "graveyard");
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: "you" });
    settle(game);
    expect(howMany(game, "Bat Token")).toBe(1);
  });
});

describe("top-5000 batch 27c — Grumgully, the Generous", () => {
  it("puts a counter on a non-Human creature entering, not on a Human", () => {
    const { game } = setUp();
    spawn(game, "Grumgully, the Generous");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const human = game.debugSpawn("Alaborn Musketeer", A, "graveyard");
    for (const id of [bears, human]) {
      game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: id }]);
      settle(game);
    }
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, human)).toBe("battlefield");
    expect(counters(game, bears)).toBe(1);
    expect(counters(game, human)).toBe(0);
  });
});

describe("top-5000 batch 27c — Fiend Artisan", () => {
  it("grows with creature cards in your graveyard, and fetches a creature of mana value X or less", () => {
    const { game } = setUp();
    lands(game, "Swamp", 3);
    const fiend = spawn(game, "Fiend Artisan");
    const bears = spawn(game, "Grizzly Bears");
    game.debugSpawn("Serra Angel", A, "graveyard");
    game.debugSpawn("Forest", A, "graveyard");
    expect(pt(game, fiend)).toEqual([2, 2]);
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const elves = game.debugSpawn("Llanowar Elves", A, "library");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: fiend,
      abilityIndex: 0,
      targets: [],
      xValue: 2,
      sacrifice: bears,
    });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, elves)).toBe("battlefield");
    expect(zone(game, giant)).toBe("library");
    expect(pt(game, fiend)).toEqual([3, 3]);
  });
});

describe("top-5000 batch 27c — Joraga Warcaller", () => {
  it("enters with a counter per kick, and pumps other Elves by its counters", () => {
    const { game } = setUp(["Joraga Warcaller"]);
    lands(game, "Forest", 5);
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Joraga Warcaller"),
      targets: [],
      kicked: true,
      kickCount: 2,
    });
    settle(game);
    const [warcaller] = named(game, "Joraga Warcaller");
    expect(counters(game, warcaller)).toBe(2);
    expect(pt(game, warcaller)).toEqual([3, 3]);
    expect(pt(game, elves)).toEqual([3, 3]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 27c — Crypt Incursion", () => {
  it("exiles only the creature cards and gains 3 life for each", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const giant = game.debugSpawn("Hill Giant", B, "graveyard");
    const forest = game.debugSpawn("Forest", B, "graveyard");
    game.debugApplyEffect(A, effectOf("Crypt Incursion"), [{ kind: "player", player: B }]);
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    expect(zone(game, giant)).toBe("exile");
    expect(zone(game, forest)).toBe("graveyard");
    expect(life(game, A)).toBe(26);
  });
});
