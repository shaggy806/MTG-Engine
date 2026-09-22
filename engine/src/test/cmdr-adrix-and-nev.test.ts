import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { activePlayerOf, permanentCount } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const ADRIX = "Adrix and Nev, Twincasters";

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const mkGame = (aHand: readonly string[] = [], bHand: readonly string[] = []): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad(bHand) },
    ],
  });

const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

/** First precombat main phase belonging to `player`, whoever won the highroll. */
const mainOf =
  (player: PlayerId) =>
  (s: GameState): boolean =>
    s.turn.step === "precombat-main" && activePlayerOf(s) === player;

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

const lands = (game: Game, name: string, n: number, player: PlayerId): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

/** How many `name` tokens `player` controls — a compacted stack counts as
 * every token in it, not as one object. */
const tokens = (game: Game, player: PlayerId, name: string): number =>
  permanentCount(
    game.state,
    game.battlefield.filter((id) => {
      const object = game.state.objects[id];
      return object.cardName === name && object.controller === player && object.isToken;
    }),
  );

const castFromHand = (
  game: Game,
  player: PlayerId,
  name: string,
  targets: readonly { kind: "object"; object: ObjectId }[] = [],
): void => {
  game.dispatch({
    type: "cast-spell",
    player,
    card: named(game, game.handOf(player), name),
    targets: [...targets],
  });
};

describe("Adrix and Nev, Twincasters — token doubling", () => {
  it("doubles a token-making spell its controller casts", () => {
    const game = mkGame(["Raise the Alarm"]);
    game.advanceUntil(mainOf(A));
    game.debugSpawn(ADRIX, A, "battlefield");
    lands(game, "Plains", 2, A);

    castFromHand(game, A, "Raise the Alarm");
    game.advanceUntil(settled);

    // "Create two 1/1 white Soldier creature tokens." -> twice that many.
    expect(tokens(game, A, "Soldier Token")).toBe(4);
  });

  it("multiplies with a second doubler rather than adding to it", () => {
    const game = mkGame(["Raise the Alarm"]);
    game.advanceUntil(mainOf(A));
    game.debugSpawn(ADRIX, A, "battlefield");
    game.debugSpawn("Doubling Season", A, "battlefield");
    lands(game, "Plains", 2, A);

    castFromHand(game, A, "Raise the Alarm");
    game.advanceUntil(settled);

    expect(tokens(game, A, "Soldier Token")).toBe(8);
  });

  // Negative: "under your control" — the replacement is scoped to the token's
  // own controller, so an opponent making their own tokens is untouched.
  it("does NOT double tokens created under an opponent's control", () => {
    const game = mkGame([], ["Raise the Alarm"]);
    game.advanceUntil(mainOf(B));
    game.debugSpawn(ADRIX, A, "battlefield");
    lands(game, "Plains", 2, B);

    castFromHand(game, B, "Raise the Alarm");
    game.advanceUntil(settled);

    expect(tokens(game, B, "Soldier Token")).toBe(2);
    expect(tokens(game, A, "Soldier Token")).toBe(0);
  });

  // Negative: Adrix doubles tokens only. Doubling Season is the card that also
  // doubles counters; authoring this one with a `would-add-counter` multiplier
  // would be strictly better than the printed card.
  it("does NOT double counters the way Doubling Season does", () => {
    const game = mkGame(["Snakeskin Veil"]);
    game.advanceUntil(mainOf(A));
    const adrix = game.debugSpawn(ADRIX, A, "battlefield");
    lands(game, "Forest", 1, A);

    castFromHand(game, A, "Snakeskin Veil", [{ kind: "object", object: adrix }]);
    game.advanceUntil(settled);

    expect(game.state.objects[adrix].counters["+1/+1"]).toBe(1);

    // Same board with Doubling Season instead, to show the two really differ.
    const control = mkGame(["Snakeskin Veil"]);
    control.advanceUntil(mainOf(A));
    const bear = control.debugSpawn("Grizzly Bears", A, "battlefield");
    control.debugSpawn("Doubling Season", A, "battlefield");
    lands(control, "Forest", 1, A);

    castFromHand(control, A, "Snakeskin Veil", [{ kind: "object", object: bear }]);
    control.advanceUntil(settled);

    expect(control.state.objects[bear].counters["+1/+1"]).toBe(2);
  });
});

describe("Adrix and Nev, Twincasters — ward {2}", () => {
  it("taxes an opponent's targeted spell {2} on top of its own cost", () => {
    const game = mkGame(["Lightning Bolt"]);
    game.advanceUntil(mainOf(A));
    const adrix = game.debugSpawn(ADRIX, B, "battlefield");
    lands(game, "Mountain", 3, A); // {R} for the Bolt + {2} for the ward

    castFromHand(game, A, "Lightning Bolt", [{ kind: "object", object: adrix }]);
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid").some((e) => e.object === adrix)).toBe(true);
    expect(
      game.battlefield.filter(
        (id) =>
          game.state.objects[id].cardName === "Mountain" && game.state.objects[id].tapped,
      ).length,
    ).toBe(3);
    // A 2/2 taking 3: the Bolt still resolved, and state-based actions bin it.
    expect(game.state.objects[adrix]?.zone === "battlefield").toBe(false);
  });

  it("counters the opponent's spell when they can't pay the {2}", () => {
    const game = mkGame(["Lightning Bolt"]);
    game.advanceUntil(mainOf(A));
    const adrix = game.debugSpawn(ADRIX, B, "battlefield");
    lands(game, "Mountain", 1, A); // only enough for the Bolt itself

    castFromHand(game, A, "Lightning Bolt", [{ kind: "object", object: adrix }]);
    game.advanceUntil(settled);

    expect(game.eventsOfType("spell-countered").length).toBeGreaterThan(0);
    expect(game.state.objects[adrix].damageMarked).toBe(0);
    expect(game.state.objects[adrix].zone).toBe("battlefield");
  });

  // Negative: ward is "a spell or ability an opponent controls" — it must not
  // tax its own controller.
  it("does NOT tax its own controller's targeted spell", () => {
    const game = mkGame(["Snakeskin Veil"]);
    game.advanceUntil(mainOf(A));
    const adrix = game.debugSpawn(ADRIX, A, "battlefield");
    lands(game, "Forest", 1, A); // exactly the Veil's cost, nothing for a ward

    castFromHand(game, A, "Snakeskin Veil", [{ kind: "object", object: adrix }]);
    game.advanceUntil(settled);

    expect(game.eventsOfType("ward-paid")).toHaveLength(0);
    expect(game.eventsOfType("spell-countered")).toHaveLength(0);
    expect(game.state.objects[adrix].counters["+1/+1"]).toBe(1);
  });
});
