/**
 * Top-10000 batch 36c. Pins the clauses most likely to be wired wrong:
 * Leveler exiling the whole library, Dusk Urchins drawing for the -1/-1
 * counters it died with, Cosmic Rebirth's "if you don't put it onto the
 * battlefield, put it into your hand", Bane's Contingency's commander rider,
 * Summoning Materia's permission only while attached, Merchant of Truth's
 * exalted on each Clue, Warkite Marauder's 0/1 with no abilities, and the
 * Treasure from Furnace Reins' granted trigger going to the thief.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = []): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const attackAlone = (game: Game, attacker: ObjectId): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
  game.advanceUntil(quiet);
};

describe("top-10000 batch 36c — Leveler", () => {
  it("exiles every card in your library as it enters, and nobody else's", () => {
    const { game } = setUp(["Leveler"]);
    lands(game, "Wastes", 5);
    const library = [...game.state.zones.perPlayer[A].library];
    expect(library.length).toBeGreaterThan(20);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Leveler"), targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].library).toHaveLength(0);
    expect(library.every((id) => zone(game, id) === "exile")).toBe(true);
    expect(game.state.zones.perPlayer[B].library.length).toBeGreaterThan(20);
  });
});

describe("top-10000 batch 36c — Dusk Urchins", () => {
  it("gets a -1/-1 counter as it attacks, and draws one per counter it died with", () => {
    const { game } = setUp();
    const urchins = spawn(game, "Dusk Urchins");
    attackAlone(game, urchins);
    expect(game.state.objects[urchins].counters["-1/-1"]).toBe(1);
    expect(computeCharacteristics(game.state, registry, urchins).power).toBe(3);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    game.state.objects[urchins].counters["-1/-1"] = 2;
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(urchins)]);
    game.advanceUntil(quiet);
    expect(zone(game, urchins)).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand + 2);
  });
});

describe("top-10000 batch 36c — Cosmic Rebirth", () => {
  const cast = (game: Game, card: ObjectId): void => {
    lands(game, "Forest", 1);
    lands(game, "Plains", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Cosmic Rebirth"), targets: [obj(card)] });
    game.advanceUntil(quiet);
  };

  it("puts a mana value 3 or less card onto the battlefield on a yes, and gains 3", () => {
    const { game, a } = setUp(["Cosmic Rebirth"]);
    a.chooseModesFn = () => [0];
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const before = life(game, A);
    cast(game, bears);
    expect(zone(game, bears)).toBe("battlefield");
    expect(life(game, A)).toBe(before + 3);
  });

  it("puts it into your hand when you decline", () => {
    const { game, a } = setUp(["Cosmic Rebirth"]);
    a.chooseModesFn = () => [];
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    cast(game, bears);
    expect(zone(game, bears)).toBe("hand");
  });

  it("puts a mana value 4 or greater card into your hand without asking", () => {
    const { game, a } = setUp(["Cosmic Rebirth"]);
    let asked = false;
    a.chooseModesFn = () => {
      asked = true;
      return [0];
    };
    const dreadmaw = game.debugSpawn("Colossal Dreadmaw", A, "graveyard");
    const before = life(game, A);
    cast(game, dreadmaw);
    expect(asked).toBe(false);
    expect(zone(game, dreadmaw)).toBe("hand");
    expect(life(game, A)).toBe(before + 3);
  });
});

describe("top-10000 batch 36c — Bane's Contingency", () => {
  const run = (targetCommander: boolean): { game: Game; growth: ObjectId; handDelta: number } => {
    const { game } = setUp(["Bane's Contingency", "Giant Growth"]);
    lands(game, "Island", 3);
    lands(game, "Forest", 1);
    const target = spawn(game, "Grizzly Bears");
    if (targetCommander) game.state.objects[target].isCommander = true;
    const growth = inHand(game, "Giant Growth");
    game.dispatch({ type: "cast-spell", player: A, card: growth, targets: [obj(target)] });
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Bane's Contingency"), targets: [obj(growth)] });
    game.advanceUntil(quiet);
    return { game, growth, handDelta: game.handOf(A).length - (hand - 1) };
  };

  it("counters, scries and draws when the spell targets a commander you control", () => {
    const { game, growth, handDelta } = run(true);
    expect(zone(game, growth)).toBe("graveyard");
    expect(handDelta).toBe(1);
  });

  it("only counters a spell that targets no commander", () => {
    const { game, growth, handDelta } = run(false);
    expect(zone(game, growth)).toBe("graveyard");
    expect(handDelta).toBe(0);
  });
});

describe("top-10000 batch 36c — Summoning Materia", () => {
  it("lets you cast a creature off the top only while it's attached", () => {
    const { game } = setUp();
    const materia = spawn(game, "Summoning Materia");
    const host = spawn(game, "Elite Vanguard");
    lands(game, "Forest", 4);
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const offered = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === bears);
    expect(offered()).toBe(false);
    game.dispatch({ type: "activate-ability", player: A, source: materia, abilityIndex: 0, targets: [obj(host)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[materia].attachedTo).toBe(host);
    expect(computeCharacteristics(game.state, registry, host).power).toBe(4);
    expect(offered()).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [], via: "library-top" });
    game.advanceUntil(quiet);
    expect(zone(game, bears)).toBe("battlefield");
  });
});

describe("top-10000 batch 36c — Merchant of Truth", () => {
  it("gives each Clue you control exalted, and nothing else", () => {
    const { game } = setUp();
    spawn(game, "Merchant of Truth");
    spawn(game, "Clue Token");
    spawn(game, "Clue Token");
    spawn(game, "Sol Ring");
    spawn(game, "Clue Token", B);
    const bears = spawn(game, "Grizzly Bears");
    attackAlone(game, bears);
    const pt = computeCharacteristics(game.state, registry, bears);
    expect([pt.power, pt.toughness]).toEqual([4, 4]);
  });

  it("investigates when a nontoken creature you control dies, not a token", () => {
    const { game } = setUp();
    spawn(game, "Merchant of Truth");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 }, []);
    game.advanceUntil(quiet);
    const [soldier] = named(game, "Soldier Token");
    expect(game.state.objects[soldier].isToken).toBe(true);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(soldier)]);
    game.advanceUntil(quiet);
    expect(named(game, "Clue Token", A)).toHaveLength(1);
  });
});

describe("top-10000 batch 36c — Warkite Marauder", () => {
  it("makes the defending player's creature a 0/1 with no abilities until end of turn", () => {
    const { game } = setUp();
    const marauder = spawn(game, "Warkite Marauder");
    const angel = spawn(game, "Serra Angel", B);
    attackAlone(game, marauder);
    const pt = computeCharacteristics(game.state, registry, angel);
    expect([pt.power, pt.toughness]).toEqual([0, 1]);
    expect(pt.keywords).not.toContain("flying");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    const after = computeCharacteristics(game.state, registry, angel);
    expect([after.power, after.toughness]).toEqual([4, 4]);
  });
});

describe("top-10000 batch 36c — Furnace Reins", () => {
  it("steals, untaps and hastes a creature whose combat damage makes its thief a Treasure", () => {
    const { game } = setUp(["Furnace Reins"]);
    lands(game, "Mountain", 3);
    const bears = spawn(game, "Grizzly Bears", B);
    game.state.objects[bears].tapped = true;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Furnace Reins"), targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[bears].tapped).toBe(false);
    attackAlone(game, bears);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(18);
    expect(named(game, "Treasure Token", A)).toHaveLength(1);
    expect(named(game, "Treasure Token", B)).toHaveLength(0);
  });
});
