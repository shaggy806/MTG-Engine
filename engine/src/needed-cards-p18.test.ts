/**
 * needed-cards P18 — three cards found to need zero new vocab during a full
 * pass over `neededCards.txt`'s "not yet" list against real Scryfall text and
 * the engine's *current* vocabulary (grown considerably since some of those
 * FEATURE notes were first written): Ganax, Astral Hunter (a plain Dragon-ETB
 * Treasure trigger — the file's old note described a different, wrong
 * mechanic), Dragon Tempest (its two triggers are exactly `grant-keyword`
 * `target: "trigger-object"` and `damage` `amount: { countOf }`, both already
 * shipped), and Lotus Field (`sacrifice` already degrades gracefully below
 * its count, and `add-mana "any-color"` already picks one color for the
 * whole activation).
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const cast = (game: Game, player: PlayerId, name: string): void => {
  game.dispatch({ type: "cast-spell", player, card: named(game, game.handOf(player), name) });
};
const playLand = (game: Game, player: PlayerId, name: string): void => {
  game.dispatch({ type: "play-land", player, card: named(game, game.handOf(player), name) });
};

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return { game, a };
};

describe("Ganax, Astral Hunter", () => {
  it("makes a Treasure off its own ETB and off every other Dragon's", () => {
    const { game } = makeGame(["Ganax, Astral Hunter", "Lathliss, Dragon Queen"]);
    // {4}{R} + {4}{R}{R} = 11 mana; a comfortable surplus so the auto-payer
    // never runs short regardless of which lands it taps for the generic.
    for (let i = 0; i < 14; i += 1) game.debugSpawn("Mountain", A);

    cast(game, A, "Ganax, Astral Hunter");
    game.advanceUntil(settled);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token")).toHaveLength(1);

    cast(game, A, "Lathliss, Dragon Queen");
    game.advanceUntil(settled);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token")).toHaveLength(2);
  });
});

describe("Dragon Tempest", () => {
  it("grants haste to an entering flier and deals X damage on a Dragon's entry", () => {
    const { game, a } = makeGame(["Serra Angel", "Lathliss, Dragon Queen"]);
    game.debugSpawn("Dragon Tempest", A);
    // {3}{W}{W} + {4}{R}{R} = 11 mana; a comfortable surplus of each color so
    // the auto-payer never runs short on a colored pip for either cast.
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Plains", A);
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Mountain", A);

    cast(game, A, "Serra Angel");
    game.advanceUntil(settled);
    const angel = named(game, game.battlefield, "Serra Angel");
    expect(game.characteristics(angel).keywords.has("haste")).toBe(true);

    a.chooseTargetsFn = (_v, _source, _specs, legalOptions) => [
      legalOptions[0].find((ref) => ref.kind === "player" && ref.player === B)!,
    ];
    cast(game, A, "Lathliss, Dragon Queen");
    game.advanceUntil(settled);
    const lathliss = named(game, game.battlefield, "Lathliss, Dragon Queen");
    // One Dragon you control (Lathliss counts itself) ⇒ 1 damage to Bob.
    expect(game.state.players[B].life).toBe(19);
    expect(game.characteristics(lathliss).keywords.has("haste")).toBe(true);
  });
});

describe("Lotus Field", () => {
  it("enters tapped, then makes you sacrifice two other lands", () => {
    const { game, a } = makeGame(["Lotus Field"]);
    game.debugSpawn("Forest", A);
    game.debugSpawn("Swamp", A);

    // Deliberately choose the two *other* lands, not Lotus Field itself, so
    // the assertions below are unambiguous regardless of eligible-list order.
    a.chooseSacrificesFn = (_v, eligible) =>
      eligible.filter((id) => game.state.objects[id].cardName !== "Lotus Field");
    playLand(game, A, "Lotus Field");
    game.advanceUntil(settled);

    const field = named(game, game.battlefield, "Lotus Field");
    expect(game.state.objects[field]?.tapped).toBe(true);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest")).toHaveLength(0);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Swamp")).toHaveLength(0);
  });

  it("sacrifices itself too when you have no other land to give up", () => {
    // Real Lotus Field rules interaction: "sacrifice two lands" with none
    // else on the battlefield sacrifices every land you control, itself
    // included — `sacrificeByEffect` auto-resolves when the eligible count
    // doesn't exceed what's owed, with no decision to make.
    const { game } = makeGame(["Lotus Field"]);

    playLand(game, A, "Lotus Field");
    game.advanceUntil(settled);

    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Lotus Field")).toHaveLength(0);
  });

  it("taps for three mana of one color", () => {
    const { game } = makeGame([]);
    // Lotus Field's own enters-tapped replacement always applies via
    // debugSpawn (`opts.tapped` can only force it *true*, never override it
    // back to false) — untap it directly to test the mana ability alone.
    const field = game.debugSpawn("Lotus Field", A, "battlefield");
    game.state.objects[field]!.tapped = false;

    game.dispatch({ type: "activate-ability", player: A, source: field, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.W).toBe(3);
  });
});
