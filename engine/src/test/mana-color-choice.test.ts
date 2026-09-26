/**
 * Activating an "add one mana of any color" ability on its own (Command
 * Tower). Paying a *cost* never comes through here — the mana planner picks
 * the colour it needs — but a player tapping the land by hand used to get
 * white whatever they wanted.
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ManaType } from "../mana.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";
import { poolCounts } from "../mana.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Alice's commanders set what Command Tower makes: Tom Bombadil is all
 * five colours. */
const mkGame = (commanders: readonly string[] = ["Tom Bombadil"]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array(40).fill("Forest"), commanders: [...commanders] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });

const atMain = (s: GameState): boolean =>
  s.turn.step === "precombat-main" && s.priority.holder === A;

describe("choosing the colour of an 'any color' mana ability", () => {
  it("offers Command Tower once per colour", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const tower = game.debugSpawn("Command Tower", A, "battlefield");

    const options = game
      .legalActions(A)
      .filter((a) => a.kind === "activate-ability" && a.source === tower);
    expect(options).toHaveLength(5);
    expect(
      options.map((a) => (a.kind === "activate-ability" ? a.manaColors : undefined)),
    ).toEqual([["W"], ["U"], ["B"], ["R"], ["G"]]);
  });

  it("adds the colour that was chosen, not white", () => {
    for (const color of ["U", "B", "R", "G"] as const satisfies readonly ManaType[]) {
      const game = mkGame();
      game.advanceUntil(atMain);
      const tower = game.debugSpawn("Command Tower", A, "battlefield");

      game.dispatch({
        type: "activate-ability",
        player: A,
        source: tower,
        abilityIndex: 0,
        targets: [],
        manaColors: [color],
      });

      expect(poolCounts(game.state.players[A].manaPool)[color]).toBe(1);
      expect(poolCounts(game.state.players[A].manaPool).W).toBe(0);
    }
  });

  it("still defaults when no colour is named — a driver that doesn't ask", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const tower = game.debugSpawn("Command Tower", A, "battlefield");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: tower,
      abilityIndex: 0,
      targets: [],
    });

    expect(poolCounts(game.state.players[A].manaPool).W).toBe(1);
  });

  it("offers only the colours of its controller's commander", () => {
    const game = mkGame(["Atraxa, Praetors' Voice"]);
    game.advanceUntil(atMain);
    const tower = game.debugSpawn("Command Tower", A, "battlefield");

    const options = game
      .legalActions(A)
      .filter((a) => a.kind === "activate-ability" && a.source === tower);
    expect(
      options.map((a) => (a.kind === "activate-ability" ? a.manaColors : undefined)),
    ).toEqual([["W"], ["U"], ["B"], ["G"]]);
  });

  it("makes no mana at all for a player with no commander", () => {
    const game = mkGame([]);
    game.advanceUntil(atMain);
    const tower = game.debugSpawn("Command Tower", A, "battlefield");
    expect(
      game.legalActions(A).filter((a) => a.kind === "activate-ability" && a.source === tower),
    ).toEqual([]);
  });

  it("leaves a fixed-colour ability alone — one option, no colour list", () => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const forest = game.debugSpawn("Forest", A, "battlefield");

    const options = game
      .legalActions(A)
      .filter((a) => a.kind === "activate-ability" && a.source === forest);
    expect(options).toHaveLength(1);
    expect(options[0].kind === "activate-ability" && options[0].manaColors).toBeUndefined();
  });
});

/**
 * "…of any color that a land an opponent controls could produce" — a `oneOf`
 * whose list is read off the board instead of being printed, so it changes as
 * the opponents' lands do.
 */
describe("mana derived from the opponents' lands", () => {
  const withOpponentLands = (...lands: readonly string[]) => {
    const game = mkGame();
    game.advanceUntil(atMain);
    const orchard = game.debugSpawn("Exotic Orchard", A, "battlefield");
    for (const name of lands) game.debugSpawn(name, B, "battlefield");
    return { game, orchard };
  };
  const colorsOffered = (game: Game, orchard: ObjectId) =>
    game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && x.source === orchard)
      .flatMap((x) => (x.kind === "activate-ability" ? (x.manaColors ?? []) : []));

  it("produces nothing at all when the opponents have no coloured lands", () => {
    const { game, orchard } = withOpponentLands();
    expect(colorsOffered(game, orchard)).toEqual([]);
  });

  it("offers exactly the colours those lands could make", () => {
    const { game, orchard } = withOpponentLands("Forest", "Island");
    expect([...colorsOffered(game, orchard)].sort()).toEqual(["G", "U"]);
  });

  it("follows the board — a land arriving widens it", () => {
    const { game, orchard } = withOpponentLands("Forest");
    expect(colorsOffered(game, orchard)).toEqual(["G"]);
    game.debugSpawn("Mountain", B, "battlefield");
    expect([...colorsOffered(game, orchard)].sort()).toEqual(["G", "R"]);
  });

  it("adds the colour chosen off that list", () => {
    const { game, orchard } = withOpponentLands("Forest", "Island");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: orchard,
      abilityIndex: 0,
      targets: [],
      manaColors: ["U"],
    });
    expect(poolCounts(game.state.players[A].manaPool).U).toBe(1);
  });
});
