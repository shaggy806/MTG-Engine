/**
 * Raised by Giants — {5}{G} Legendary Enchantment — Background:
 *   Commander creatures you own have base power and toughness 10/10 and are
 *   Giants in addition to their other types.
 *
 * Only commanders, only yours (by ownership, so one an opponent has stolen
 * still counts), and it pairs with a "Choose a Background" commander.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { canPairCommanders, isBackground } from "../deck-validation.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const GIANTS = "Raised by Giants";
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

const spawn = (game: Game, name: string, player: PlayerId, commander = false): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  if (commander) game.state.objects[id].isCommander = true;
  return id;
};
const pt = (game: Game, id: ObjectId) => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};

describe("Raised by Giants", () => {
  it("is a {5}{G} legendary Background that pairs with Choose a Background", () => {
    const def = registry.get(GIANTS);
    expect(def.manaCost).toBe("{5}{G}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["enchantment"]);
    expect(isBackground(def)).toBe(true);
    expect(identityString(colorIdentityOf(def))).toBe("G");
    expect(canPairCommanders(registry, "Ganax, Astral Hunter", GIANTS)).toBe(true);
  });

  it("makes your commander creatures 10/10 Giants, counters on top", () => {
    const game = makeGame();
    spawn(game, GIANTS, A);
    const mine = spawn(game, "Grizzly Bears", A, true);
    const plain = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Bria, Riptide Rogue", B, true);
    expect(pt(game, mine)).toEqual([10, 10]);
    expect(game.characteristics(mine).subtypes).toEqual(["Bear", "Giant"]);
    expect(game.characteristics(plain).subtypes).toEqual(["Bear"]);
    expect(pt(game, plain)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([3, 3]);
    game.debugApplyEffect(
      A,
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      [{ kind: "object", object: mine }],
    );
    expect(pt(game, mine)).toEqual([12, 12]);
  });

  it("reaches a commander you own that an opponent controls", () => {
    const game = makeGame();
    spawn(game, GIANTS, A);
    const mine = spawn(game, "Grizzly Bears", A, true);
    game.debugApplyEffect(
      B,
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      [{ kind: "object", object: mine }],
    );
    expect(game.state.objects[mine].controller).toBe(B);
    expect(pt(game, mine)).toEqual([10, 10]);
  });
});
