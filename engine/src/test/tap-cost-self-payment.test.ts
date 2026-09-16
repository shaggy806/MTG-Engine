/**
 * A permanent whose ability costs `{T}` can't also be tapped for mana to pay
 * that same ability's mana cost — it's being tapped as a cost, and rule
 * 602.2a doesn't let one permanent pay two tap costs at once.
 *
 * Mind Stone is the case that surfaced it: `{1}, {T}, Sacrifice Mind Stone:
 * Draw a card` was payable from an otherwise empty board, because the mana
 * planner was free to tap Mind Stone for its own `{T}: Add {C}`.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array(40).fill("Forest") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";

const onBattlefield = (game: Game, name: string): ObjectId => {
  const id = game.state.zones.shared.battlefield.find(
    (each) => game.state.objects[each]?.cardName === name,
  );
  if (id === undefined) throw new Error(`no ${name} on the battlefield`);
  return id;
};

/** The index of the ability whose printed text starts with `prefix`. */
const abilityIndex = (game: Game, id: ObjectId, prefix: string): number => {
  const def = game.registry.get(game.state.objects[id].cardName);
  const i = (def.activated ?? []).findIndex((ability) => ability.text.startsWith(prefix));
  if (i < 0) throw new Error(`no ability starting "${prefix}"`);
  return i;
};

describe("a `{T}` ability cost can't be paid for by tapping the same permanent", () => {
  it("won't let Mind Stone's draw ability fund its own {1}", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Mind Stone", A, "battlefield");
    const stone = onBattlefield(game, "Mind Stone");
    const draw = abilityIndex(game, stone, "{1}, {T}");

    // Nothing else on the board makes mana, so the `{1}` is unpayable.
    expect(
      game.whyCannotActivateAbility(A, stone, draw),
    ).toMatch(/cannot pay/);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: stone, abilityIndex: draw }),
    ).toThrow();
  });

  it("doesn't offer it as a legal action either", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Mind Stone", A, "battlefield");
    const stone = onBattlefield(game, "Mind Stone");
    const draw = abilityIndex(game, stone, "{1}, {T}");

    const offered = game
      .legalActions(A)
      .some((a) => a.kind === "activate-ability" && a.source === stone && a.abilityIndex === draw);
    expect(offered).toBe(false);
  });

  it("allows it once a separate source can pay the {1}", () => {
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Mind Stone", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const stone = onBattlefield(game, "Mind Stone");
    const draw = abilityIndex(game, stone, "{1}, {T}");
    const handBefore = game.handOf(A).length;

    expect(game.whyCannotActivateAbility(A, stone, draw)).toBeNull();
    game.dispatch({ type: "activate-ability", player: A, source: stone, abilityIndex: draw });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);

    expect(game.handOf(A).length).toBe(handBefore + 1);
    // The Forest paid, and Mind Stone is gone (sacrificed as a cost).
    expect(onBattlefield(game, "Forest")).toBeDefined();
    expect(
      game.state.zones.shared.battlefield.some(
        (id) => game.state.objects[id]?.cardName === "Mind Stone",
      ),
    ).toBe(false);
  });

  it("still lets a permanent tap for mana toward an ability that doesn't tap it", () => {
    // Sol Ring's own `{T}: Add {C}{C}` is the only mana around; a `{T}`-less
    // ability elsewhere may absolutely be paid for with it.
    const game = mkGame();
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Sol Ring", A, "battlefield");
    const ring = onBattlefield(game, "Sol Ring");
    expect(game.whyCannotActivateAbility(A, ring, 0)).toBeNull();
  });
});
