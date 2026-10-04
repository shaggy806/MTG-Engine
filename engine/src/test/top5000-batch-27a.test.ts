/**
 * Top-5000 batch 27a. Pins the clauses most likely to be wired wrong: "you
 * controlled" counted off a wrath (Kaya's Wrath) and off a bounce
 * (Boomerang Basics), an X/X token sized by what was destroyed (Phyrexian
 * Rebirth), a turn-long noncreature lock (Permission Denied), Sliver statics
 * that reach every player's Slivers (Crystalline, Shifting), a gross life-lost
 * stat (Children of Korlis), a reflexive return (Undead Butler), earthbend then
 * untap (Avatar Kyoshi) and an O-Ring Aura on a basic land (Ossification).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { whyCannotBlock } from "../combat/eligibility.js";
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
const cast = (game: Game, card: ObjectId, targets: readonly ObjectId[] = [], player: PlayerId = A): void => {
  game.dispatch({
    type: "cast-spell",
    player,
    card,
    ...(targets.length > 0 ? { targets: targets.map((object) => ({ kind: "object" as const, object })) } : {}),
  });
};
const castable = (game: Game, card: ObjectId, player: PlayerId = A): boolean =>
  game.legalActions(player).some((action) => action.kind === "cast-spell" && action.card === card);

describe("top-5000 batch 27a — Kaya's Wrath", () => {
  it("destroys every creature and gains life only for the ones you controlled", () => {
    const { game } = setUp();
    const mine = [spawn(game, "Grizzly Bears"), spawn(game, "Llanowar Elves")];
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Hill Giant", B), spawn(game, "Llanowar Elves", B)];
    game.debugApplyEffect(A, effectOf("Kaya's Wrath"), []);
    settle(game);
    for (const id of [...mine, ...theirs]) expect(zone(game, id)).toBe("graveyard");
    expect(life(game, A)).toBe(22);
    expect(life(game, B)).toBe(20);
  });
});

describe("top-5000 batch 27a — Phyrexian Rebirth", () => {
  it("makes one colorless artifact Horror as big as the number destroyed", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant", B);
    spawn(game, "Llanowar Elves", B);
    game.debugApplyEffect(A, effectOf("Phyrexian Rebirth"), []);
    settle(game);
    const horror = named(game, "Phyrexian Horror Token (Phyrexian Rebirth)");
    expect(horror).toHaveLength(1);
    const c = computeCharacteristics(game.state, registry, horror[0]);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.types).toContain("artifact");
    expect(c.types).toContain("creature");
    expect(c.colors.size).toBe(0);
    expect(game.state.objects[horror[0]].controller).toBe(A);
  });
});

describe("top-5000 batch 27a — Boomerang Basics", () => {
  it("draws only when the returned permanent was yours", () => {
    const { game } = setUp(["Boomerang Basics", "Boomerang Basics"]);
    lands(game, "Island", 2);
    const theirs = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Hill Giant");
    const before = game.handOf(A).length;
    cast(game, inHand(game, "Boomerang Basics"), [theirs]);
    settle(game);
    expect(zone(game, theirs)).toBe("hand");
    expect(game.handOf(A)).toHaveLength(before - 1);
    cast(game, inHand(game, "Boomerang Basics"), [mine]);
    settle(game);
    expect(zone(game, mine)).toBe("hand");
    // Two Boomerangs gone, the Giant back, one card drawn.
    expect(game.handOf(A)).toHaveLength(before - 2 + 1 + 1);
  });
});

describe("top-5000 batch 27a — Permission Denied", () => {
  it("counters the spell and stops opponents' noncreature spells, not yours, this turn", () => {
    const { game } = setUp(["Opt", "Permission Denied"]);
    lands(game, "Island", 2);
    spawn(game, "Plains");
    spawn(game, "Island", B);
    spawn(game, "Forest", B);
    const opt = inHand(game, "Opt");
    cast(game, opt);
    cast(game, inHand(game, "Permission Denied"), [opt]);
    settle(game);
    expect(zone(game, opt)).toBe("graveyard");
    const theirOpt = game.debugSpawn("Opt", B, "hand");
    game.advanceUntil((s) => s.priority.holder === B);
    expect(castable(game, theirOpt, B)).toBe(false);
    expect(castable(game, game.debugSpawn("Ambush Viper", B, "hand"), B)).toBe(true);
  });
});

describe("top-5000 batch 27a — Slivers", () => {
  it("Crystalline Sliver gives shroud to every Sliver, an opponent's too", () => {
    const { game } = setUp();
    const crystalline = spawn(game, "Crystalline Sliver");
    const theirs = spawn(game, "Sentinel Sliver", B);
    const bears = spawn(game, "Grizzly Bears", B);
    expect(computeCharacteristics(game.state, registry, crystalline).keywords.has("shroud")).toBe(true);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("shroud")).toBe(true);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("shroud")).toBe(false);
  });

  it("Shifting Sliver: Slivers can't be blocked except by Slivers, whoever controls them", () => {
    const { game } = setUp();
    const shifting = spawn(game, "Shifting Sliver");
    const theirSliver = spawn(game, "Sentinel Sliver", B);
    const theirBears = spawn(game, "Grizzly Bears", B);
    game.state.objects[shifting]!.attacking = B;
    expect(whyCannotBlock(game.state, registry, B, theirBears, shifting)).not.toBeNull();
    expect(whyCannotBlock(game.state, registry, B, theirSliver, shifting)).toBeNull();
    // An opponent's Sliver attacking is just as hard to block.
    game.state.objects[shifting]!.attacking = null;
    const myBears = spawn(game, "Grizzly Bears");
    game.state.objects[theirSliver]!.attacking = A;
    expect(whyCannotBlock(game.state, registry, A, myBears, theirSliver)).not.toBeNull();
  });
});

describe("top-5000 batch 27a — Children of Korlis", () => {
  it("gains back all the life lost this turn, not the net change", () => {
    const { game } = setUp();
    const children = spawn(game, "Children of Korlis");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 5 }, []);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    settle(game);
    expect(life(game, A)).toBe(18);
    game.dispatch({ type: "activate-ability", player: A, source: children, abilityIndex: 0 });
    settle(game);
    expect(zone(game, children)).toBe("graveyard");
    expect(life(game, A)).toBe(23);
  });
});

describe("top-5000 batch 27a — Undead Butler", () => {
  it("exiles itself as it dies to return a creature card from your graveyard", () => {
    const { game } = setUp();
    const butler = spawn(game, "Undead Butler");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: butler }]);
    settle(game);
    expect(zone(game, butler)).toBe("exile");
    expect(zone(game, bears)).toBe("hand");
  });
});

describe("top-5000 batch 27a — Dark Prophecy", () => {
  it("draws and loses 1 life when a creature you control dies", () => {
    const { game } = setUp();
    spawn(game, "Dark Prophecy");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(before);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(before + 1);
    expect(life(game, A)).toBe(19);
  });
});

describe("top-5000 batch 27a — Avatar Kyoshi, Earthbender", () => {
  it("has hexproof on your turn, and earthbends 8 then untaps the land at your beginning of combat", () => {
    const { game } = setUp();
    const kyoshi = spawn(game, "Avatar Kyoshi, Earthbender");
    const forest = spawn(game, "Forest");
    game.state.objects[forest]!.tapped = true;
    expect(computeCharacteristics(game.state, registry, kyoshi).keywords.has("hexproof")).toBe(true);
    game.advanceUntil((s) => s.turn.step === "begin-combat");
    game.advanceUntil((s) => s.turn.step !== "begin-combat");
    const land = computeCharacteristics(game.state, registry, forest);
    expect(land.types).toContain("creature");
    expect(land.types).toContain("land");
    expect([land.power, land.toughness]).toEqual([8, 8]);
    expect(game.state.objects[forest]!.tapped).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(computeCharacteristics(game.state, registry, kyoshi).keywords.has("hexproof")).toBe(false);
  });
});

describe("top-5000 batch 27a — Ossification", () => {
  it("enchants your basic land and exiles an opponent's creature until it leaves", () => {
    const { game } = setUp(["Ossification"]);
    const plains = lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    cast(game, inHand(game, "Ossification"), [plains[0]]);
    settle(game);
    const aura = named(game, "Ossification");
    expect(aura).toHaveLength(1);
    expect(game.state.objects[aura[0]]!.attachedTo).toBe(plains[0]);
    expect(zone(game, bears)).toBe("exile");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: aura[0] }]);
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    expect(game.state.objects[named(game, "Grizzly Bears")[0]]!.controller).toBe(B);
  });
});
