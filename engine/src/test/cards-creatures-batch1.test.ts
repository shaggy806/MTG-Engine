/**
 * Creatures batch 1 — the spell-cast, draw and mana cards.
 *
 * Beast Whisperer (a creature spell you cast draws; its own cast and a
 * noncreature spell don't), Faerie Mastermind (an opponent's second draw
 * each turn, not their first or yours; {3}{U} makes everyone draw), Sram
 * (Aura / Equipment / Vehicle spells), Lotho (anyone's second spell, not its
 * own cast), Goblin Anarchomancer (red or green spells you cast cost {1}
 * less, once), Delighted Halfling (legendary-only mana that makes the spell
 * uncounterable).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const registry = createDefaultRegistry().register(
  defineCard({
    name: "Test Vehicle",
    manaCost: "{1}",
    types: ["artifact"],
    subtypes: ["Vehicle"],
  }),
);

const setUp = (aHand: readonly string[] = [], bHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const lands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};
/** Cast `name` from `player`'s hand and settle; returns the hand-size change. */
const cast = (
  game: Game,
  player: PlayerId,
  name: string,
  targets: readonly TargetRef[] = [],
): number => {
  const before = game.handOf(player).length;
  game.dispatch({ type: "cast-spell", player, card: inHand(game, player, name), targets });
  game.advanceUntil(quiet);
  return game.handOf(player).length - before;
};
const canCast = (game: Game, player: PlayerId, name: string): boolean =>
  game.canDispatch({ type: "cast-spell", player, card: inHand(game, player, name), targets: [] }) ===
  null;
const draw = (game: Game, player: PlayerId, amount: number): void => {
  game.debugApplyEffect(player, { kind: "draw", amount });
  game.advanceUntil(quiet);
};
const count = (game: Game, player: PlayerId, name: string): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const toBobsMain = (game: Game): void =>
  game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));

describe("Beast Whisperer", () => {
  it("draws a card when you cast a creature spell", () => {
    const { game } = setUp(["Grizzly Bears"]);
    game.debugSpawn("Beast Whisperer", A, "battlefield");
    lands(game, A, "Forest", 2);
    expect(cast(game, A, "Grizzly Bears")).toBe(0); // -1 cast, +1 drawn
  });

  it("doesn't draw for a noncreature spell, for its own cast, or for an opponent's creature", () => {
    const { game } = setUp(["Bonesplitter", "Beast Whisperer"], ["Grizzly Bears"]);
    lands(game, A, "Forest", 5);
    // Cast from hand, the Whisperer is on the stack, where its ability
    // doesn't function.
    expect(cast(game, A, "Beast Whisperer")).toBe(-1);
    expect(cast(game, A, "Bonesplitter")).toBe(-1);

    toBobsMain(game);
    lands(game, B, "Forest", 2);
    const mine = game.handOf(A).length;
    cast(game, B, "Grizzly Bears");
    expect(game.handOf(A).length).toBe(mine);
  });
});

describe("Faerie Mastermind", () => {
  it("draws on an opponent's second card each turn, and only that one", () => {
    const { game } = setUp();
    game.debugSpawn("Faerie Mastermind", A, "battlefield");
    const mine = game.handOf(A).length;
    draw(game, B, 1); // Bob's first card this turn
    expect(game.handOf(A).length).toBe(mine);
    draw(game, B, 1); // his second
    expect(game.handOf(A).length).toBe(mine + 1);
    draw(game, B, 1); // his third
    expect(game.handOf(A).length).toBe(mine + 1);
  });

  it("ignores your own second card", () => {
    const { game } = setUp();
    game.debugSpawn("Faerie Mastermind", A, "battlefield");
    // Alice drew in her draw step; this is her second card of the turn.
    const mine = game.handOf(A).length;
    draw(game, A, 1);
    expect(game.handOf(A).length).toBe(mine + 1);
  });

  it("{3}{U}: each player draws a card", () => {
    const { game } = setUp();
    const faerie = game.debugSpawn("Faerie Mastermind", A, "battlefield");
    lands(game, A, "Island", 4);
    const [mine, theirs] = [game.handOf(A).length, game.handOf(B).length];
    game.dispatch({ type: "activate-ability", player: A, source: faerie, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(mine + 1);
    expect(game.handOf(B).length).toBe(theirs + 1);
  });
});

describe("Sram, Senior Edificer", () => {
  it("draws for an Aura, an Equipment and a Vehicle spell", () => {
    const { game } = setUp(["Holy Strength", "Bonesplitter", "Test Vehicle"]);
    game.debugSpawn("Sram, Senior Edificer", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    lands(game, A, "Plains", 3);
    expect(cast(game, A, "Holy Strength", [{ kind: "object", object: bears }])).toBe(0);
    expect(cast(game, A, "Bonesplitter")).toBe(0);
    expect(cast(game, A, "Test Vehicle")).toBe(0);
  });

  it("doesn't draw for another artifact or enchantment", () => {
    const { game } = setUp(["Sol Ring", "Ever-Watching Threshold"]);
    game.debugSpawn("Sram, Senior Edificer", A, "battlefield");
    lands(game, A, "Island", 4);
    expect(cast(game, A, "Sol Ring")).toBe(-1);
    expect(cast(game, A, "Ever-Watching Threshold")).toBe(-1);
  });
});

describe("Lotho, Corrupt Shirriff", () => {
  it("loses 1 life and makes a Treasure on each player's second spell, not the first or third", () => {
    const { game } = setUp(["Sol Ring", "Bonesplitter", "Lightning Greaves"], ["Sol Ring", "Bonesplitter"]);
    game.debugSpawn("Lotho, Corrupt Shirriff", A, "battlefield");
    lands(game, A, "Island", 4);
    cast(game, A, "Sol Ring");
    expect(count(game, A, "Treasure Token")).toBe(0);
    cast(game, A, "Bonesplitter");
    expect(count(game, A, "Treasure Token")).toBe(1);
    expect(game.state.players[A].life).toBe(19);
    cast(game, A, "Lightning Greaves");
    expect(count(game, A, "Treasure Token")).toBe(1);

    // Bob's second spell pays Lotho's controller, not Bob.
    toBobsMain(game);
    lands(game, B, "Island", 2);
    cast(game, B, "Sol Ring");
    cast(game, B, "Bonesplitter");
    expect(count(game, A, "Treasure Token")).toBe(2);
    expect(count(game, B, "Treasure Token")).toBe(0);
    expect(game.state.players[A].life).toBe(18);
    expect(game.state.players[B].life).toBe(20);
  });

  it("doesn't trigger off its own cast as the second spell", () => {
    const { game } = setUp(["Sol Ring", "Lotho, Corrupt Shirriff", "Bonesplitter"]);
    // Two of each colour, so Sol Ring can't strand the {W}{B}.
    lands(game, A, "Plains", 2);
    lands(game, A, "Swamp", 2);
    cast(game, A, "Sol Ring");
    cast(game, A, "Lotho, Corrupt Shirriff");
    expect(count(game, A, "Lotho, Corrupt Shirriff")).toBe(1);
    // The third spell isn't anyone's second either.
    cast(game, A, "Bonesplitter");
    expect(count(game, A, "Treasure Token")).toBe(0);
    expect(game.state.players[A].life).toBe(20);
  });
});

describe("Goblin Anarchomancer", () => {
  it("takes {1} off your red or green spells", () => {
    const { game } = setUp(["Grizzly Bears"]);
    game.debugSpawn("Goblin Anarchomancer", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    // {1}{G} with one Forest.
    expect(canCast(game, A, "Grizzly Bears")).toBe(true);
  });

  it("takes only {1} off a spell that's both red and green", () => {
    const { game } = setUp(["Ruric Thar, the Unbowed"]);
    game.debugSpawn("Goblin Anarchomancer", A, "battlefield");
    // {4}{R}{G} costs {3}{R}{G}: four lands can't pay it, five can.
    game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    lands(game, A, "Island", 2);
    expect(canCast(game, A, "Ruric Thar, the Unbowed")).toBe(false);
    game.debugSpawn("Island", A, "battlefield");
    expect(canCast(game, A, "Ruric Thar, the Unbowed")).toBe(true);
  });

  it("takes nothing off a colourless or blue spell, or off an opponent's green one", () => {
    const { game } = setUp(["Bonesplitter", "Ever-Watching Threshold"], ["Grizzly Bears"]);
    game.debugSpawn("Goblin Anarchomancer", A, "battlefield");
    // Discounted, the {1} Bonesplitter would be free.
    expect(canCast(game, A, "Bonesplitter")).toBe(false);
    lands(game, A, "Island", 2);
    expect(canCast(game, A, "Ever-Watching Threshold")).toBe(false);

    toBobsMain(game);
    game.debugSpawn("Forest", B, "battlefield");
    expect(canCast(game, B, "Grizzly Bears")).toBe(false);
  });
});

describe("Delighted Halfling", () => {
  it("pays for a legendary spell with any colour, and that spell can't be countered", () => {
    const { game } = setUp(["Yoshimaru, Ever Faithful"], ["Counterspell"]);
    game.debugSpawn("Delighted Halfling", A, "battlefield", { summoningSick: false });
    lands(game, B, "Island", 2);
    const counter = game.debugSpawn("Counterspell", B, "hand");
    // The {W} can only come from the Halfling's restricted ability.
    const yoshimaru = inHand(game, A, "Yoshimaru, Ever Faithful");
    game.dispatch({ type: "cast-spell", player: A, card: yoshimaru, targets: [] });
    expect(game.state.objects[yoshimaru].uncounterable).toBe(true);
    game.advanceUntil((s) => s.priority.holder === B || quiet(s));
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: counter,
      targets: [{ kind: "object", object: yoshimaru }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[yoshimaru].zone).toBe("battlefield");
  });

  it("won't pay a nonlegendary spell's coloured pip, and its {C} protects nothing", () => {
    const { game } = setUp(["Grizzly Bears"]);
    game.debugSpawn("Delighted Halfling", A, "battlefield", { summoningSick: false });
    game.debugSpawn("Plains", A, "battlefield");
    // {1}{G}: the {G} would have to be the restricted mana.
    expect(canCast(game, A, "Grizzly Bears")).toBe(false);

    const { game: g2 } = setUp(["Grizzly Bears"]);
    g2.debugSpawn("Delighted Halfling", A, "battlefield", { summoningSick: false });
    g2.debugSpawn("Forest", A, "battlefield");
    // The Forest's {G} and the Halfling's plain {C} pay for it — no clause.
    const bears = inHand(g2, A, "Grizzly Bears");
    g2.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    expect(g2.state.objects[bears].uncounterable).toBeUndefined();
  });
});
