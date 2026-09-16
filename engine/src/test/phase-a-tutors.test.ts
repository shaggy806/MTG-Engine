/**
 * The last three phase-A primitives from `docs/plans/engine-gaps.md`:
 *
 * - a tutor that splits its finds across two zones (`restDestination`) —
 *   Cultivate;
 * - `search-library.max` as a live count — Harvest Season;
 * - a `conditional` that asks about the object that *fired the trigger*
 *   rather than about the board — Akoum Hellkite.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

const makeGame = (aDeck: readonly string[]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, openingHandSize: 0 },
    decks: [
      { player: A, cards: [...aDeck] },
      { player: B, cards: Array<string>(40).fill("Grizzly Bears") },
    ],
  });

const zoneOf = (game: Game, id: ObjectId) => game.state.objects[id].zone;

/** Answer whatever `choose-from-zone` decision is pending, taking everything. */
const takeAll = (game: Game) => {
  const awaiting = game.state.awaiting;
  if (awaiting === null || awaiting.kind !== "choose-from-zone") return;
  game.dispatch({
    type: "choose-from-zone",
    player: awaiting.player,
    chosen: [...awaiting.eligible].slice(0, awaiting.max),
  });
};

describe("Cultivate — a tutor that splits its finds", () => {
  it("puts the first find onto the battlefield tapped and the rest in hand", () => {
    const game = makeGame(list([["Forest", 20]]));
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugApplyEffect(A, {
      kind: "search-library",
      filter: { supertype: "basic", type: "land" },
      min: 0,
      max: 2,
      destination: "battlefield",
      enterTapped: true,
      restDestination: "hand",
    });

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") return;
    const [first, second] = awaiting.eligible;
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [first, second] });

    expect(zoneOf(game, first)).toBe("battlefield");
    expect(game.state.objects[first].tapped).toBe(true);
    expect(zoneOf(game, second)).toBe("hand");
  });

  it("puts a lone find onto the battlefield, not into hand", () => {
    const game = makeGame(list([["Forest", 1], ["Grizzly Bears", 20]]));
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugApplyEffect(A, {
      kind: "search-library",
      filter: { supertype: "basic", type: "land" },
      min: 0,
      max: 2,
      destination: "battlefield",
      enterTapped: true,
      restDestination: "hand",
    });
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") return;
    expect(awaiting.eligible.length).toBe(1);
    const only = awaiting.eligible[0];
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [only] });
    expect(zoneOf(game, only)).toBe("battlefield");
  });
});

describe("Harvest Season — a live-count search max", () => {
  it("scales with the number of tapped creatures you control", () => {
    const game = makeGame(list([["Forest", 20]]));
    game.advanceUntil((s) => s.priority.holder === A);

    // Three creatures, two of them tapped.
    for (const tapped of [true, true, false]) {
      const id = game.debugSpawn("Grizzly Bears", A, "battlefield");
      game.state.objects[id].tapped = tapped;
    }

    game.debugApplyEffect(A, {
      kind: "search-library",
      filter: { supertype: "basic", type: "land" },
      min: 0,
      max: { countOf: { type: "creature", controlledBy: "you", tapped: true } },
      destination: "battlefield",
      enterTapped: true,
    });

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") return;
    expect(awaiting.max).toBe(2);
  });

  it("finds nothing with no tapped creatures", () => {
    const game = makeGame(list([["Forest", 20]]));
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugApplyEffect(A, {
      kind: "search-library",
      filter: { supertype: "basic", type: "land" },
      min: 0,
      max: { countOf: { type: "creature", controlledBy: "you", tapped: true } },
      destination: "battlefield",
      enterTapped: true,
    });
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") return;
    expect(awaiting.max).toBe(0);
    takeAll(game);
  });
});

describe("Akoum Hellkite — a condition on the triggering object", () => {
  const setup = (landPlayed: string) => {
    const game = makeGame(list([[landPlayed, 20]]));
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugSpawn("Akoum Hellkite", A, "battlefield");
    const before = game.state.players[B].life;
    // Play the land from hand so the landfall trigger fires for real.
    game.debugSpawn(landPlayed, A, "hand");
    const land = game.state.zones.perPlayer[A].hand.at(-1);
    if (land === undefined) throw new Error("no land in hand");
    game.dispatch({ type: "play-land", player: A, card: land });
    // Aim the trigger at B.
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "player", player: B }],
      });
    }
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);
    return before - game.state.players[B].life;
  };

  it("deals 2 when the land was a Mountain", () => {
    expect(setup("Mountain")).toBe(2);
  });

  it("deals 1 when it wasn't", () => {
    expect(setup("Forest")).toBe(1);
  });
});
