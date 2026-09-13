/**
 * Convoke (rule 702.51) — the EDH-popularity backlog's fifth and final
 * Tier-1 feature (`neededCards-features.md`): tap untapped creatures
 * instead of paying mana for part of a spell's cost, each creature paying
 * `{1}` or one mana of its own color. New `CardDefinition.convoke` (a pure
 * payment-method flag — targets/effect are unchanged) and `Action.convoke:
 * ConvokePayment[]`. Unlike `overload`/`free`, this isn't enumerated as a
 * separate `cast-spell` variant — a convokable spell has exactly one
 * `cast-spell` LegalAction, carrying a `convoke.candidates` list the driver
 * may (or may not) use. Shipped against Hour of Reckoning.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
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

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return game;
};

const settle = (game: Game): void =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

describe("Hour of Reckoning", () => {
  it("cannot be cast with no mana and no creatures to convoke", () => {
    const game = makeGame(["Hour of Reckoning"]);
    const hor = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Hour of Reckoning")!;
    const action = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === hor);
    expect(action).toBeUndefined();
  });

  it("tapping seven creatures pays the entire {4}{W}{W}{W} cost, no mana spent", () => {
    const game = makeGame(["Hour of Reckoning"]);
    game.debugSpawn("Hour of Reckoning", A, "hand");
    // 3 white creatures (pay the {W}{W}{W}) + 4 more of any color (pay {4}).
    for (let i = 0; i < 3; i++) game.debugSpawn("White Knight", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 4; i++) game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: false });

    const hor = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Hour of Reckoning")!;
    const action = game.legalActions(A).find((a) => a.kind === "cast-spell" && a.card === hor);
    expect(action?.kind).toBe("cast-spell");
    if (action?.kind !== "cast-spell") throw new Error("no cast-spell action");
    expect(action.convoke?.candidates.length).toBe(7);
    expect(action.convoke?.maxGeneric).toBe(4);

    const opponentBear = game.debugSpawn("Prodigal Sorcerer", B, "battlefield", { summoningSick: false });
    const myTokenBear = game.debugSpawn("Insect Token", A, "battlefield", { summoningSick: false });
    game.state.objects[myTokenBear]!.isToken = true;

    // The first 3 candidates (spawned first) are the White Knights; they
    // pay {W}, the rest pay generic.
    const candidates = action.convoke!.candidates;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: hor,
      convoke: candidates.map((creature, i) => ({
        creature,
        pays: i < 3 ? ("W" as const) : ("generic" as const),
      })),
    });
    // All seven convoking creatures are now tapped.
    for (const id of candidates) expect(game.state.objects[id]?.tapped).toBe(true);

    settle(game);

    // Nontoken creatures destroyed (including the convoking ones); the
    // token survives, matching the real "destroy all NONTOKEN creatures".
    for (const id of candidates) expect(game.state.objects[id]?.zone).toBe("graveyard");
    expect(game.state.objects[opponentBear]?.zone).toBe("graveyard");
    expect(game.state.objects[myTokenBear]?.zone).toBe("battlefield");
  });

  it("rejects tapping the same creature twice", () => {
    const game = makeGame(["Hour of Reckoning"]);
    game.debugSpawn("Hour of Reckoning", A, "hand");
    for (let i = 0; i < 7; i++) game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: false });
    const hor = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Hour of Reckoning")!;
    const one = game.battlefield.find((id) => game.state.objects[id]?.controller === A)!;

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: hor,
        convoke: [
          { creature: one, pays: "generic" },
          { creature: one, pays: "generic" },
        ],
      }),
    ).toThrow(/can't convoke twice/);
  });

  it("rejects convoking more generic payers than the cost has left", () => {
    const game = makeGame(["Hour of Reckoning"]);
    game.debugSpawn("Hour of Reckoning", A, "hand");
    const creatures = Array.from({ length: 8 }, () =>
      game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { summoningSick: false }),
    );
    const hor = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Hour of Reckoning")!;

    // 8 generic payers, but the cost only has {4} generic (the {W}{W}{W}
    // can't be paid by "generic" convoke).
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: hor,
        convoke: creatures.map((creature) => ({ creature, pays: "generic" as const })),
      }),
    ).toThrow(/convoke can't pay more generic mana/);
  });

  it("a tapped creature can't convoke", () => {
    const game = makeGame(["Hour of Reckoning"]);
    game.debugSpawn("Hour of Reckoning", A, "hand");
    const tapped = game.debugSpawn("Prodigal Sorcerer", A, "battlefield", { tapped: true });
    const hor = game.handOf(A).find((id) => game.state.objects[id]?.cardName === "Hour of Reckoning")!;

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: hor,
        convoke: [{ creature: tapped, pays: "generic" }],
      }),
    ).toThrow(/already tapped/);
  });
});
