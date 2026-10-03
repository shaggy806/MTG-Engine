/**
 * "Discard a card" as part of an activated ability's cost (`AbilityCost.
 * discard`): gated on having enough matching cards, paid with the ordinary
 * `discard` decision as the ability goes on the stack (rule 602.2b), and —
 * for "Discard a creature card" — narrowed to the cards that can pay, which
 * only the paying player sees.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: true, maxLandsPerTurn: 99, maxHandSize: 99, openingHandSize: 0 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const toHand = (game: Game, name: string, player: PlayerId = A): ObjectId => game.debugSpawn(name, player, "hand");
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const canActivate = (game: Game, source: ObjectId, index = 0): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === index);

describe("discard as an activation cost", () => {
  it("can't be activated without a matching card in hand, the source aside", () => {
    const game = setUp();
    spawn(game, "Swamp");
    const existence = spawn(game, "Tortured Existence");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    toHand(game, "Swamp");
    expect(canActivate(game, existence)).toBe(false);
    toHand(game, "Hill Giant");
    expect(canActivate(game, existence)).toBe(true);
  });

  it("offers only the creature cards, refuses a land, and pays before the ability resolves", () => {
    const game = setUp();
    spawn(game, "Swamp");
    const existence = spawn(game, "Tortured Existence");
    const target = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const land = toHand(game, "Swamp");
    const giant = toHand(game, "Hill Giant");
    const elves = toHand(game, "Llanowar Elves");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: existence,
      abilityIndex: 0,
      targets: [{ kind: "object", object: target }],
    });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("discard");
    const offer = game.legalActions(A).find((x) => x.kind === "discard");
    expect(offer?.kind === "discard" && [...offer.from].sort()).toEqual([giant, elves].sort());
    // The ability is on the stack, waiting on its cost.
    expect(game.state.zones.shared.stack.length).toBe(1);
    expect(() => game.dispatch({ type: "discard", player: A, cards: [land] })).toThrow();
    game.dispatch({ type: "discard", player: A, cards: [giant] });
    expect(zone(game, giant)).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(zone(game, target)).toBe("hand");
    expect(zone(game, land)).toBe("hand");
    expect(zone(game, elves)).toBe("hand");
  });

  it("shows which cards can pay only to the player paying", () => {
    const game = setUp();
    spawn(game, "Swamp");
    const existence = spawn(game, "Tortured Existence");
    const target = game.debugSpawn("Grizzly Bears", A, "graveyard");
    toHand(game, "Swamp");
    toHand(game, "Hill Giant");
    toHand(game, "Llanowar Elves");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: existence,
      abilityIndex: 0,
      targets: [{ kind: "object", object: target }],
    });
    const mine = game.viewFor(A).awaiting;
    const theirs = game.viewFor(B).awaiting;
    expect(mine?.kind === "discard" && mine.eligible?.length).toBe(2);
    expect(theirs?.kind === "discard" && theirs.eligible).toBeUndefined();
  });

  it("with only as many matching cards as it needs, discards them without asking", () => {
    const game = setUp();
    spawn(game, "Swamp");
    spawn(game, "Swamp");
    const yawgmoth = spawn(game, "Yawgmoth, Thran Physician");
    const card = toHand(game, "Wastes");
    game.dispatch({ type: "activate-ability", player: A, source: yawgmoth, abilityIndex: 1 });
    expect(zone(game, card)).toBe("graveyard");
    expect(game.state.awaiting?.kind).not.toBe("discard");
  });

  it("takes two cards for Solphim, and gives it an indestructible counter", () => {
    const game = setUp();
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    const solphim = spawn(game, "Solphim, Mayhem Dominus");
    toHand(game, "Wastes");
    expect(canActivate(game, solphim)).toBe(false);
    toHand(game, "Wastes");
    expect(canActivate(game, solphim)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: solphim, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(0);
    expect(game.state.objects[solphim].counters.indestructible).toBe(1);
  });

  it("hands priority back to the player who activated, on another player's turn (rule 117.3c)", () => {
    const game = setUp();
    const frog = spawn(game, "Psychic Frog");
    const giant = toHand(game, "Hill Giant");
    toHand(game, "Craw Wurm");
    game.advanceUntil(
      (s) => s.turnOrder[s.turn.activePlayerIndex] === B && s.turn.step === "upkeep" && s.priority.holder === A,
    );
    game.dispatch({ type: "activate-ability", player: A, source: frog, abilityIndex: 0 });
    expect(game.state.awaiting?.kind).toBe("discard");
    game.dispatch({ type: "discard", player: A, cards: [giant] });
    expect(game.state.priority.holder).toBe(A);
    expect(game.state.zones.shared.stack).toHaveLength(1);
  });
});
