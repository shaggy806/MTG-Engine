/**
 * Ultima, Origin of Oblivion — {5} legendary 4/4 God.
 *
 *   Flying
 *   Whenever Ultima attacks, put a blight counter on target land. For as long
 *   as that land has a blight counter on it, it loses all land types and
 *   abilities and has "{T}: Add {C}."
 *   Whenever you tap a land for {C}, add an additional {C}.
 *
 * The blight is one effect: the grant isn't lost with the rest (rule 613.7).
 * The last ability is a triggered mana ability (rule 605.1b). How a
 * counter-bound duration ends is `effect-durations.test.ts`'s.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
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
  const ultima = game.debugSpawn("Ultima, Origin of Oblivion", A, "battlefield", { summoningSick: false });
  return { game, a, ultima };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
/** Attack with Ultima, blighting `land`. */
const blight = (game: Game, a: ScriptedController, ultima: ObjectId, land: ObjectId): void => {
  a.declareAttackersFn = () => [{ attacker: ultima, defender: B }];
  a.chooseTargetsFn = () => [{ kind: "object", object: land }];
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
};
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((action) => action.kind === "cast-spell" && action.card === card);

describe("Ultima, Origin of Oblivion", () => {
  it("blights the land it targets: no land types, no abilities, and '{T}: Add {C}'", () => {
    const { game, a, ultima } = setUp();
    const forest = spawn(game, "Forest", B);
    blight(game, a, ultima, forest);
    expect(game.state.objects[forest].counters).toEqual({ blight: 1 });
    const c = game.characteristics(forest);
    expect(c.types).toEqual(["land"]);
    expect(c.subtypes).toEqual([]);
    // It keeps its supertype (the ruling).
    expect(matchesFilter(game.state, registry, forest, { supertype: "basic", type: "land" }, { you: B })).toBe(true);
    // Its "{T}: Add {C}" is shown in place of the Forest's own ability.
    expect(game.viewFor(B).objects[forest]?.text).toBe("{T}: Add {C}.");
  });

  it("a blighted land of yours taps for {C}, and Ultima adds another: two for a Mind Stone, no {G}", () => {
    const { game, a, ultima } = setUp();
    const forest = spawn(game, "Forest", A);
    blight(game, a, ultima, forest);
    const elves = game.debugSpawn("Llanowar Elves", A, "hand");
    const stone = game.debugSpawn("Mind Stone", A, "hand");
    expect(castable(game, elves)).toBe(false);
    expect(castable(game, stone)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: stone });
    game.advanceUntil(quiet);
    expect(game.state.objects[stone].zone).toBe("battlefield");
    expect(game.state.objects[forest].tapped).toBe(true);
  });

  it("an extra {C} for a land tapped for {C} only: a Wastes, not a Forest, and not a Mind Stone", () => {
    const wastes = setUp();
    spawn(wastes.game, "Wastes", A);
    expect(castable(wastes.game, wastes.game.debugSpawn("Mind Stone", A, "hand"))).toBe(true);

    const forest = setUp();
    spawn(forest.game, "Forest", A);
    expect(castable(forest.game, forest.game.debugSpawn("Mind Stone", A, "hand"))).toBe(false);

    const rock = setUp();
    spawn(rock.game, "Mind Stone", A);
    expect(castable(rock.game, rock.game.debugSpawn("Mind Stone", A, "hand"))).toBe(false);
  });

  it("tapped by hand: a Wastes makes {C}{C}, a Forest just {G}", () => {
    const { game } = setUp();
    const tapByHand = (name: string): string[] => {
      const land = spawn(game, name, A);
      const tap = game
        .legalActions(A)
        .find((action) => action.kind === "activate-ability" && action.source === land);
      if (tap?.kind !== "activate-ability") throw new Error("no mana ability offered");
      const before = game.state.players[A].manaPool.length;
      game.dispatch({ type: "activate-ability", player: A, source: land, abilityIndex: tap.abilityIndex });
      return game.state.players[A].manaPool.slice(before).map((unit) => unit.type);
    };
    expect(tapByHand("Wastes")).toEqual(["C", "C"]);
    expect(tapByHand("Forest")).toEqual(["G"]);
  });
});
