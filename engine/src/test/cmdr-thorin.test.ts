/**
 * Thorin, King of Durin's Folk — both printed clauses driven through the real
 * `Game`:
 *
 * - "Whenever Thorin or another Dwarf you control enters, create a Treasure
 *   token." — Thorin's own entry counts, every other Dwarf you control counts,
 *   once each; a Dwarf entering under an *opponent's* control and a non-Dwarf
 *   entering under yours both do nothing.
 * - "Other Dwarves you control get +1/+0 for each artifact token you control."
 *   — **other**: Thorin itself never gets it; **Dwarves**: a non-Dwarf creature
 *   you control never gets it; **you control**: an opponent's Dwarf never gets
 *   it, and their artifact tokens never count; **artifact token**: a printed
 *   artifact card (Sol Ring) doesn't count and a Food token does; **+1/+0**:
 *   toughness is untouched. The count is live, so a Treasure leaving shrinks
 *   the bonus again.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const THORIN = "Thorin, King of Durin's Folk";

/** A vanilla Dwarf: the pool has no other one, so the test registers its own
 * for the "another Dwarf" / "other Dwarves" halves. Test-only, never pooled. */
const TEST_DWARF = "Test Dwarf";
const registry = createDefaultRegistry().register(
  defineCard({
    name: TEST_DWARF,
    manaCost: "{1}{R}",
    colors: ["R"],
    types: ["creature"],
    subtypes: ["Dwarf"],
    power: 2,
    toughness: 2,
  }),
);

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array<string>(Math.max(0, 40 - cards.length)).fill("Plains"),
];

const makeGame = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
};

/** Board setup: silent by default, so six lands don't fire six ETB triggers.
 * `announce` is for the entry that's actually under test. */
const spawn = (game: Game, name: string, player: PlayerId, announce = false): ObjectId =>
  game.debugSpawn(name, player, "battlefield", {
    summoningSick: false,
    announceEntry: announce,
  });

/** Nothing on the stack, nothing waiting to go on it, nobody owing an answer.
 * `pendingTriggers` is in there because a freshly-announced entry parks its
 * trigger there before `prepareForPriority` places it — without it the
 * predicate is already true the instant after the spawn. */
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Artifact tokens of one kind a player controls, counting a compacted stack
 * as every token in it. */
const tokensOf = (game: Game, player: PlayerId, name: string): number =>
  game.state.zones.shared.battlefield
    .filter((id) => {
      const o = game.state.objects[id];
      return o.cardName === name && o.controller === player;
    })
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

const treasures = (game: Game, player: PlayerId): number =>
  tokensOf(game, player, "Treasure Token");

describe("Thorin, King of Durin's Folk", () => {
  it("is a 4/4 red-white legendary Dwarf Noble with one ETB trigger and one lord clause", () => {
    const def = registry.get(THORIN);
    expect(def.manaCost).toBe("{3}{R}{W}");
    expect(def.colors).toEqual(["R", "W"]);
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["creature"]);
    expect(def.subtypes).toEqual(["Dwarf", "Noble"]);
    expect([def.power, def.toughness]).toEqual([4, 4]);
    expect(def.keywords).toEqual([]);
    expect(identityString(colorIdentityOf(def))).toBe("WR");
    // The client prints `text` verbatim: one line per printed ability.
    expect(def.text.split("\n")).toEqual([
      "Whenever Thorin or another Dwarf you control enters, create a Treasure token.",
      "Other Dwarves you control get +1/+0 for each artifact token you control.",
    ]);

    expect(def.triggered).toHaveLength(1);
    expect(def.triggered[0].trigger).toEqual({
      on: "enters-battlefield",
      who: "you-control",
      filter: { subtype: "Dwarf" },
    });
    expect(def.triggered[0].effect).toEqual({
      kind: "create-token",
      token: "Treasure Token",
      count: 1,
    });

    expect(def.static).toHaveLength(1);
    expect(def.static[0].affects).toEqual({
      scope: "creatures-you-control",
      subtype: "Dwarf",
      excludeSelf: true,
    });
    expect(def.static[0].grantPtPerCount).toEqual({
      filter: { type: "artifact", token: true, controlledBy: "you" },
      pt: [1, 0],
    });
  });

  it("makes a Treasure when Thorin itself enters", () => {
    const { game } = makeGame();
    expect(treasures(game, A)).toBe(0);

    spawn(game, THORIN, A, true);
    game.advanceUntil(settled);

    expect(treasures(game, A)).toBe(1);
  });

  it("makes a Treasure when another Dwarf you control enters — one per Dwarf", () => {
    const { game } = makeGame();
    spawn(game, THORIN, A); // already out; its own entry isn't under test here
    expect(treasures(game, A)).toBe(0);

    spawn(game, TEST_DWARF, A, true);
    game.advanceUntil(settled);
    expect(treasures(game, A)).toBe(1);

    spawn(game, TEST_DWARF, A, true);
    game.advanceUntil(settled);
    expect(treasures(game, A)).toBe(2);
  });

  it("makes no Treasure for an opponent's Dwarf, or for a non-Dwarf of your own", () => {
    const { game } = makeGame();
    spawn(game, THORIN, A);

    // "…you control": a Dwarf entering under Bob's control is not yours.
    spawn(game, TEST_DWARF, B, true);
    // "…Dwarf": a creature of yours that isn't one doesn't count either.
    spawn(game, "Grizzly Bears", A, true);
    // Run well past the entries — a whole turn of priority windows.
    game.advanceUntil((s) => s.turn.step === "postcombat-main");

    expect(treasures(game, A)).toBe(0);
    expect(treasures(game, B)).toBe(0);
  });

  it("cast for its real cost, it enters and pays off its own trigger", () => {
    const { game } = makeGame([THORIN]);
    for (let i = 0; i < 4; i += 1) spawn(game, "Plains", A);
    spawn(game, "Mountain", A);

    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === THORIN);
    if (card === undefined) throw new Error("no Thorin in hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(settled);

    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(treasures(game, A)).toBe(1);
  });

  describe("Other Dwarves you control get +1/+0 for each artifact token you control", () => {
    it("pumps another Dwarf once per artifact token, power only, and never Thorin itself", () => {
      const { game } = makeGame();
      const thorin = spawn(game, THORIN, A);
      const dwarf = spawn(game, TEST_DWARF, A);

      // No artifact tokens yet: the printed body, untouched.
      expect(game.characteristics(dwarf).power).toBe(2);
      expect(game.characteristics(thorin).power).toBe(4);

      game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 2 });
      expect(treasures(game, A)).toBe(2);

      expect(game.characteristics(dwarf).power).toBe(4);
      // "+1/+0" — toughness is not touched.
      expect(game.characteristics(dwarf).toughness).toBe(2);
      // "**Other** Dwarves" — Thorin is excluded from its own anthem.
      expect(game.characteristics(thorin).power).toBe(4);
      expect(game.characteristics(thorin).toughness).toBe(4);
    });

    it("counts any artifact token, not just Treasures, and not a printed artifact card", () => {
      const { game } = makeGame();
      spawn(game, THORIN, A);
      const dwarf = spawn(game, TEST_DWARF, A);

      game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
      expect(game.characteristics(dwarf).power).toBe(3);

      // A Food token is an artifact token too.
      game.debugApplyEffect(A, { kind: "create-token", token: "Food Token", count: 1 });
      expect(tokensOf(game, A, "Food Token")).toBe(1);
      expect(game.characteristics(dwarf).power).toBe(4);

      // Sol Ring is an artifact you control but not a *token*: no change.
      spawn(game, "Sol Ring", A);
      expect(game.characteristics(dwarf).power).toBe(4);
    });

    it("ignores an opponent's Dwarves and an opponent's artifact tokens", () => {
      const { game } = makeGame();
      spawn(game, THORIN, A);
      const mine = spawn(game, TEST_DWARF, A);
      const theirs = spawn(game, TEST_DWARF, B);
      const bears = spawn(game, "Grizzly Bears", A);

      game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
      // Bob's three Treasures are his, so they add nothing to the count.
      game.debugApplyEffect(B, { kind: "create-token", token: "Treasure Token", count: 3 });
      expect(treasures(game, B)).toBe(3);

      expect(game.characteristics(mine).power).toBe(3);
      // "…you control": Bob's Dwarf gets nothing from Alice's Thorin.
      expect(game.characteristics(theirs).power).toBe(2);
      // "Dwarves": a creature of yours that isn't one gets nothing.
      expect(game.characteristics(bears).power).toBe(2);
    });

    it("reads the count live: a Treasure leaving shrinks the bonus", () => {
      const { game } = makeGame();
      spawn(game, THORIN, A);
      const dwarf = spawn(game, TEST_DWARF, A);

      game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 2 });
      expect(game.characteristics(dwarf).power).toBe(4);

      const treasure = game.state.zones.shared.battlefield.find(
        (id) =>
          game.state.objects[id].cardName === "Treasure Token" &&
          game.state.objects[id].controller === A,
      );
      if (treasure === undefined) throw new Error("no Treasure on the battlefield");
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
        { kind: "object", object: treasure },
      ]);
      game.advanceUntil(settled);

      expect(treasures(game, A)).toBe(1);
      expect(game.characteristics(dwarf).power).toBe(3);
    });
  });
});
