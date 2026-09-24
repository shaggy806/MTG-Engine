/**
 * Replacements on a player's events: a mill multiplied (Bruvac the
 * Grandiloquent's "if an opponent would mill one or more cards, they mill
 * twice that many cards instead"), life gain changed (Bilbo, Birthday
 * Celebrant's "…that much life plus 1 instead"; The Lord of Pain's "your
 * opponents can't gain life", lifelink included), and "if you would draw a
 * card, draw two cards instead".
 */

import { describe, expect, it } from "vitest";

import type { StaticAbility } from "../cards/define.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const enchantment = (name: string, replacement: StaticAbility["replacement"]) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    static: [{ affects: { scope: "self" }, replacement, text: name }],
  });

const BRUVAC = "Test Grandiloquent";
const BILBO = "Test Birthday Celebrant";
const LORD = "Test Lord of Pain";
const SCHOLAR = "Test Double Drawer";
const registry = createDefaultRegistry()
  .register(enchantment(BRUVAC, { event: "would-mill", who: "opponent", multiplier: 2 }))
  .register(enchantment(BILBO, { event: "would-gain-life", who: "you", plus: 1 }))
  .register(enchantment(LORD, { event: "would-gain-life", who: "opponent", prevent: true }))
  .register(enchantment(SCHOLAR, { event: "would-draw", who: "you", instead: { draws: 2 } }));

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const run = (game: Game, effect: EffectSpec, player: PlayerId = A): void => {
  const source = game.debugSpawn("Island", player, "battlefield");
  game.debugApplyEffect(player, effect, [], { source });
};
const graveyard = (game: Game, player: PlayerId): number => game.state.zones.perPlayer[player].graveyard.length;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe("would mill", () => {
  it("Bruvac: an opponent mills twice that many; you don't", () => {
    const game = setUp();
    game.debugSpawn(BRUVAC, A, "battlefield");
    run(game, { kind: "mill", target: "each-opponent", amount: 3 });
    expect(graveyard(game, B)).toBe(6);
    run(game, { kind: "mill", target: "you", amount: 3 });
    expect(graveyard(game, A)).toBe(3);
  });
});

describe("would gain life", () => {
  it("Bilbo: you gain that much plus 1 — an opponent doesn't", () => {
    const game = setUp();
    game.debugSpawn(BILBO, A, "battlefield");
    run(game, { kind: "gain-life", amount: 2 });
    expect(life(game, A)).toBe(23);
    run(game, { kind: "gain-life", amount: 2 }, B);
    expect(life(game, B)).toBe(22);
  });

  it("The Lord of Pain: opponents can't gain life, lifelink included", () => {
    const game = setUp();
    game.debugSpawn(LORD, A, "battlefield");
    run(game, { kind: "gain-life", amount: 5 }, B);
    expect(life(game, B)).toBe(20);
    run(game, { kind: "gain-life", amount: 5 });
    expect(life(game, A)).toBe(25);
    // A lifelinker of Bob's deals damage: no life for Bob.
    const vampire = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugApplyEffect(B, { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" }, [
      { kind: "object", object: vampire },
    ]);
    game.debugApplyEffect(B, { kind: "damage", amount: 2, target: 0 }, [{ kind: "player", player: A }], {
      source: vampire,
    });
    expect(life(game, A)).toBe(23);
    expect(life(game, B)).toBe(20);
  });
});

describe("would draw", () => {
  it("draw two instead — each draw, and only yours", () => {
    const game = setUp();
    game.debugSpawn(SCHOLAR, A, "battlefield");
    const [handA, handB] = [game.handOf(A).length, game.handOf(B).length];
    run(game, { kind: "draw", amount: 3 });
    expect(game.handOf(A).length).toBe(handA + 6);
    run(game, { kind: "draw", amount: 1 }, B);
    expect(game.handOf(B).length).toBe(handB + 1);
  });
});
