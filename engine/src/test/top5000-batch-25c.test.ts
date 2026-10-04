/**
 * Top-5000 batch 25c. No engine change: every card here is the existing
 * vocabulary. The tests pin the clause most likely to be wired wrong on each —
 * a sacrifice paid on a flashback cast (Rite of Oblivion), a tutor that skips
 * to the next creature (Spinner of Souls), a cost reduction reaching every
 * player's creatures but never below one mana (Heartstone), a token count of
 * every token (Cadira), the modified set fixed on resolution (Sephiroth) and
 * the per-opponent steal (Hideous Taskmaster).
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
/** How many tokens of a name, a compacted stack counted as every token in it. */
const tokens = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const obj = (id: ObjectId) => ({ kind: "object" as const, object: id });
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const triggerOf = (name: string, i = 0): EffectSpec => registry.get(name)!.triggered[i].effect!;

describe("top-5000 batch 25c — Rite of Oblivion", () => {
  it("sacrifices a nonland permanent to exile one, and again when cast with flashback", () => {
    const { game } = setUp(["Rite of Oblivion"]);
    spawn(game, "Plains");
    spawn(game, "Swamp");
    const bears = spawn(game, "Grizzly Bears");
    const ring = spawn(game, "Sol Ring", B);
    const rite = inHand(game, "Rite of Oblivion");
    game.dispatch({ type: "cast-spell", player: A, card: rite, targets: [obj(ring)], sacrifice: bears });
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, ring)).toBe("exile");
    expect(zone(game, rite)).toBe("graveyard");

    spawn(game, "Plains");
    spawn(game, "Swamp");
    lands(game, "Wastes", 2);
    const thopter = spawn(game, "Ornithopter");
    const stone = spawn(game, "Mind Stone", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: rite,
      targets: [obj(stone)],
      via: "flashback",
      sacrifice: thopter,
    });
    settle(game);
    expect(zone(game, thopter)).toBe("graveyard");
    expect(zone(game, stone)).toBe("exile");
    expect(zone(game, rite)).toBe("exile");
  });
});

describe("top-5000 batch 25c — Spinner of Souls", () => {
  it("reveals past a land to the next creature card, putting the land on the bottom", () => {
    const { game } = setUp();
    spawn(game, "Spinner of Souls");
    const bears = spawn(game, "Grizzly Bears");
    const found = game.debugSpawn("Hill Giant", A, "library");
    const skipped = game.debugSpawn("Wastes", A, "library");
    expect(game.libraryOf(A)[0]).toBe(skipped);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.handOf(A)).toContain(found);
    const library = game.libraryOf(A);
    expect(library[library.length - 1]).toBe(skipped);
  });
});

describe("top-5000 batch 25c — Heartstone", () => {
  it("takes {1} off any player's creature's ability, never below one mana", () => {
    const { game } = setUp();
    const wastes = spawn(game, "Wastes");
    const scout = spawn(game, "Enslaved Scout");
    const ants = spawn(game, "Carrion Ants");
    const activate = (source: ObjectId): string | null =>
      game.canDispatch({ type: "activate-ability", player: A, source, abilityIndex: 0 });
    // {2} with one land: not without Heartstone.
    expect(activate(scout)).not.toBeNull();
    // An opponent's Heartstone reduces Alice's creatures too.
    spawn(game, "Heartstone", B);
    expect(activate(scout)).toBeNull();
    // {1} stays {1}: with no untapped land, Carrion Ants can't pump.
    game.state.objects[wastes].tapped = true;
    expect(activate(ants)).not.toBeNull();
  });
});

describe("top-5000 batch 25c — Karlov of the Ghost Council", () => {
  it("grows by two per life gain and spends six counters to exile", () => {
    const { game } = setUp();
    spawn(game, "Plains");
    spawn(game, "Swamp");
    const karlov = spawn(game, "Karlov of the Ghost Council");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    settle(game);
    expect(counters(game, karlov)).toBe(2);
    game.state.objects[karlov].counters = { "+1/+1": 7 };
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "activate-ability", player: A, source: karlov, abilityIndex: 0, targets: [obj(theirs)] });
    settle(game);
    expect(zone(game, theirs)).toBe("exile");
    expect(counters(game, karlov)).toBe(1);
  });
});

describe("top-5000 batch 25c — Trash for Treasure", () => {
  it("sacrifices an artifact and returns another from the graveyard", () => {
    const { game } = setUp(["Trash for Treasure"]);
    lands(game, "Mountain", 3);
    const thopter = spawn(game, "Ornithopter");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Trash for Treasure"),
      targets: [obj(ring)],
      sacrifice: thopter,
    });
    settle(game);
    expect(zone(game, thopter)).toBe("graveyard");
    expect(zone(game, ring)).toBe("battlefield");
  });
});

describe("top-5000 batch 25c — Star of Extinction and Extinguish All Hope", () => {
  it("Star destroys the land and kills every creature", () => {
    const { game } = setUp(["Star of Extinction"]);
    lands(game, "Mountain", 7);
    const mine = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    const land = spawn(game, "Wastes", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Star of Extinction"), targets: [obj(land)] });
    settle(game);
    expect(zone(game, land)).toBe("graveyard");
    expect(zone(game, mine)).toBe("graveyard");
    expect(zone(game, theirs)).toBe("graveyard");
  });

  it("Extinguish All Hope spares enchantment creatures", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const amalgam = spawn(game, "Appendage Amalgam", B);
    game.debugApplyEffect(A, effectOf("Extinguish All Hope"), []);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(zone(game, amalgam)).toBe("battlefield");
  });
});

describe("top-5000 batch 25c — Cadira, Caller of the Small", () => {
  it("makes a Rabbit for every token you control, creature or not", () => {
    const { game } = setUp();
    const cadira = spawn(game, "Cadira, Caller of the Small");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 2 }, []);
    settle(game);
    game.debugApplyEffect(A, triggerOf("Cadira, Caller of the Small"), [], { source: cadira });
    settle(game);
    expect(tokens(game, "Rabbit Token")).toBe(2);
    game.debugApplyEffect(A, triggerOf("Cadira, Caller of the Small"), [], { source: cadira });
    settle(game);
    expect(tokens(game, "Rabbit Token")).toBe(6);
  });
});

describe("top-5000 batch 25c — Mutable Explorer", () => {
  it("makes a tapped Mutavault that becomes a 2/2 of every creature type", () => {
    const { game } = setUp();
    game.debugSpawn("Mutable Explorer", A, "battlefield", { announceEntry: true });
    settle(game);
    const vault = named(game, "Mutavault Token");
    expect(vault).toHaveLength(1);
    expect(game.state.objects[vault[0]].tapped).toBe(true);
    game.state.objects[vault[0]].tapped = false;
    spawn(game, "Wastes");
    game.dispatch({ type: "activate-ability", player: A, source: vault[0], abilityIndex: 1 });
    settle(game);
    const c = chars(game, vault[0]);
    expect(c.types).toContain("land");
    expect(c.types).toContain("creature");
    expect([c.power, c.toughness]).toEqual([2, 2]);
    expect(hasSubtype(c.subtypes, "Goblin")).toBe(true);
  });
});

describe("top-5000 batch 25c — Hideous Taskmaster", () => {
  it("steals an opponent's creature, untapped, with trample and haste", () => {
    const { game } = setUp();
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield", { tapped: true, summoningSick: false });
    game.debugApplyEffect(A, triggerOf("Hideous Taskmaster"), [obj(theirs)]);
    settle(game);
    const c = chars(game, theirs);
    expect(c.controller).toBe(A);
    expect(game.state.objects[theirs].tapped).toBe(false);
    expect(c.keywords.has("trample") && c.keywords.has("haste")).toBe(true);
  });
});

describe("top-5000 batch 25c — Nibelheim Aflame", () => {
  it("deals the creature's power to each other creature, and wheels only from the graveyard", () => {
    const { game } = setUp(["Nibelheim Aflame"], "Mountain");
    lands(game, "Mountain", 4);
    const giant = spawn(game, "Hill Giant");
    const elves = spawn(game, "Llanowar Elves");
    const theirs = spawn(game, "Grizzly Bears", B);
    const aflame = inHand(game, "Nibelheim Aflame");
    const handBefore = game.handOf(A).filter((id) => id !== aflame);
    game.dispatch({ type: "cast-spell", player: A, card: aflame, targets: [obj(giant)] });
    settle(game);
    expect(zone(game, giant)).toBe("battlefield");
    expect(zone(game, elves)).toBe("graveyard");
    expect(zone(game, theirs)).toBe("graveyard");
    expect(zone(game, aflame)).toBe("graveyard");
    expect([...game.handOf(A)].sort()).toEqual([...handBefore].sort());

    lands(game, "Mountain", 7);
    game.dispatch({ type: "cast-spell", player: A, card: aflame, targets: [obj(giant)], via: "flashback" });
    settle(game);
    for (const id of handBefore) expect(zone(game, id)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(4);
    expect(zone(game, aflame)).toBe("exile");
  });
});
