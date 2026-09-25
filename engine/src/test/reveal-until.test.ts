/**
 * `reveal-until` — a generalised cascade: reveal (or exile) cards from the
 * top of a library until one matches, place it, then place the rest. The
 * Prismatic Bridge's "reveal cards from the top of your library until you
 * reveal a creature or planeswalker card. Put that card onto the battlefield
 * and the rest on the bottom of your library in a random order", Umbris's
 * "target opponent exiles cards from the top of their library until they
 * exile a land card", and a "you may put that card onto the battlefield.
 * Then shuffle" that stops to ask.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Eight cards are drawn by Alice's first main phase (seven, and the draw);
 * seven by Bob's hand. Whatever follows is on top of the library. */
const deck = (drawn: number, top: readonly string[]): string[] => [
  ...Array<string>(drawn).fill("Plains"),
  ...top,
  ...Array<string>(30).fill("Plains"),
];

const setUp = (aTop: readonly string[], bTop: readonly string[] = [], yes = true) => {
  const a = new ScriptedController(A);
  a.chooseModesFn = (_view, _min, max) => (yes ? [0].slice(0, max) : []);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: deck(8, aTop) },
      { player: B, cards: deck(7, bTop) },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const run = (game: Game, effect: EffectSpec, targets: readonly TargetRef[] = []): void => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(A, effect, targets, { source });
  game.advanceUntil(quiet);
};
const libraryNames = (game: Game, player: PlayerId): string[] =>
  game.state.zones.perPlayer[player].library.map((id) => game.state.objects[id].cardName);
const battlefieldNames = (game: Game, player: PlayerId): string[] =>
  game.state.zones.shared.battlefield
    .filter((id) => game.state.objects[id].controller === player)
    .map((id) => game.state.objects[id].cardName);

/** The Prismatic Bridge's upkeep trigger. */
const BRIDGE: EffectSpec = {
  kind: "reveal-until",
  filter: { typesAnyOf: ["creature", "planeswalker"] },
  put: "battlefield",
  rest: "bottom-random",
};

describe("reveal until: put it onto the battlefield, the rest on the bottom", () => {
  it("The Prismatic Bridge", () => {
    const game = setUp(["Island", "Forest", "Grizzly Bears", "Swamp"]);
    const top = game.state.zones.perPlayer[A].library.slice(0, 3) as ObjectId[];
    expect(libraryNames(game, A).slice(0, 4)).toEqual(["Island", "Forest", "Grizzly Bears", "Swamp"]);
    run(game, BRIDGE);
    expect(battlefieldNames(game, A)).toContain("Grizzly Bears");
    // Revealed to everyone, all three.
    expect(game.eventsOfType("cards-revealed").at(-1)?.objects).toEqual(top);
    // The Swamp is on top now; the Island and Forest are at the bottom.
    const names = libraryNames(game, A);
    expect(names[0]).toBe("Swamp");
    expect(names.slice(-2).sort()).toEqual(["Forest", "Island"]);
    // Forty-two cards, eight drawn, one put onto the battlefield.
    expect(game.state.zones.perPlayer[A].library).toHaveLength(42 - 8 - 1);
  });

  it("nothing matching: every card is revealed, and all of them are the rest", () => {
    const game = setUp([]);
    run(game, { ...BRIDGE, rest: "graveyard" });
    expect(game.state.zones.perPlayer[A].library).toHaveLength(0);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(38 - 8);
  });
});

describe("exile until", () => {
  it("Umbris: target opponent exiles cards until they exile a land card, and they stay exiled", () => {
    const game = setUp([], ["Grizzly Bears", "Hill Giant", "Swamp", "Llanowar Elves"]);
    run(
      game,
      { kind: "reveal-until", whose: 0, filter: { type: "land" }, exile: true, rest: "stay" },
      [{ kind: "player", player: B }],
    );
    const exiled = game.state.zones.shared.exile.map((id) => game.state.objects[id].cardName);
    expect(exiled).toEqual(["Grizzly Bears", "Hill Giant", "Swamp"]);
    expect(libraryNames(game, B)[0]).toBe("Llanowar Elves");
  });
});

describe("a follow-up that asks", () => {
  /** "Reveal cards from the top of your library until you reveal a creature
   * card. You may put that card onto the battlefield. Then shuffle." */
  const MAY: EffectSpec = {
    kind: "reveal-until",
    filter: { type: "creature" },
    then: {
      kind: "may",
      prompt: "Put that card onto the battlefield?",
      effect: { kind: "put-onto-battlefield", target: 0 },
    },
    rest: "shuffle",
  };

  it("yes: it enters, and the library is shuffled once the answer is in", () => {
    const game = setUp(["Island", "Grizzly Bears"]);
    run(game, MAY);
    expect(battlefieldNames(game, A)).toContain("Grizzly Bears");
    expect(game.eventsOfType("library-shuffled").filter((e) => e.player === A)).toHaveLength(1);
    expect(game.state.zones.perPlayer[A].library).toHaveLength(40 - 8 - 1);
  });

  it("no: it stays in the library, which is shuffled all the same", () => {
    const game = setUp(["Island", "Grizzly Bears"], [], false);
    run(game, MAY);
    expect(battlefieldNames(game, A)).not.toContain("Grizzly Bears");
    expect(libraryNames(game, A)).toContain("Grizzly Bears");
    expect(game.eventsOfType("library-shuffled").filter((e) => e.player === A)).toHaveLength(1);
  });
});
