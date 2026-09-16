/**
 * Steel Hellkite, and the three pieces it needed:
 *
 * - `ActivatedAbility.oncePerTurn` (rule 602.5g), tracked per ability index.
 * - `GameObject.combatDamagedPlayersThisTurn`, so "whose controller was dealt
 *   combat damage by this creature this turn" can be answered.
 * - `NumCompare.n: "x"`, so a `CardFilter` can say "mana value X" rather than
 *   only a literal.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

const readyMana = (game: Game, n: number) => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn("Mountain", A, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

const hellkiteBlast = (game: Game) =>
  game
    .legalActions(A)
    .find(
      (a) =>
        a.kind === "activate-ability" &&
        a.cardName === "Steel Hellkite" &&
        a.xCost !== undefined,
    );

/** Pretend the Hellkite connected with `player` this turn. */
const markDamaged = (game: Game, hellkite: ObjectId, player: typeof A) => {
  game.state.objects[hellkite].combatDamagedPlayersThisTurn = [player];
};

describe("Steel Hellkite", () => {
  it("destroys only permanents of the right mana value", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyMana(game, 6);
    const hellkite = game.debugSpawn("Steel Hellkite", A, "battlefield");
    markDamaged(game, hellkite, B);

    // Grizzly Bears is {1}{G} (mana value 2); Craw Wurm is {4}{G}{G} (6).
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");

    const legal = hellkiteBlast(game);
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "activate-ability") return;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [],
      xValue: 2,
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);

    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[wurm].zone).toBe("battlefield");
  });

  it("spares a player the Hellkite never damaged", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyMana(game, 6);
    game.debugSpawn("Steel Hellkite", A, "battlefield");
    // No `markDamaged` — nobody has been hit this turn.
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const legal = hellkiteBlast(game);
    if (legal === undefined || legal.kind !== "activate-ability") return;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [],
      xValue: 2,
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);

    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("can only be activated once each turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyMana(game, 12);
    const hellkite = game.debugSpawn("Steel Hellkite", A, "battlefield");
    markDamaged(game, hellkite, B);

    const legal = hellkiteBlast(game);
    if (legal === undefined || legal.kind !== "activate-ability") return;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [],
      xValue: 1,
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0);

    // Gone from the legal list, and refused if forced.
    expect(hellkiteBlast(game)).toBeUndefined();
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: legal.source,
        abilityIndex: legal.abilityIndex,
        targets: [],
        xValue: 1,
      }),
    ).toThrow(/already been activated this turn/);

    // The +1/+0 ability on the same permanent is unaffected — the limit is
    // recorded per ability index, not per permanent.
    const pump = game
      .legalActions(A)
      .find(
        (a) =>
          a.kind === "activate-ability" &&
          a.cardName === "Steel Hellkite" &&
          a.xCost === undefined,
      );
    expect(pump).toBeDefined();
  });

  it("records who it damaged, and forgets on a later turn", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const hellkite = game.debugSpawn("Steel Hellkite", A, "battlefield");
    markDamaged(game, hellkite, B);
    expect(game.state.objects[hellkite].combatDamagedPlayersThisTurn).toContain(B);

    game.advanceUntil((s) => s.turn.number >= game.state.turn.number + 2);
    expect(game.state.objects[hellkite].combatDamagedPlayersThisTurn ?? []).not.toContain(B);
  });
});
