/**
 * Kudo, King Among Bears — {G}{W} 2/2 legendary Bear:
 *   Other creatures have base power and toughness 2/2 and are Bears in
 *   addition to their other types.
 *
 * Every other creature, whoever controls it; base P/T, so counters and
 * pumps land on top; and it ends when Kudo leaves. The layer rules behind it
 * are covered in `static-grants-to-others.test.ts`.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const KUDO = "Kudo, King Among Bears";
const registry = createDefaultRegistry();

function makeGame(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Forest") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const pt = (game: Game, id: ObjectId) => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};

describe("Kudo, King Among Bears", () => {
  it("is a {G}{W} 2/2 legendary Bear", () => {
    const def = registry.get(KUDO);
    expect(def.manaCost).toBe("{G}{W}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Bear"]);
    expect([def.power, def.toughness]).toEqual([2, 2]);
    expect(identityString(colorIdentityOf(def))).toBe("WG");
  });

  it("makes every other creature a 2/2 Bear, and nothing else", () => {
    const game = makeGame();
    const kudo = spawn(game, KUDO, A);
    const wurm = spawn(game, "Wurmcoil Engine", B);
    const elves = spawn(game, "Llanowar Elves", A);
    const ring = spawn(game, "Sol Ring", A);
    expect(pt(game, wurm)).toEqual([2, 2]);
    expect(pt(game, elves)).toEqual([2, 2]);
    expect(game.characteristics(wurm).subtypes).toEqual(["Phyrexian", "Wurm", "Bear"]);
    // Keywords are untouched: it's only a type and a base P/T.
    expect(game.characteristics(wurm).keywords.has("deathtouch")).toBe(true);
    expect(game.characteristics(ring).subtypes).toEqual([]);
    game.debugApplyEffect(
      A,
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      [{ kind: "object", object: kudo }],
    );
    // Not "other": Kudo keeps its own P/T and counters apply to it as usual.
    expect(pt(game, kudo)).toEqual([3, 3]);
  });

  it("puts counters and pumps on top of the 2/2, and ends when Kudo leaves", () => {
    const game = makeGame();
    const kudo = spawn(game, KUDO, A);
    const wurm = spawn(game, "Wurmcoil Engine", B);
    const ref = [{ kind: "object" as const, object: wurm }];
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, ref);
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      ref,
    );
    expect(pt(game, wurm)).toEqual([5, 3]);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: kudo }]);
    expect(pt(game, wurm)).toEqual([9, 7]);
    expect(game.characteristics(wurm).subtypes).not.toContain("Bear");
  });
});
