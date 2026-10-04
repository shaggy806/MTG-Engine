/**
 * Top-10000 batch 31e. No engine change: each test pins the clause of one
 * card most likely to be wired wrong — a donation that really changes
 * control (Harmless Offering), a kicked bounce that also draws (Into the
 * Roil), "you may exile it. If you do" before a search (Academy Rector), an
 * impulse per combat-damage event (Moria Marauder) and one that can't play a
 * land (Ramirez DePietro), each opponent's graveyard only (Dauntless
 * Scrapbot), hexproof only the turn the Aura entered (Shardmage's Rescue),
 * the hand-size static and the free cast (Djeru and Hazoret), the modes of
 * two modal triggers (Scaretiller, Lord Skitter's Butcher) and the Merfolk
 * lord (Mist Dancer).
 */
import { describe, expect, it } from "vitest";

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

const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
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
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
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
/** Put `name` onto the battlefield from the hand as a real entry, so its
 * enters triggers fire. */
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [obj(card)]);
  settle(game);
  return card;
};
const attackWith = (game: Game, attacker: ObjectId): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
  game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
};

describe("top-10000 batch 31e — Harmless Offering", () => {
  it("gives the targeted opponent control of the targeted permanent", () => {
    const { game } = setUp(["Harmless Offering"], "Mountain");
    lands(game, "Mountain", 3);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Harmless Offering"),
      targets: [{ kind: "player", player: B }, obj(bears)],
    });
    settle(game);
    expect(game.state.objects[bears].controller).toBe(B);
  });
});

describe("top-10000 batch 31e — Into the Roil", () => {
  it("bounces, and draws a card only when kicked", () => {
    const { game } = setUp(["Into the Roil", "Into the Roil"], "Island");
    lands(game, "Island", 6);
    const first = spawn(game, "Grizzly Bears", B);
    const second = spawn(game, "Hill Giant", B);
    const before = game.handOf(A).length;
    const [plain, kicked] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Into the Roil");
    game.dispatch({ type: "cast-spell", player: A, card: plain, targets: [obj(first)] });
    settle(game);
    expect(zone(game, first)).toBe("hand");
    expect(game.handOf(A).length).toBe(before - 1);
    game.dispatch({ type: "cast-spell", player: A, card: kicked, targets: [obj(second)], kicked: true });
    settle(game);
    expect(zone(game, second)).toBe("hand");
    // Two cast, one drawn.
    expect(game.handOf(A).length).toBe(before - 1);
  });
});

describe("top-10000 batch 31e — Academy Rector", () => {
  it("exiles itself as it dies to put an enchantment from the library onto the battlefield", () => {
    const { game } = setUp();
    const rector = spawn(game, "Academy Rector");
    const study = game.debugSpawn("Rhystic Study", A, "library");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(rector)]);
    settle(game);
    expect(zone(game, rector)).toBe("exile");
    expect(zone(game, study)).toBe("battlefield");
  });

  it("finds nothing when it isn't exiled", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [];
    const rector = spawn(game, "Academy Rector");
    const study = game.debugSpawn("Rhystic Study", A, "library");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(rector)]);
    settle(game);
    expect(zone(game, rector)).toBe("graveyard");
    expect(zone(game, study)).toBe("library");
  });
});

describe("top-10000 batch 31e — Moria Marauder", () => {
  it("exiles a card for each combat damage event of its double strike, playable this turn", () => {
    const { game } = setUp();
    const marauder = spawn(game, "Moria Marauder");
    const libraryBefore = game.state.zones.perPlayer[A].library.length;
    attackWith(game, marauder);
    expect(life(game, B)).toBe(18);
    expect(game.state.zones.perPlayer[A].library.length).toBe(libraryBefore - 2);
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === A);
    expect(exiled).toHaveLength(2);
    // A land exiled this way may be played.
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && exiled.includes(x.card))).toBe(true);
  });
});

describe("top-10000 batch 31e — Ramirez DePietro, Pillager", () => {
  it("loses 2 life and makes two Treasures as it enters", () => {
    const { game } = setUp();
    enter(game, "Ramirez DePietro, Pillager");
    expect(life(game, A)).toBe(18);
    expect(named(game, "Treasure Token")).toHaveLength(2);
  });

  it("exiles the top of the damaged player's library, and a land there can't be played", () => {
    const { game } = setUp();
    const ramirez = spawn(game, "Ramirez DePietro, Pillager");
    const top = game.state.zones.perPlayer[B].library[0];
    attackWith(game, ramirez);
    expect(life(game, B)).toBe(16);
    expect(zone(game, top)).toBe("exile");
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && x.card === top)).toBe(false);
  });
});

describe("top-10000 batch 31e — Dauntless Scrapbot", () => {
  it("exiles only the opponents' graveyards and makes a Lander", () => {
    const { game } = setUp();
    const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const mine = game.debugSpawn("Hill Giant", A, "graveyard");
    enter(game, "Dauntless Scrapbot");
    expect(zone(game, theirs)).toBe("exile");
    expect(zone(game, mine)).toBe("graveyard");
    expect(named(game, "Lander Token")).toHaveLength(1);
  });
});

describe("top-10000 batch 31e — Shardmage's Rescue", () => {
  it("gives hexproof only the turn it entered, and +1/+1 for good", () => {
    const { game } = setUp(["Shardmage's Rescue"], "Plains");
    lands(game, "Plains", 1);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Shardmage's Rescue"), targets: [obj(bears)] });
    settle(game);
    const now = computeCharacteristics(game.state, registry, bears);
    expect([now.power, now.toughness]).toEqual([3, 3]);
    expect(now.keywords.has("hexproof")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const later = computeCharacteristics(game.state, registry, bears);
    expect([later.power, later.toughness]).toEqual([3, 3]);
    expect(later.keywords.has("hexproof")).toBe(false);
  });
});

describe("top-10000 batch 31e — Djeru and Hazoret", () => {
  it("has vigilance and haste only with one or fewer cards in hand", () => {
    const { game } = setUp();
    const djeru = spawn(game, "Djeru and Hazoret");
    expect(computeCharacteristics(game.state, registry, djeru).keywords.has("haste")).toBe(false);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" }, []);
    settle(game);
    game.debugSpawn("Wastes", A, "hand");
    const keywords = computeCharacteristics(game.state, registry, djeru).keywords;
    expect(keywords.has("haste") && keywords.has("vigilance")).toBe(true);
  });

  it("exiles a legendary creature from the top six, castable free this turn, the rest to the bottom", () => {
    const { game } = setUp();
    const djeru = spawn(game, "Djeru and Hazoret");
    const kokusho = game.debugSpawn("Kokusho, the Evening Star", A, "library");
    const libraryBefore = game.state.zones.perPlayer[A].library.length;
    game.debugApplyEffect(A, registry.get("Djeru and Hazoret")!.triggered[0].effect!, [], { source: djeru });
    settle(game);
    expect(zone(game, kokusho)).toBe("exile");
    expect(game.state.zones.perPlayer[A].library.length).toBe(libraryBefore - 1);
    // No lands: castable only because it's free.
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === kokusho)).toBe(true);
  });
});

describe("top-10000 batch 31e — Scaretiller", () => {
  it("puts a land from the hand onto the battlefield tapped as it becomes tapped", () => {
    const { game, a } = setUp(["Forest"]);
    const tiller = spawn(game, "Scaretiller");
    const forest = inHand(game, "Forest");
    // The hand holds Wastes too: take the Forest.
    a.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === forest);
    game.debugApplyEffect(A, { kind: "tap", target: 0 }, [obj(tiller)]);
    settle(game);
    expect(zone(game, forest)).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
  });

  it("returns the targeted land card from the graveyard tapped", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [1];
    const tiller = spawn(game, "Scaretiller");
    const forest = game.debugSpawn("Forest", A, "graveyard");
    a.chooseTargetsFn = () => [obj(forest)];
    game.debugApplyEffect(A, { kind: "tap", target: 0 }, [obj(tiller)]);
    settle(game);
    expect(zone(game, forest)).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
  });
});

describe("top-10000 batch 31e — Lord Skitter's Butcher", () => {
  it("can give the creatures you control menace until end of turn", () => {
    const { game, a } = setUp();
    a.chooseModesFn = (_view, _min, _max, texts) => [texts.length - 1];
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    enter(game, "Lord Skitter's Butcher");
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("menace")).toBe(true);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("menace")).toBe(false);
    expect(named(game, "Rat Token (Can't Block)")).toHaveLength(0);
  });
});

describe("top-10000 batch 31e — Mist Dancer", () => {
  it("gives other Merfolk you control +1/+0 and flying", () => {
    const { game } = setUp();
    const dancer = spawn(game, "Mist Dancer");
    const looter = spawn(game, "Merfolk Looter");
    const theirs = spawn(game, "Merfolk Looter", B);
    const mine = computeCharacteristics(game.state, registry, looter);
    expect([mine.power, mine.toughness]).toEqual([2, 1]);
    expect(mine.keywords.has("flying")).toBe(true);
    const other = computeCharacteristics(game.state, registry, theirs);
    expect([other.power, other.keywords.has("flying")]).toEqual([1, false]);
    const self = computeCharacteristics(game.state, registry, dancer);
    expect([self.power, self.toughness]).toEqual([3, 3]);
  });
});
