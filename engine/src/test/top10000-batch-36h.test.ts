/**
 * Top-10000 batch 36h. Pins the clauses most likely to be wired wrong:
 * Words of Wisdom's "each other player draws a card", Stoic Rebuttal's
 * metalcraft cost reduction, Lorehold Charm's nontoken-only sacrifice and its
 * mana-value-2 artifact-or-creature return, Roar of Challenge's lure and its
 * ferocious rider, Samurai's Katana's job select, and Burrowguard Mentor's
 * count.
 */
import { describe, expect, it } from "vitest";

import { objHasKeyword, restrictionsOf } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = []): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
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
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;

describe("top-10000 batch 36h — Words of Wisdom", () => {
  it("you draw two, then each other player draws one", () => {
    const game = setUp(["Words of Wisdom"]);
    lands(game, "Island", 2);
    const [handA, handB] = [game.handOf(A).length, game.handOf(B).length];
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Words of Wisdom"), targets: [] });
    game.advanceUntil(quiet);
    // Words of Wisdom itself left the hand.
    expect(game.handOf(A).length).toBe(handA - 1 + 2);
    expect(game.handOf(B).length).toBe(handB + 1);
  });
});

describe("top-10000 batch 36h — Stoic Rebuttal", () => {
  const offered = (game: Game): boolean =>
    game.legalActions(A).some((a) => a.kind === "cast-spell" && a.cardName === "Stoic Rebuttal");

  it("costs {U}{U} with three artifacts, and counters the spell", () => {
    const game = setUp(["Stoic Rebuttal", "Ornithopter"]);
    lands(game, "Island", 2);
    lands(game, "Ornithopter", 3);
    const thopter = inHand(game, "Ornithopter");
    game.dispatch({ type: "cast-spell", player: A, card: thopter, targets: [] });
    expect(offered(game)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Stoic Rebuttal"), targets: [obj(thopter)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, thopter)).toBe("graveyard");
  });

  it("isn't castable for {U}{U} with only two artifacts", () => {
    const game = setUp(["Stoic Rebuttal", "Ornithopter"]);
    lands(game, "Island", 2);
    lands(game, "Ornithopter", 2);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Ornithopter"), targets: [] });
    expect(offered(game)).toBe(false);
  });
});

describe("top-10000 batch 36h — Lorehold Charm", () => {
  it("each opponent sacrifices a nontoken artifact — never a token", () => {
    const game = setUp(["Lorehold Charm"]);
    lands(game, "Plateau", 2);
    // A real token (debugSpawn makes a card).
    game.debugApplyEffect(B, { kind: "create-token", token: "Treasure Token", count: 1 }, []);
    game.advanceUntil(quiet);
    const [treasure] = named(game, "Treasure Token");
    const ring = spawn(game, "Sol Ring", B);
    const mine = spawn(game, "Sol Ring");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lorehold Charm"), targets: [], modes: [0] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, ring)).toBe("graveyard");
    expect(zoneOf(game, treasure)).toBe("battlefield");
    expect(zoneOf(game, mine)).toBe("battlefield");
  });

  it("returns an artifact or creature card with mana value 2 or less, not 3", () => {
    const game = setUp(["Lorehold Charm"]);
    lands(game, "Plateau", 2);
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const charm = inHand(game, "Lorehold Charm");
    const offer = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === charm);
    if (offer?.kind !== "cast-spell") throw new Error("Lorehold Charm not offered");
    const options = (offer.castModal?.modes[1].targetOptions[0] ?? []).map((t) =>
      t.kind === "object" ? t.object : null,
    );
    expect(options).toContain(ring);
    expect(options).toContain(bears);
    expect(options).not.toContain(giant);
    game.dispatch({ type: "cast-spell", player: A, card: charm, targets: [obj(ring)], modes: [1] });
    game.advanceUntil(quiet);
    expect(named(game, "Sol Ring")).toHaveLength(1);
  });
});

describe("top-10000 batch 36h — Roar of Challenge", () => {
  it("lures for the turn; indestructible only with ferocious", () => {
    const game = setUp(["Roar of Challenge", "Roar of Challenge"]);
    lands(game, "Forest", 6);
    const bears = spawn(game, "Grizzly Bears");
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Roar of Challenge");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(restrictionsOf(game.state, registry, bears).has("must-be-blocked")).toBe(true);
    expect(objHasKeyword(game.state, registry, bears, "indestructible")).toBe(false);

    spawn(game, "Colossal Dreadmaw");
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(objHasKeyword(game.state, registry, bears, "indestructible")).toBe(true);
  });
});

describe("top-10000 batch 36h — Samurai's Katana", () => {
  it("job select makes a 1/1 Hero and suits it up: 3/3, trample, haste, Samurai", () => {
    const game = setUp(["Samurai's Katana"]);
    lands(game, "Mountain", 3);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Samurai's Katana"), targets: [] });
    game.advanceUntil(quiet);
    const [hero] = named(game, "Hero Token (Black Mage's Rod)");
    expect(hero).toBeDefined();
    const [katana] = named(game, "Samurai's Katana");
    expect(game.state.objects[katana].attachedTo).toBe(hero);
    const view = game.characteristics(hero);
    expect([view.power, view.toughness]).toEqual([3, 3]);
    expect(view.subtypes).toContain("Samurai");
    expect(objHasKeyword(game.state, registry, hero, "trample")).toBe(true);
    expect(objHasKeyword(game.state, registry, hero, "haste")).toBe(true);
  });
});

describe("top-10000 batch 36h — Burrowguard Mentor", () => {
  it("is */* for the creatures you control, itself included, not an opponent's", () => {
    const game = setUp();
    const mentor = spawn(game, "Burrowguard Mentor");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    const view = game.characteristics(mentor);
    expect([view.power, view.toughness]).toEqual([2, 2]);
  });
});
