/**
 * "As this permanent enters, choose …" (rule 614.1c) — Heraldic Banner
 * ("choose a color") and Frontier Siege ("choose Khans or Dragons").
 *
 * The answer lands on `GameObject.chosenOnEnter`, a bare label the card's own
 * text interprets: a static's `chosenColorOnly` scope, a mana ability's
 * `"chosen"`, or a `chosen-on-enter` trigger condition.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });

const readyForests = (game: Game, n: number) => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn("Forest", A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

/**
 * Cast `card` and answer the "as it enters, choose" decision.
 *
 * It has to be *cast* rather than spawned: the choice is raised on the
 * permanent-spell resolution path, so a permanent that arrives any other way
 * (a token copy, reanimation, `debugSpawn`) never gets asked — the same
 * limitation `chooseCreatureTypeOnEnter` has always had, recorded in
 * AUTHORING §15.
 */
const castWith = (game: Game, card: string, choice: string) => {
  const handId = game.debugSpawn(card, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: handId, targets: [] });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-creature-type" || s.result.over);
  const awaiting = game.state.awaiting;
  if (awaiting?.kind === "choose-creature-type") {
    game.dispatch({ type: "choose-creature-type", player: A, creatureType: choice });
  }
  return handId;
};

describe("Heraldic Banner", () => {
  it("asks for a colour as it enters", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyForests(game, 4);
    const handId = game.debugSpawn("Heraldic Banner", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: handId, targets: [] });
    game.advanceUntil((s) => s.awaiting !== null || s.result.over);

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-creature-type");
    if (awaiting?.kind !== "choose-creature-type") return;
    expect([...awaiting.options]).toEqual(["W", "U", "B", "R", "G"]);
  });

  it("pumps only creatures of the chosen colour", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyForests(game, 4);
    const green = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const white = game.debugSpawn("White Knight", A, "battlefield");

    castWith(game, "Heraldic Banner", "G");

    expect(game.characteristics(green).power).toBe(3);
    expect(game.characteristics(white).power).toBe(2);
  });

  it("taps for the chosen colour", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyForests(game, 4);
    const banner = castWith(game, "Heraldic Banner", "G");

    const legal = game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.source === banner);
    expect(legal).toBeDefined();
  });
});

describe("Frontier Siege", () => {
  it("only runs the half that was chosen", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyForests(game, 5);
    const siege = castWith(game, "Frontier Siege", "Khans");
    expect(game.state.objects[siege].chosenOnEnter).toBe("Khans");

    // The Dragons half is gated off, so a flier entering does nothing.
    game.debugSpawn("Serra Angel", A, "battlefield", { announceEntry: true });
    game.advanceUntil(
      (s) => s.pendingTriggers.length === 0 && s.priority.holder !== null,
    );
    expect(game.state.awaiting).toBeNull();
  });

  it("runs the Dragons half when that was chosen", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyForests(game, 5);
    castWith(game, "Frontier Siege", "Dragons");
    game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.debugSpawn("Serra Angel", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting !== null || s.result.over);
    // A "you may fight" choice, which the Khans half would never raise.
    expect(game.state.awaiting?.kind).toBe("choose-modes");
  });
});
