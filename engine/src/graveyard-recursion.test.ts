import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Forest")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
/** Stack empty, no decision pending, and every fired trigger resolved. */
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const gyLandsOf = (game: Game): ObjectId[] =>
  game.state.zones.perPlayer[A].graveyard.filter((id) =>
    game.registry.get(game.state.objects[id].cardName).types.includes("land"),
  );

describe("return-from-graveyard — Splendid Reclamation", () => {
  it("returns every land card from your graveyard to the battlefield tapped, leaving nonlands", () => {
    const { game } = mkGame(["Splendid Reclamation"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield"); // mana
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Mountain", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Mountain", B, "graveyard"); // an opponent's land — untouched

    const bfBefore = new Set(game.battlefield);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Splendid Reclamation"),
    });
    game.advanceUntil(quiet);

    const returned = game.battlefield.filter(
      (id) =>
        !bfBefore.has(id) &&
        game.state.objects[id].cardName === "Mountain" &&
        game.state.objects[id].controller === A,
    );
    expect(returned).toHaveLength(4);
    for (const id of returned) expect(game.state.objects[id].tapped).toBe(true);
    expect(
      game.state.zones.perPlayer[A].graveyard.some(
        (id) => game.state.objects[id].cardName === "Grizzly Bears",
      ),
    ).toBe(true);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(1);
  });

  it("is a no-op with no land cards in the graveyard", () => {
    const { game } = mkGame(["Splendid Reclamation"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const bfBefore = game.battlefield.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Splendid Reclamation"),
    });
    game.advanceUntil(quiet);
    // just the Splendid Reclamation itself joined the graveyard; nothing returned
    expect(game.battlefield.length).toBe(bfBefore);
  });
});

describe("Aftermath Analyst", () => {
  it("self-mills three on entry, then its sac ability returns the milled lands tapped", () => {
    // deck A is otherwise 40 Forests, so milling always hits land cards.
    const { game } = mkGame(["Aftermath Analyst"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Forest", A, "battlefield");

    const gyBefore = game.state.zones.perPlayer[A].graveyard.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Aftermath Analyst"),
    });
    game.advanceUntil(quiet);
    const analyst = named(game, game.battlefield, "Aftermath Analyst");
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(gyBefore + 3);
    expect(gyLandsOf(game).length).toBe(3);

    const bfBefore = new Set(game.battlefield);
    game.dispatch({ type: "activate-ability", player: A, source: analyst, abilityIndex: 0 });
    game.advanceUntil(quiet);

    expect(game.state.objects[analyst].zone).toBe("graveyard");
    expect(gyLandsOf(game).length).toBe(0);
    const returned = game.battlefield.filter(
      (id) => !bfBefore.has(id) && game.state.objects[id].cardName === "Forest",
    );
    expect(returned).toHaveLength(3);
    for (const id of returned) expect(game.state.objects[id].tapped).toBe(true);
  });
});

describe("World Shaper", () => {
  it("returns all land cards from the graveyard when it dies", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const shaper = game.debugSpawn("World Shaper", A, "battlefield");
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "graveyard");

    game.state.objects[shaper].damageMarked = 3; // lethal for a 3/3
    game.advanceUntil(
      (s) => quiet(s) && game.state.objects[shaper].zone === "graveyard",
    );

    const returned = game.battlefield.filter(
      (id) =>
        game.state.objects[id].cardName === "Forest" &&
        game.state.objects[id].controller === A,
    );
    expect(returned).toHaveLength(3);
    for (const id of returned) expect(game.state.objects[id].tapped).toBe(true);
  });
});
