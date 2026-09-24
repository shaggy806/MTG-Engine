/**
 * Statics that change what *activated abilities* cost (rule 602.2b applies
 * rule 601.2f's cost increases and reductions to activation costs):
 * "Activated abilities of Foods you control cost {1} less to activate" (Sam,
 * Loyal Attendant) and "Activated abilities cost {2} more to activate unless
 * they're mana abilities" (Suppression Field's shape).
 *
 * The filter is matched against the ability's *source*, with the static's
 * controller as "you". Generic mana only, never below {0}, and a mana ability
 * is left alone. `legalActions`, activation and the `{X}` ceiling all price
 * the same cost.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Activated abilities of Foods you control cost {1} less to activate." */
const CHEF = "Test Food Chef";
/** "Activated abilities cost {2} more to activate unless they're mana
 * abilities." */
const FIELD = "Test Suppression";
/** "{X}, {T}: This deals X damage to any target." */
const CANNON = "Test X Cannon";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: CHEF,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Activated abilities of Foods you control cost {1} less to activate.",
      static: [
        {
          affects: { scope: "self" },
          abilityCostModification: {
            applies: { subtype: "Food", controlledBy: "you" },
            reduceGeneric: 1,
          },
          text: "Activated abilities of Foods you control cost {1} less to activate.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: FIELD,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Activated abilities cost {2} more to activate unless they're mana abilities.",
      static: [
        {
          affects: { scope: "self" },
          abilityCostModification: { applies: {}, increaseGeneric: 2 },
          text: "Activated abilities cost {2} more to activate unless they're mana abilities.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: CANNON,
      manaCost: "{0}",
      types: ["artifact"],
      text: "{X}, {T}: This deals X damage to any target.",
      activated: [
        {
          cost: { mana: "{X}", tap: true },
          targets: ["any-target"],
          effect: { kind: "damage", amount: "x", target: 0 },
          resolve: null,
          text: "{X}, {T}: This deals X damage to any target.",
        },
      ],
    }),
  );

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const lands = (game: Game, player: PlayerId, n: number): ObjectId[] =>
  Array.from({ length: n }, () => game.debugSpawn("Island", player, "battlefield"));
const canActivate = (game: Game, player: PlayerId, source: ObjectId): boolean =>
  game.legalActions(player).some((o) => o.kind === "activate-ability" && o.source === source);
const untapped = (game: Game, ids: readonly ObjectId[]): number =>
  ids.filter((id) => !game.state.objects[id].tapped).length;

describe("a reduction for abilities of a kind of permanent", () => {
  it("makes a Food's {2} ability cost {1}", () => {
    const game = setUp();
    const food = game.debugSpawn("Food Token", A, "battlefield");
    const island = lands(game, A, 1);
    expect(canActivate(game, A, food)).toBe(false);
    game.debugSpawn(CHEF, A, "battlefield");
    expect(canActivate(game, A, food)).toBe(true);

    game.dispatch({ type: "activate-ability", player: A, source: food, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(23);
    expect(untapped(game, island)).toBe(0);
  });

  it("reaches only the permanents its filter names, from its controller's view", () => {
    const game = setUp();
    game.debugSpawn(CHEF, A, "battlefield");
    const theirs = game.debugSpawn("Food Token", B, "battlefield");
    lands(game, B, 1);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    expect(canActivate(game, B, theirs)).toBe(false);
  });

  it("two reductions stack, and a cost can't go below {0}", () => {
    const game = setUp();
    const food = game.debugSpawn("Food Token", A, "battlefield");
    game.debugSpawn(CHEF, A, "battlefield");
    game.debugSpawn(CHEF, A, "battlefield");
    game.debugSpawn(CHEF, A, "battlefield");
    expect(canActivate(game, A, food)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: food, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(23);
  });
});

describe("an increase for every non-mana ability", () => {
  it("adds {2} to a Food's ability and to a {T}-only ability, but not to a land's mana", () => {
    const game = setUp();
    const food = game.debugSpawn("Food Token", A, "battlefield");
    const cannon = game.debugSpawn(CANNON, A, "battlefield");
    const island = lands(game, A, 3);
    game.debugSpawn(FIELD, A, "battlefield");
    // {2} + {2} is more than three Islands make.
    expect(canActivate(game, A, food)).toBe(false);
    // The Islands' own mana abilities still work.
    expect(canActivate(game, A, island[0])).toBe(true);

    // {X} with X = 1 costs {1} + {2}: the most three Islands pay for.
    const offer = game
      .legalActions(A)
      .find((o) => o.kind === "activate-ability" && o.source === cannon);
    expect(offer?.kind === "activate-ability" ? offer.xCost?.maxX : undefined).toBe(1);
  });
});
