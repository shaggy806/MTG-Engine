/**
 * Top-10000 batch 34c. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — modular plus an "another artifact"
 * counter (Arcbound Crusher), an each-opponent discard-and-drain (Hopeless
 * Nightmare), a paid reflexive reanimation capped by life gained this turn
 * (Rodolf Duskbringer), spree modes on one creature (Trash the Town), a
 * Wizard-only Panharmonicon (Naban), a delirium lord over Insects (The
 * Swarmweaver), "any number of target players" drawing (Jace, Memory Adept),
 * earthbend then a reflexive fight (Earth Rumble), transmute from the hand
 * (Dizzy Spell) and sacrifice triggers by colour (Savra).
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
import type { TargetRef } from "../target.js";

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
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
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
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};

describe("top-10000 batch 34c — Arcbound Crusher", () => {
  it("enters with its modular counter and grows when another artifact enters", () => {
    const { game } = setUp();
    const crusher = spawn(game, "Arcbound Crusher");
    expect(counters(game, crusher)).toBe(1);
    game.debugSpawn("Sol Ring", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, crusher)).toBe(2);
    expect(pt(game, crusher)).toEqual([2, 2]);
  });
});

describe("top-10000 batch 34c — Hopeless Nightmare", () => {
  it("makes each opponent discard a card and lose 2 life", () => {
    const { game } = setUp();
    const before = game.handOf(B).length;
    game.debugSpawn("Hopeless Nightmare", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.handOf(B)).toHaveLength(before - 1);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-10000 batch 34c — Rodolf Duskbringer", () => {
  it("pays {1}{W/B} to return a creature card with mana value up to the life gained this turn", () => {
    const { game } = setUp();
    const rodolf = spawn(game, "Rodolf Duskbringer");
    lands(game, "Swamp", 2);
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    settle(game);
    const endStep = registry.get("Rodolf Duskbringer")!.triggered[1].effect!;
    game.debugApplyEffect(A, endStep, [], { source: rodolf });
    settle(game);
    // X is 3: the Bears (mana value 2) qualify, the Giant (4) doesn't.
    expect(zone(game, bears)).toBe("battlefield");
    expect(zone(game, giant)).toBe("graveyard");
    expect(named(game, "Swamp").filter((id) => game.state.objects[id].tapped)).toHaveLength(2);
  });
});

describe("top-10000 batch 34c — Trash the Town", () => {
  it("pays the chosen spree costs and applies each mode to its target", () => {
    const { game } = setUp(["Trash the Town"], "Forest");
    lands(game, "Forest", 4);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Trash the Town"),
      modes: [0, 1],
      targets: [obj(bears), obj(bears)],
    });
    settle(game);
    expect(counters(game, bears)).toBe(2);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("trample")).toBe(true);
  });
});

describe("top-10000 batch 34c — Naban, Dean of Iteration", () => {
  it("doubles triggers a Wizard you control entering causes, not a non-Wizard's", () => {
    const { game } = setUp();
    spawn(game, "Soul Warden");
    spawn(game, "Naban, Dean of Iteration");
    game.debugSpawn("Alabaster Mage", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(22);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, A)).toBe(23);
  });
});

describe("top-10000 batch 34c — The Swarmweaver", () => {
  it("makes two Insects, which get +1/+1 and deathtouch only with delirium", () => {
    const { game } = setUp();
    const weaver = game.debugSpawn("The Swarmweaver", A, "battlefield", { announceEntry: true });
    settle(game);
    const insects = named(game, "Insect Token (Infestation Sage)");
    const count = insects.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(count).toBe(2);
    const insect = insects[0];
    expect(pt(game, insect)).toEqual([1, 1]);
    for (const name of ["Wastes", "Grizzly Bears", "Sol Ring", "Lightning Bolt"]) game.debugSpawn(name, A, "graveyard");
    expect(pt(game, insect)).toEqual([2, 2]);
    expect(computeCharacteristics(game.state, registry, insect).keywords.has("deathtouch")).toBe(true);
    // The Swarmweaver is a Scarecrow: not its own lord.
    expect(pt(game, weaver)).toEqual([2, 3]);
  });
});

describe("top-10000 batch 34c — Jace, Memory Adept", () => {
  it("−7: each chosen player draws twenty", () => {
    const { game } = setUp();
    const jace = spawn(game, "Jace, Memory Adept");
    const handA = game.handOf(A).length;
    const handB = game.handOf(B).length;
    const ult: EffectSpec = registry.get("Jace, Memory Adept")!.activated[2].effect!;
    game.debugApplyEffect(A, ult, [player(A), player(B)], { source: jace });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handA + 20);
    expect(game.handOf(B)).toHaveLength(handB + 20);
  });
});

describe("top-10000 batch 34c — Earth Rumble", () => {
  it("earthbends 2, then a creature you control fights one an opponent controls", () => {
    const { game } = setUp(["Earth Rumble"], "Forest");
    const forests = lands(game, "Forest", 5);
    const target = forests[4];
    const elves = spawn(game, "Llanowar Elves", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Earth Rumble"), targets: [obj(target)] });
    settle(game);
    expect(counters(game, target)).toBe(2);
    expect(computeCharacteristics(game.state, registry, target).types).toContain("creature");
    expect(zone(game, elves)).toBe("graveyard");
  });
});

describe("top-10000 batch 34c — Dizzy Spell", () => {
  it("transmutes from the hand for a card with mana value 1", () => {
    const { game } = setUp(["Dizzy Spell"]);
    lands(game, "Island", 3);
    const giant = game.debugSpawn("Hill Giant", A, "library");
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    const dizzy = inHand(game, "Dizzy Spell");
    const action = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === dizzy && x.text.startsWith("Transmute"));
    expect(action).toBeDefined();
    if (action === undefined || action.kind !== "activate-ability") return;
    game.dispatch({ type: "activate-ability", player: A, source: dizzy, abilityIndex: action.abilityIndex });
    expect(zone(game, dizzy)).toBe("graveyard");
    settle(game);
    expect(zone(game, bolt)).toBe("hand");
    expect(zone(game, giant)).toBe("library");
  });
});

describe("top-10000 batch 34c — Savra, Queen of the Golgari", () => {
  it("a black creature sacrificed: pay 2 life for an edict; a green one: gain 2", () => {
    const { game } = setUp();
    spawn(game, "Savra, Queen of the Golgari");
    const bears = spawn(game, "Grizzly Bears", B);
    const nighthawk = spawn(game, "Vampire Nighthawk");
    const elves = spawn(game, "Llanowar Elves");
    game.debugApplyEffect(A, { kind: "sacrifice-target", target: 0 }, [obj(nighthawk)]);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(life(game, A)).toBe(18);
    game.debugApplyEffect(A, { kind: "sacrifice-target", target: 0 }, [obj(elves)]);
    settle(game);
    expect(life(game, A)).toBe(20);
  });
});
