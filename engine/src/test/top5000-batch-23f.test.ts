/**
 * Top-5000 batch 23f — the clauses most likely to be wired wrong: Edric's
 * draw belonging to the attacking creature's controller (and only for a hit
 * on one of Edric's controller's opponents), Vincent Valentine's counters
 * read off the dead creature and Galian Beast coming back front face up,
 * General's Enforcer's "if it was a creature card", Nissa's Pilgrimage's
 * spell mastery and split, Axgard Armory's one-of-each search, Forgotten
 * Creation's "draw that many" and Restless Cottage's optional exile.
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
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
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
/** Three seats and no controllers, so each decision waits to be dispatched. */
const setUp3 = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [A, B, C].map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
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
const triggeredOf = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;
const activatedOf = (name: string, index = 0): EffectSpec => registry.get(name)!.activated[index].effect!;

describe("top-5000 batch 23f — Edric, Spymaster of Trest", () => {
  it("lets your own creature's controller draw when it hits your opponent", () => {
    const game = setUp3();
    const edric = game.debugSpawn("Edric, Spymaster of Trest", A, "battlefield");
    game.state.objects[edric].summoningSick = false;
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bears].summoningSick = false;
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.player).toBe(A);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });

  it("asks an opponent's creature's controller when it hits another opponent, but not when it hits you", () => {
    const game = setUp3();
    game.debugSpawn("Edric, Spymaster of Trest", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    game.advanceUntil((s) => s.turn.number === 2 && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: theirs, defender: C }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    // The creature's controller chooses (the ruling), and it's their draw.
    expect(game.state.awaiting?.player).toBe(B);
    const bobHand = game.handOf(B).length;
    const aliceHand = game.handOf(A).length;
    game.dispatch({ type: "choose-modes", player: B, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.handOf(B)).toHaveLength(bobHand + 1);
    expect(game.handOf(A)).toHaveLength(aliceHand);
    // Edric's controller isn't one of their own opponents.
    game.advanceUntil((s) => s.turn.number === 5 && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: theirs, defender: A }] });
    game.advanceUntil((s) => s.turn.step === "end" || s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.kind).not.toBe("choose-modes");
  });
});

describe("top-5000 batch 23f — Vincent Valentine // Galian Beast", () => {
  it("grows by the power of an opponent's creature that dies, and not for your own", () => {
    const { game } = setUp();
    const vincent = spawn(game, "Vincent Valentine");
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(counters(game, vincent)).toBe(3);
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(counters(game, vincent)).toBe(3);
  });

  it("Galian Beast returns to the battlefield tapped, front face up, when it dies", () => {
    const { game } = setUp();
    const vincent = spawn(game, "Vincent Valentine");
    game.state.objects[vincent].face = 1;
    expect(computeCharacteristics(game.state, registry, vincent).keywords.has("lifelink")).toBe(true);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: vincent }]);
    settle(game);
    const back = named(game, "Vincent Valentine");
    expect(back).toHaveLength(1);
    const object = game.state.objects[back[0]];
    expect(object.face ?? 0).toBe(0);
    expect(object.tapped).toBe(true);
    expect(object.controller).toBe(A);
  });
});

describe("top-5000 batch 23f — General's Enforcer", () => {
  it("gives your legendary Humans indestructible, not itself or an opponent's", () => {
    const { game } = setUp();
    const enforcer = spawn(game, "General's Enforcer");
    const thalia = spawn(game, "Thalia, Guardian of Thraben");
    const theirThalia = spawn(game, "Thalia, Guardian of Thraben", B);
    const has = (id: ObjectId): boolean => computeCharacteristics(game.state, registry, id).keywords.has("indestructible");
    expect(has(thalia)).toBe(true);
    expect(has(enforcer)).toBe(false);
    expect(has(theirThalia)).toBe(false);
  });

  it("makes a Human Soldier only when the exiled card was a creature card", () => {
    const { game } = setUp();
    const enforcer = spawn(game, "General's Enforcer");
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    game.debugApplyEffect(A, activatedOf("General's Enforcer"), [{ kind: "object", object: bolt }], { source: enforcer });
    settle(game);
    expect(zone(game, bolt)).toBe("exile");
    expect(named(game, "Human Soldier Token")).toHaveLength(0);
    const bears = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugApplyEffect(A, activatedOf("General's Enforcer"), [{ kind: "object", object: bears }], { source: enforcer });
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    expect(named(game, "Human Soldier Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 23f — Nissa's Pilgrimage", () => {
  const cast = (instantsInGraveyard: number): { game: Game; handBefore: number; found: ObjectId[] } => {
    const { game } = setUp(["Nissa's Pilgrimage"], "Forest");
    for (let i = 0; i < instantsInGraveyard; i += 1) game.debugSpawn("Lightning Bolt", A, "graveyard");
    const paid = [0, 1, 2].map(() => spawn(game, "Forest"));
    const handBefore = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Nissa's Pilgrimage"), targets: [] });
    settle(game);
    return { game, handBefore, found: named(game, "Forest").filter((id) => !paid.includes(id)) };
  };

  it("with spell mastery finds three: one onto the battlefield tapped, two into hand", () => {
    const { game, handBefore, found } = cast(2);
    expect(found).toHaveLength(1);
    expect(game.state.objects[found[0]].tapped).toBe(true);
    expect(game.handOf(A)).toHaveLength(handBefore - 1 + 2);
  });

  it("without it finds two: one onto the battlefield tapped, one into hand", () => {
    const { game, handBefore, found } = cast(1);
    expect(found).toHaveLength(1);
    expect(game.state.objects[found[0]].tapped).toBe(true);
    expect(game.handOf(A)).toHaveLength(handBefore - 1 + 1);
  });
});

describe("top-5000 batch 23f — Axgard Armory", () => {
  it("finds an Aura and an Equipment, not two Auras", () => {
    const { game, a } = setUp();
    const pacifism = game.debugSpawn("Pacifism", A, "library");
    const rancor = game.debugSpawn("Rancor", A, "library");
    const bonesplitter = game.debugSpawn("Bonesplitter", A, "library");
    // Offered everything that fits a slot (both Auras and the Equipment);
    // take one Aura and the Equipment.
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [pacifism, bonesplitter].filter((id) => eligible.includes(id));
    };
    const armory = spawn(game, "Axgard Armory");
    game.state.objects[armory].tapped = false;
    for (const land of ["Mountain", "Mountain", "Plains", "Plains"]) spawn(game, land);
    game.dispatch({ type: "activate-ability", player: A, source: armory, abilityIndex: 1 });
    settle(game);
    expect(offered).toEqual(expect.arrayContaining([pacifism, rancor, bonesplitter]));
    expect(zone(game, armory)).toBe("graveyard");
    expect(zone(game, pacifism)).toBe("hand");
    expect(zone(game, bonesplitter)).toBe("hand");
    expect(zone(game, rancor)).toBe("library");
  });
});

describe("top-5000 batch 23f — Forgotten Creation", () => {
  it("discards the whole hand and draws that many", () => {
    const { game } = setUp();
    const creation = spawn(game, "Forgotten Creation");
    const before = [...game.handOf(A)];
    expect(before.length).toBeGreaterThan(0);
    game.debugApplyEffect(A, triggeredOf("Forgotten Creation"), [], { source: creation });
    settle(game);
    expect(game.handOf(A)).toHaveLength(before.length);
    for (const id of before) expect(zone(game, id)).toBe("graveyard");
  });
});

describe("top-5000 batch 23f — Restless Cottage", () => {
  it("makes a Food and exiles the chosen graveyard card, or just the Food with none chosen", () => {
    const { game } = setUp();
    const cottage = spawn(game, "Restless Cottage");
    const bears = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugApplyEffect(A, triggeredOf("Restless Cottage"), [{ kind: "object", object: bears }], { source: cottage });
    settle(game);
    expect(zone(game, bears)).toBe("exile");
    expect(named(game, "Food Token")).toHaveLength(1);
    game.debugApplyEffect(A, triggeredOf("Restless Cottage"), [], { source: cottage });
    settle(game);
    const foods = named(game, "Food Token").reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(foods).toBe(2);
  });
});
