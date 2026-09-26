/**
 * Myrkul, Lord of Bones — {4}{W}{B}{G} legendary 7/5 God.
 *
 *   As long as your life total is less than or equal to half your starting
 *   life total, Myrkul has indestructible.
 *   Whenever another nontoken creature you control dies, you may exile it. If
 *   you do, create a token that's a copy of that card, except it's an
 *   enchantment and loses all other card types.
 *
 * "A copy of that card" is of the card, not of the creature as it last
 * existed on the battlefield (its ruling). The subtypes that went with the
 * lost card types go too (rule 205.1a).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const myrkul = game.debugSpawn("Myrkul, Lord of Bones", A, "battlefield");
  return { game, a, myrkul };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const kill = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  game.advanceUntil(quiet);
};
const tokens = (game: Game, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].isToken === true && game.state.objects[id].controller === player,
  );

describe("Myrkul, Lord of Bones", () => {
  it("has indestructible only at half its controller's starting life or less", () => {
    const { game, myrkul } = setUp();
    const half = Math.floor(game.state.rules.startingLife / 2);
    game.state.players[A].life = half + 1;
    expect(game.characteristics(myrkul).keywords.has("indestructible")).toBe(false);
    game.state.players[A].life = half;
    expect(game.characteristics(myrkul).keywords.has("indestructible")).toBe(true);
    // Not an opponent's life.
    game.state.players[A].life = half + 1;
    game.state.players[B].life = 1;
    expect(game.characteristics(myrkul).keywords.has("indestructible")).toBe(false);
  });

  it("exiles a creature card of yours that died and makes an enchantment copy of it, abilities and all", () => {
    const { game } = setUp();
    const marshal = game.debugSpawn("Benalish Marshal", A, "battlefield");
    kill(game, marshal);
    expect(game.state.objects[marshal].zone).toBe("exile");
    const [token] = tokens(game);
    expect(token).toBeDefined();
    expect(nameOf(game.state.objects[token])).toBe("Benalish Marshal");
    const c = game.characteristics(token);
    // An enchantment, and no Human Knight: those went with "creature".
    expect(c.types).toEqual(["enchantment"]);
    expect(c.subtypes).toEqual([]);
    // Still a lord: "Other creatures you control get +1/+1."
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const b = game.characteristics(bears);
    expect([b.power, b.toughness]).toEqual([3, 3]);
    // Not a creature, so no P/T to show, and nothing for Myrkul to see die.
    expect(game.viewFor(A).objects[token]?.power ?? null).toBeNull();
  });

  it("copies the card, not the creature: a Bloodline Keeper that died transformed is a Bloodline Keeper", () => {
    const { game } = setUp();
    const keeper = game.debugSpawn("Bloodline Keeper", A, "battlefield");
    game.debugApplyEffect(A, { kind: "transform", target: 0 }, [{ kind: "object", object: keeper }]);
    expect(nameOf(game.state.objects[keeper])).toBe("Lord of Lineage");
    kill(game, keeper);
    const [token] = tokens(game);
    expect(nameOf(game.state.objects[token])).toBe("Bloodline Keeper");
    expect(game.characteristics(token).types).toEqual(["enchantment"]);
  });

  it("an artifact creature card loses its artifact types with it; a land creature its land types", () => {
    const { game } = setUp();
    kill(game, game.debugSpawn("Chronomaton", A, "battlefield"));
    kill(game, game.debugSpawn("Dryad Arbor", A, "battlefield"));
    const made = tokens(game).map((id) => {
      const c = game.characteristics(id);
      return [nameOf(game.state.objects[id]), c.types, c.subtypes];
    });
    expect(made).toEqual([
      ["Chronomaton", ["enchantment"], []],
      ["Dryad Arbor", ["enchantment"], []],
    ]);
  });

  it("not for a token, an opponent's creature, or itself", () => {
    const { game, myrkul } = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Vampire Token", count: 1 }, []);
    kill(game, tokens(game)[0]);
    kill(game, game.debugSpawn("Grizzly Bears", B, "battlefield"));
    kill(game, myrkul);
    expect(tokens(game)).toEqual([]);
    expect(tokens(game, B)).toEqual([]);
  });
});
