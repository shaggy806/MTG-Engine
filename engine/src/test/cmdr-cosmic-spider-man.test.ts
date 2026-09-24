/**
 * Cosmic Spider-Man — {W}{U}{B}{R}{G} 5/5 legendary Spider Human Hero:
 *   Flying, first strike, trample, lifelink, haste
 *   At the beginning of combat on your turn, other Spiders you control gain
 *   flying, first strike, trample, lifelink, and haste until end of turn.
 *
 * Only *other* Spiders you control, only on your turn, only those there as
 * the trigger resolves, and only until end of turn.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const SPIDEY = "Cosmic Spider-Man";
const GRANTED = ["flying", "first-strike", "trample", "lifelink", "haste"] as const;
const registry = createDefaultRegistry();

const makeGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
};

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const keywords = (game: Game, id: ObjectId): string[] => [...game.characteristics(id).keywords];
const hasAll = (game: Game, id: ObjectId): boolean =>
  GRANTED.every((k) => game.characteristics(id).keywords.has(k));
const hasNone = (game: Game, id: ObjectId): boolean =>
  GRANTED.every((k) => !game.characteristics(id).keywords.has(k));

describe("Cosmic Spider-Man", () => {
  it("is a WUBRG 5/5 legendary Spider Human Hero with five keywords", () => {
    const def = registry.get(SPIDEY);
    expect(def.manaCost).toBe("{W}{U}{B}{R}{G}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Spider", "Human", "Hero"]);
    expect([def.power, def.toughness]).toEqual([5, 5]);
    expect(def.keywords).toEqual([...GRANTED]);
    expect(identityString(colorIdentityOf(def))).toBe("WUBRG");
  });

  it("gives other Spiders you control the five keywords at the beginning of combat on your turn", () => {
    const { game } = makeGame();
    const spidey = spawn(game, SPIDEY, A);
    const spider = spawn(game, "Giant Spider", A);
    const bears = spawn(game, "Grizzly Bears", A);
    const theirSpider = spawn(game, "Giant Spider", B);

    expect(hasNone(game, spider)).toBe(true);
    game.advanceUntil((s) => s.turn.step === "declare-attackers");

    expect(hasAll(game, spider)).toBe(true);
    expect(hasAll(game, spidey)).toBe(true);
    expect(hasNone(game, bears)).toBe(true);
    expect(hasNone(game, theirSpider)).toBe(true);
    // The grant is one modifier per keyword on the other Spider only.
    expect(game.state.objects[spidey].modifiers).toHaveLength(0);
    expect(keywords(game, spider)).toContain("reach");
  });

  it("lasts until end of turn, and a Spider arriving after the trigger misses it", () => {
    const { game } = makeGame();
    spawn(game, SPIDEY, A);
    const spider = spawn(game, "Giant Spider", A);
    game.advanceUntil((s) => s.turn.step === "declare-attackers");
    const late = spawn(game, "Giant Spider", A);
    expect(hasNone(game, late)).toBe(true);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-attackers");
    expect(hasNone(game, spider)).toBe(true);
  });

  it("does nothing at the beginning of an opponent's combat", () => {
    const { game } = makeGame();
    spawn(game, SPIDEY, B);
    const spider = spawn(game, "Giant Spider", B);
    game.advanceUntil((s) => s.turn.step === "declare-attackers");
    expect(game.state.turn.number).toBe(1);
    expect(hasNone(game, spider)).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-attackers");
    expect(hasAll(game, spider)).toBe(true);
  });
});
