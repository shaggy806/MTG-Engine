/**
 * The last of phase D's named mechanics: landcycling (rule 702.29f),
 * populate (701.32), and the two shapes of "double" — a one-shot power
 * doubling (Unleash Fury) and a global damage-doubling replacement (Dictate
 * of the Twin Gods).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

const makeGame = (aDeck = list([["Plains", 20], ["Grizzly Bears", 20]])) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...aDeck] },
      { player: B, cards: Array<string>(40).fill("Plains") },
    ],
  });

const readyLands = (game: Game, n: number, kind = "Plains") => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn(kind, A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

describe("basic landcycling", () => {
  it("discards the card and searches up a basic land instead of drawing", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 3);
    const card = game.debugSpawn("Migratory Route", A, "hand");
    const handBefore = game.state.zones.perPlayer[A].hand.length;

    game.dispatch({ type: "cycle", player: A, card });

    // A library search raises a choice rather than resolving immediately.
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") return;
    expect(awaiting.destination).toBe("hand");
    const found = awaiting.eligible[0];
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [found] });

    expect(game.state.objects[card].zone).toBe("graveyard");
    expect(game.state.objects[found].zone).toBe("hand");
    // One card left the hand (cycled) and one came back (the land found).
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore);
  });

  it("is offered as a cycle action with the landcycling cost", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyLands(game, 3);
    game.debugSpawn("Migratory Route", A, "hand");
    const legal = game.legalActions(A).find((a) => a.kind === "cycle");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "cycle") return;
    expect(legal.cost).toBe("{2}");
  });
});

describe("populate", () => {
  it("copies a creature token you control", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugApplyEffect(A, { kind: "create-token", token: "Bird Token", count: 1 });
    game.debugApplyEffect(A, { kind: "populate" });

    const birds = game.state.zones.shared.battlefield.filter(
      (id) =>
        game.state.objects[id].controller === A &&
        game.characteristics(id).subtypes.includes("Bird"),
    );
    const total = birds.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(total).toBe(2);
  });

  it("does nothing with no creature token to copy", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    // A nontoken creature isn't a legal populate choice.
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    const before = game.state.zones.shared.battlefield.length;
    game.debugApplyEffect(A, { kind: "populate" });
    expect(game.state.zones.shared.battlefield.length).toBe(before);
  });
});

describe("Unleash Fury — doubling power", () => {
  it("adds a creature's own current power", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(game.characteristics(bear).power).toBe(2);

    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: { powerOf: 0 }, toughness: 0, duration: "end-of-turn" },
      [{ kind: "object", object: bear }],
    );
    expect(game.characteristics(bear).power).toBe(4);
    // Toughness is untouched — it doubles power only.
    expect(game.characteristics(bear).toughness).toBe(2);
  });
});

describe("Dictate of the Twin Gods — doubling damage", () => {
  it("doubles damage in both directions", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugSpawn("Dictate of the Twin Gods", A, "battlefield");

    const bLife = game.state.players[B].life;
    game.debugApplyEffect(A, { kind: "damage", amount: 3, target: 0 }, [
      { kind: "player", player: B },
    ]);
    expect(game.state.players[B].life).toBe(bLife - 6);

    // Symmetric: it doubles damage dealt to its own controller too.
    const aLife = game.state.players[A].life;
    game.debugApplyEffect(B, { kind: "damage", amount: 3, target: 0 }, [
      { kind: "player", player: A },
    ]);
    expect(game.state.players[A].life).toBe(aLife - 6);
  });

  it("leaves damage alone when it isn't on the battlefield", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const bLife = game.state.players[B].life;
    game.debugApplyEffect(A, { kind: "damage", amount: 3, target: 0 }, [
      { kind: "player", player: B },
    ]);
    expect(game.state.players[B].life).toBe(bLife - 3);
  });
});
