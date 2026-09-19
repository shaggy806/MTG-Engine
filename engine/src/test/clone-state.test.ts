import { describe, expect, it } from "vitest";

import { HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import { cloneGameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

// The heuristic-bot fuzz deck — enough real play (tokensless, but counters,
// modifiers, combat state, an eventful log) to make a mid-game state
// structurally representative.
const deck = (): string[] =>
  list([
    ["Forest", 17],
    ["Sol Ring", 1],
    ["Llanowar Elves", 3],
    ["Grizzly Bears", 4],
    ["Elvish Visionary", 2],
    ["Rumbling Baloth", 3],
    ["Craw Wurm", 2],
    ["Giant Growth", 2],
    ["Beast Within", 2],
    ["Naturalize", 2],
    ["Prey Upon", 2],
  ]);

describe("cloneGameState", () => {
  it("matches structuredClone exactly on a played-out game state", () => {
    const game = Game.create({
      seed: 5,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: [
        { player: A, cards: deck() },
        { player: B, cards: deck() },
      ],
    });
    // Play the whole game — the final state has seen combat, counters,
    // modifiers, zone churn and a long event log.
    game.advance();
    const state = game.state;

    const viaStructured = structuredClone(state);
    const viaClone = cloneGameState(state);
    // `toStrictEqual` distinguishes a missing key from one set to undefined,
    // so the two deep copies must agree shape-for-shape.
    expect(viaClone).toStrictEqual(viaStructured);
  });

  it("produces a fully detached copy", () => {
    const game = Game.create({
      seed: 7,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: [
        { player: A, cards: deck() },
        { player: B, cards: deck() },
      ],
    });
    game.advance();
    const state = game.state;
    const copy = cloneGameState(state);

    // Mutating the copy anywhere must not show through to the original.
    const firstId = Object.keys(copy.objects)[0] as keyof typeof copy.objects;
    const original = JSON.stringify(state);
    copy.zones.shared.battlefield.push(firstId);
    copy.objects[firstId].counters["+1/+1"] = 99;
    copy.players[A].life = -123;
    copy.eventLog.length = 0;
    expect(JSON.stringify(state)).toBe(original);
  });
});
