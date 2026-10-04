/**
 * Top-5000 batch 22f. No engine change: each test pins the clause of one card
 * most likely to be wired wrong — a graveyard count as a ritual's amount
 * (Songs of the Damned), a split-second modal pump (Siege Smash), a Goblin
 * sacrificing itself (Goblin Trashmaster), the reveal's two branches (Lurking
 * Predators), two intervening-ifs on life gained and lost (Lunar
 * Convocation), a grant to every player's Slivers (Gemhide Sliver), a token
 * that counts Spirits and the seven-enchantment anthem (Hallowed Haunting),
 * the damaged player's library and the free cast (Gríma), the power a
 * creature died with (Flaming Tyrannosaurus) and X twice (Damnable Pact).
 */
import { describe, expect, it } from "vitest";

import type { Action } from "../actions.js";
import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

type Cast = Extract<Action, { type: "cast-spell" }>;

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
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
/** Put `names` on top of `player`'s library, the first one on top. */
const stackLibrary = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  [...names].reverse().map((name) => game.debugSpawn(name, player, "library")).reverse();
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
const triggerEffect = (name: string, index = 0) => registry.get(name)!.triggered[index].effect!;

describe("top-5000 batch 22f — Songs of the Damned", () => {
  it("adds {B} for each creature card in your own graveyard only", () => {
    const { game } = setUp(["Songs of the Damned"], "Swamp");
    lands(game, "Swamp", 1);
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Songs of the Damned"), targets: [] });
    settle(game);
    expect(pool(game)).toEqual(["B", "B"]);
  });
});

describe("top-5000 batch 22f — Damnable Pact", () => {
  it("has the target player draw X and lose X", () => {
    const { game } = setUp(["Damnable Pact"], "Swamp");
    lands(game, "Swamp", 5);
    const handBefore = game.handOf(B).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Damnable Pact"),
      targets: [{ kind: "player", player: B }],
      xValue: 3,
    });
    settle(game);
    expect(game.handOf(B)).toHaveLength(handBefore + 3);
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 22f — Siege Smash", () => {
  it("can't be answered with a spell, and its second mode pumps and grants trample", () => {
    const { game } = setUp(["Siege Smash", "Lightning Bolt"], "Mountain");
    lands(game, "Mountain", 3);
    const bears = spawn(game, "Grizzly Bears");
    const bolt = inHand(game, "Lightning Bolt");
    const boltCastable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === bolt);
    expect(boltCastable()).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Siege Smash"), modes: [1], targets: [obj(bears)] });
    expect(boltCastable()).toBe(false);
    settle(game);
    const c = chars(game, bears);
    expect([c.power, c.toughness]).toEqual([5, 4]);
    expect(c.keywords.has("trample")).toBe(true);
  });
});

describe("top-5000 batch 22f — Goblin Trashmaster", () => {
  it("pumps only other Goblins, and can sacrifice itself to destroy an artifact", () => {
    const { game } = setUp();
    const trashmaster = spawn(game, "Goblin Trashmaster");
    const akki = spawn(game, "Akki Avalanchers");
    const ring = spawn(game, "Sol Ring", B);
    const def = registry.get("Akki Avalanchers")!;
    expect([chars(game, akki).power, chars(game, akki).toughness]).toEqual([def.power! + 1, def.toughness! + 1]);
    expect([chars(game, trashmaster).power, chars(game, trashmaster).toughness]).toEqual([3, 3]);
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === trashmaster);
    const choices = offer?.kind === "activate-ability" ? (offer.sacrifice?.choices ?? []) : [];
    expect(choices).toContain(trashmaster);
    expect(choices).toContain(akki);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: trashmaster,
      abilityIndex: 0,
      targets: [obj(ring)],
      sacrifice: trashmaster,
    });
    settle(game);
    expect(zone(game, trashmaster)).toBe("graveyard");
    expect(zone(game, ring)).toBe("graveyard");
    expect(zone(game, akki)).toBe("battlefield");
  });
});

describe("top-5000 batch 22f — Lurking Predators", () => {
  it("puts a revealed creature card onto the battlefield", () => {
    const { game } = setUp();
    const predators = spawn(game, "Lurking Predators");
    const [bears] = stackLibrary(game, ["Grizzly Bears"]);
    game.debugApplyEffect(A, triggerEffect("Lurking Predators"), [], { source: predators });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
  });

  it("may put a noncreature card on the bottom, and leaves it on top if declined", () => {
    const { game, a } = setUp();
    const predators = spawn(game, "Lurking Predators");
    const [bolt] = stackLibrary(game, ["Lightning Bolt"]);
    game.debugApplyEffect(A, triggerEffect("Lurking Predators"), [], { source: predators });
    settle(game);
    const library = game.state.zones.perPlayer[A].library;
    expect(zone(game, bolt)).toBe("library");
    expect(library[library.length - 1]).toBe(bolt);

    const [shock] = stackLibrary(game, ["Lightning Bolt"]);
    a.chooseModesFn = () => [];
    game.debugApplyEffect(A, triggerEffect("Lurking Predators"), [], { source: predators });
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    if (game.state.awaiting?.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: A, modes: [] });
    }
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(shock);
  });
});

describe("top-5000 batch 22f — Lunar Convocation", () => {
  it("drains only after life was gained, and makes a Bat only after life was gained and lost", () => {
    const { game } = setUp();
    spawn(game, "Lunar Convocation");
    // Turn 1: gained life only — the drain, no Bat.
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 }, []);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(life(game, B)).toBe(19);
    expect(named(game, "Bat Token")).toHaveLength(0);
    // Turn 3: gained and lost — both.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 1 }, []);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "you" }, []);
    game.advanceUntil((s) => s.turn.number === 4 && s.turn.step === "upkeep");
    expect(life(game, B)).toBe(18);
    expect(named(game, "Bat Token")).toHaveLength(1);
    // Turn 5: lost life only — neither.
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "precombat-main");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "you" }, []);
    game.advanceUntil((s) => s.turn.number === 6 && s.turn.step === "upkeep");
    expect(life(game, B)).toBe(18);
    expect(named(game, "Bat Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 22f — Gemhide Sliver", () => {
  it("gives every player's Slivers the mana ability, and nothing else", () => {
    const { game } = setUp();
    spawn(game, "Gemhide Sliver", B);
    const sliver = spawn(game, "Metallic Sliver");
    const bears = spawn(game, "Grizzly Bears");
    const manaOffers = (id: ObjectId) =>
      game.legalActions(A).filter((x) => x.kind === "activate-ability" && x.source === id && x.manaAbility === true);
    expect(manaOffers(sliver).length).toBeGreaterThan(0);
    expect(manaOffers(bears)).toHaveLength(0);
  });
});

describe("top-5000 batch 22f — Hallowed Haunting", () => {
  it("makes Spirit Clerics that count every Spirit you control", () => {
    const { game } = setUp();
    const haunting = spawn(game, "Hallowed Haunting");
    game.debugApplyEffect(A, triggerEffect("Hallowed Haunting"), [], { source: haunting });
    game.debugApplyEffect(A, triggerEffect("Hallowed Haunting"), [], { source: haunting });
    settle(game);
    const clerics = named(game, "Spirit Cleric Token");
    expect(clerics.length).toBeGreaterThan(0);
    spawn(game, "Spirit Token");
    spawn(game, "Spirit Token", B);
    const c = chars(game, clerics[0]);
    expect([c.power, c.toughness]).toEqual([3, 3]);
  });

  it("gives creatures you control flying and vigilance only with seven enchantments", () => {
    const { game } = setUp();
    for (let i = 0; i < 6; i += 1) spawn(game, "Hallowed Haunting");
    const bears = spawn(game, "Grizzly Bears");
    expect(chars(game, bears).keywords.has("flying")).toBe(false);
    spawn(game, "Hallowed Haunting");
    const c = chars(game, bears);
    expect(c.keywords.has("flying") && c.keywords.has("vigilance")).toBe(true);
  });
});

describe("top-5000 batch 22f — Gríma, Saruman's Footman", () => {
  it("exiles from the damaged player's library, casts the find for free, and bottoms the rest", () => {
    const { game, a } = setUp();
    const grima = spawn(game, "Gríma, Saruman's Footman");
    const [island, divination] = stackLibrary(game, ["Island", "Divination"], B);
    a.chooseCastNowFn = (): Cast => ({
      type: "cast-spell",
      player: A,
      card: divination,
      targets: [],
      via: "effect",
      free: true,
    });
    const handBefore = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: grima, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(19);
    // Divination was cast by Alice (she drew two) and went to its owner's graveyard.
    expect(game.handOf(A)).toHaveLength(handBefore + 2);
    expect(zone(game, divination)).toBe("graveyard");
    expect(game.graveyardOf(B)).toContain(divination);
    // The Island went to the bottom of Bob's library.
    const library = game.state.zones.perPlayer[B].library;
    expect(zone(game, island)).toBe("library");
    expect(library[library.length - 1]).toBe(island);
  });
});

describe("top-5000 batch 22f — Flaming Tyrannosaurus", () => {
  it("deals each opponent damage equal to the power it died with", () => {
    const { game } = setUp();
    const rex = spawn(game, "Flaming Tyrannosaurus");
    game.state.objects[rex].counters = { "+1/+1": 2 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(rex)]);
    settle(game);
    expect(zone(game, rex)).toBe("graveyard");
    expect(life(game, B)).toBe(13);
    expect(life(game, A)).toBe(20);
  });
});
