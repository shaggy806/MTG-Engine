/**
 * "Converter" mana sources — a mana ability whose own activation cost is
 * generic mana (a Signet's "{1}, {T}: Add {B}{R}").
 *
 * These were excluded from `manaSources()` outright until now, to keep the
 * payment planner from having to plan circularly. They're admitted on three
 * conditions, all enforced in `manaSources`: the activation cost is purely
 * generic (a coloured one really would need the colour to make the colour),
 * it produces more than it costs, and the planner only reaches for one once
 * the ordinary sources are spent — funding it from those, never from another
 * converter.
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
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Plains") },
      { player: B, cards: Array<string>(40).fill("Plains") },
    ],
  });

/** Untapped lands of one basic type for A. */
const lands = (game: Game, kind: string, n: number) => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn(kind, A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

const open = (game: Game) =>
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");

const canCast = (game: Game, card: string): boolean => {
  const id = game.debugSpawn(card, A, "hand");
  return game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === id);
};

describe("a Signet as a mana source", () => {
  it("fixes colour: two Plains plus a Signet casts a {B}{B} spell", () => {
    const game = makeGame();
    open(game);
    // Plains make no black, so without the Signet the spell is uncastable.
    lands(game, "Plains", 2);
    expect(canCast(game, "Sign in Blood")).toBe(false);

    const fresh = makeGame();
    open(fresh);
    for (let i = 0; i < 3; i += 1) {
      const id = fresh.debugSpawn("Plains", A, "battlefield");
      fresh.state.objects[id].tapped = false;
    }
    const signet = fresh.debugSpawn("Rakdos Signet", A, "battlefield");
    fresh.state.objects[signet].tapped = false;
    // {B}{B}: one Plains funds the Signet, which makes both black.
    expect(canCast(fresh, "Sign in Blood")).toBe(true);
  });

  it("actually taps both, and pays the Signet's own {1} from the pool", () => {
    const game = makeGame();
    open(game);
    lands(game, "Plains", 3);
    const signet = game.debugSpawn("Rakdos Signet", A, "battlefield");
    game.state.objects[signet].tapped = false;

    const card = game.debugSpawn("Sign in Blood", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "player", player: A }],
    });

    expect(game.state.objects[signet].tapped).toBe(true);
    const tappedLands = game.state.zones.shared.battlefield.filter(
      (id) =>
        game.state.objects[id].controller === A &&
        game.state.objects[id].tapped &&
        game.characteristics(id).types.includes("land"),
    );
    // One Plains funded the Signet's {1}; the Signet's {B}{B} paid the spell.
    expect(tappedLands.length).toBe(1);
  });

  it("is not reached while ordinary sources can pay", () => {
    const game = makeGame();
    open(game);
    lands(game, "Swamp", 4);
    const signet = game.debugSpawn("Rakdos Signet", A, "battlefield");
    game.state.objects[signet].tapped = false;

    const card = game.debugSpawn("Sign in Blood", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "player", player: A }],
    });
    // Two Swamps cover {B}{B} on their own, so the Signet stays up.
    expect(game.state.objects[signet].tapped).toBe(false);
  });

  it("can't fund itself off an empty board", () => {
    const game = makeGame();
    open(game);
    const signet = game.debugSpawn("Rakdos Signet", A, "battlefield");
    game.state.objects[signet].tapped = false;
    // The Signet makes two mana but needs one first, and there's nothing
    // else — so nothing is castable and it is never tapped.
    expect(canCast(game, "Sign in Blood")).toBe(false);
    expect(game.state.objects[signet].tapped).toBe(false);
  });

  it("won't fund one Signet with another", () => {
    const game = makeGame();
    open(game);
    const one = game.debugSpawn("Rakdos Signet", A, "battlefield");
    const two = game.debugSpawn("Dimir Signet", A, "battlefield");
    game.state.objects[one].tapped = false;
    game.state.objects[two].tapped = false;
    expect(canCast(game, "Sign in Blood")).toBe(false);
  });

  it("only supplies the colours it actually makes", () => {
    const game = makeGame();
    open(game);
    lands(game, "Island", 3);
    const signet = game.debugSpawn("Azorius Signet", A, "battlefield");
    game.state.objects[signet].tapped = false;
    // An Azorius Signet makes {W} and {U}. Sign in Blood wants {B}{B}, and
    // there's no black on the board at all.
    expect(canCast(game, "Sign in Blood")).toBe(false);
  });

  it("funds itself off a land whose colour the cost doesn't want", () => {
    const game = makeGame();
    open(game);
    for (const kind of ["Island", "Island", "Swamp", "Swamp"]) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    const signet = game.debugSpawn("Azorius Signet", A, "battlefield");
    game.state.objects[signet].tapped = false;

    // Cloudblazer is {3}{W}{U}. Four lands plus a net +1 from the Signet is
    // exactly five mana, and the only {W} on the board is the Signet's — so
    // the {1} has to come from a Swamp. Funding it from an Island instead
    // would strand the {U} and the whole plan would fail.
    const card = game.debugSpawn("Cloudblazer", A, "hand");
    expect(
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === card),
    ).toBe(true);

    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    const untapped = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].controller === A && !game.state.objects[id].tapped,
    );
    // Everything was needed, so nothing is left standing.
    expect(untapped.length).toBe(0);
  });

  it("spends the exact unit it was funded with, not 'one generic'", () => {
    // The fuzzer's repro for this: the plan promised the cost's colours, then
    // the Signet's own payment ate one of them out of the pool and the final
    // deduction underflowed. A converter now records the specific mana each
    // funding source gave it and spends that back verbatim.
    const game = makeGame();
    open(game);
    for (const kind of ["Island", "Island", "Swamp", "Swamp"]) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
    const signet = game.debugSpawn("Azorius Signet", A, "battlefield");
    game.state.objects[signet].tapped = false;

    const card = game.debugSpawn("Cloudblazer", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, targets: [] }),
    ).not.toThrow();

    // Nothing floating: five mana produced, five spent.
    const pool = game.state.players[A].manaPool;
    expect(Object.values(pool).reduce((n, v) => n + (v ?? 0), 0)).toBe(0);
  });
});
