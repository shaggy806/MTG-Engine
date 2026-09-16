/**
 * The last genuinely cheap precon cards, one small mechanism each:
 *
 * - `shuffleIntoLibraryOnResolve` (White Sun's Zenith) — only on resolving;
 *   a countered one still goes to the graveyard.
 * - `grantPtPerCount { commanderCasts }` (Commander's Insignia).
 * - `PlayerState.createdTokenThisTurn` + the `created-token-this-turn`
 *   condition gating an activated ability (Idol of Oblivion).
 * - `PlayerState.usedGraveyardThisTurn` + `used-graveyard-this-turn`
 *   (Laboratory Drudge).
 * - `StaticAbility.cantAttackController` (Vow of Duty), where "you" is the
 *   Aura's controller rather than the creature's.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Plains"),
    })),
  });

const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

describe("White Sun's Zenith", () => {
  it("makes X Cats and goes back into the library, not the graveyard", () => {
    const game = makeGame();
    openWith(game, 5);
    const card = game.debugSpawn("White Sun's Zenith", A, "hand");
    const librarySize = game.state.zones.perPlayer[A].library.length;

    game.dispatch({ type: "cast-spell", player: A, card, targets: [], xValue: 2 });
    settle(game);

    const cats = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Cat Token",
    );
    expect(cats.length).toBe(2);
    expect(game.state.objects[card].zone).toBe("library");
    expect(game.state.zones.perPlayer[A].library.length).toBe(librarySize + 1);
    expect(game.state.zones.perPlayer[A].graveyard).not.toContain(card);
  });

  it("goes to the graveyard when countered", () => {
    const game = makeGame();
    openWith(game, 5);
    const card = game.debugSpawn("White Sun's Zenith", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], xValue: 1 });

    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [
      { kind: "object", object: card },
    ]);
    expect(game.state.objects[card].zone).toBe("graveyard");
  });
});

describe("Commander's Insignia", () => {
  it("grows with each command-zone cast, and does nothing before one", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Commander's Insignia", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(game.characteristics(bear).power).toBe(2);

    game.state.players[A].commanderCastCounts = { "Isperia, Supreme Judge": 2 };
    expect(game.characteristics(bear).power).toBe(4);
    // An opponent's creature is untouched, and so is their own count.
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    expect(game.characteristics(theirs).power).toBe(2);
  });
});

describe("Idol of Oblivion", () => {
  it("can only draw on a turn you made a token", () => {
    const game = makeGame();
    openWith(game, 0);
    const idol = game.debugSpawn("Idol of Oblivion", A, "battlefield");
    game.state.objects[idol].tapped = false;

    const drawOffered = () =>
      game
        .legalActions(A)
        .some((a) => a.kind === "activate-ability" && a.source === idol && a.abilityIndex === 0);

    expect(drawOffered()).toBe(false);
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 });
    expect(game.state.players[A].createdTokenThisTurn).toBe(true);
    expect(drawOffered()).toBe(true);

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    expect(game.state.players[A].createdTokenThisTurn).toBe(false);
  });

  it("counts a token made any way, not just by create-token", () => {
    const game = makeGame();
    openWith(game, 0);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(
      A,
      { kind: "create-token-copy", of: 0, count: 1 },
      [{ kind: "object", object: bear }],
    );
    // `mintTokenBatch` is the funnel every token path goes through.
    expect(game.state.players[A].createdTokenThisTurn).toBe(true);
  });
});

describe("Laboratory Drudge", () => {
  it("draws at end step only after a graveyard cast", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Laboratory Drudge", A, "battlefield");
    const before = game.state.zones.perPlayer[A].hand.length;

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    // Nothing cast from a graveyard: no draw at A's end step. (A's own draw
    // step on the *next* turn hasn't happened yet at the turn boundary.)
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before);
  });

  it("draws once the flag is set", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Laboratory Drudge", A, "battlefield");
    game.state.players[A].usedGraveyardThisTurn = true;
    const before = game.state.zones.perPlayer[A].hand.length;

    game.advanceUntil((s) => s.turn.step === "cleanup" || s.result.over);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before + 1);
  });

  it("is set by casting from the graveyard", () => {
    const game = makeGame();
    openWith(game, 4);
    game.debugSpawn("Gisa and Geralf", A, "battlefield");
    const zombie = game.debugSpawn("Vengeful Dead", A, "graveyard");
    expect(game.state.players[A].usedGraveyardThisTurn).toBe(false);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: zombie,
      targets: [],
      via: "graveyard-permission",
    });
    expect(game.state.players[A].usedGraveyardThisTurn).toBe(true);
  });
});

describe("Vow of Duty", () => {
  it("stops the enchanted creature attacking the Aura's controller only", () => {
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].summoningSick = false;
    // A puts the Vow on B's creature: it may no longer attack A.
    const vow = game.debugSpawn("Vow of Duty", A, "battlefield");
    game.state.objects[vow].attachedTo = theirs;

    expect(game.characteristics(theirs).power).toBe(4);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const legal = game.legalActions(B).find((a) => a.kind === "declare-attackers");
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "declare-attackers") return;
    expect(legal.defendersFor[theirs]).toEqual([C]);
  });
});
