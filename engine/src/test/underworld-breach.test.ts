/**
 * Underworld Breach: a granted escape beside a card's own. The player
 * chooses which escape applies (Breach's ruling), so each is offered and
 * named by `graveyardGrant`; "the card's mana cost" is the cost of the face
 * cast, so an adventurer escapes as either half.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { LegalAction } from "../actions.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
/** Five cards to exile for escape costs. */
const fodder = (game: Game): ObjectId[] =>
  [0, 1, 2, 3, 4].map(() => game.debugSpawn("Island", A, "graveyard"));
const escapes = (game: Game, card: ObjectId) =>
  game
    .legalActions(A)
    .filter(
      (x): x is Extract<LegalAction, { kind: "cast-spell" }> =>
        x.kind === "cast-spell" && x.card === card && x.via === "escape",
    );

describe("Underworld Breach", () => {
  it("gives a nonland graveyard card escape for its mana cost plus three cards", () => {
    const game = setUp();
    spawn(game, "Underworld Breach");
    spawn(game, "Mountain");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const exiled = fodder(game);
    const island = game.debugSpawn("Island", A, "graveyard");
    expect(escapes(game, bolt)).toHaveLength(1);
    expect(escapes(game, island)).toHaveLength(0);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      via: "escape",
      targets: [{ kind: "player", player: B }],
      escapeExile: exiled.slice(0, 3),
    });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(17);
    expect(exiled.slice(0, 3).every((id) => game.state.objects[id].zone === "exile")).toBe(true);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });

  it("offers both escapes of a card with its own, and the cheaper one pays Breach's cost", () => {
    const game = setUp();
    const breach = spawn(game, "Underworld Breach");
    const mountains = [0, 1, 2, 3].map(() => spawn(game, "Mountain"));
    const hound = game.debugSpawn("Underworld Rage-Hound", A, "graveyard");
    fodder(game);
    const offers = escapes(game, hound);
    expect(offers.map((o) => o.graveyardGrant?.source).sort()).toEqual([breach, hound].sort());
    game.dispatch({ type: "cast-spell", player: A, card: hound, via: "escape", graveyardGrant: { source: breach } });
    game.advanceUntil(quiet);
    expect(game.state.objects[hound].zone).toBe("battlefield");
    // Breach's {1}{R}, not the Hound's own {3}{R}.
    expect(mountains.filter((id) => game.state.objects[id].tapped)).toHaveLength(2);
    // It escaped all the same: it enters with its counter.
    expect(game.state.objects[hound].counters["+1/+1"]).toBe(1);
  });

  it("refuses an escape nobody grants", () => {
    const game = setUp();
    const breach = spawn(game, "Underworld Breach");
    for (let i = 0; i < 4; i += 1) spawn(game, "Mountain");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    fodder(game);
    const other = spawn(game, "Grizzly Bears");
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: bolt,
        via: "escape",
        targets: [{ kind: "player", player: B }],
        graveyardGrant: { source: other },
      }),
    ).toThrow(/that escape/);
    expect(breach).toBeDefined();
  });

  it("an adventurer escapes as its Adventure, which then goes on an adventure", () => {
    const game = setUp();
    spawn(game, "Underworld Breach");
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest");
    const giant = game.debugSpawn("Beanstalk Giant", A, "graveyard");
    fodder(game);
    const faces = escapes(game, giant).map((o) => o.face);
    expect(faces).toContain(1);
    game.debugSpawn("Plains", A, "library");
    game.dispatch({ type: "cast-spell", player: A, card: giant, via: "escape", face: 1, targets: [] });
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    // Fertile Footsteps searches; take whatever is offered.
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("exile");
    expect(game.state.objects[giant].onAdventure).toBe(true);
  });

  it("is sacrificed at the beginning of the end step", () => {
    const game = setUp();
    const breach = spawn(game, "Underworld Breach");
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(game.state.objects[breach].zone).toBe("graveyard");
  });
});
