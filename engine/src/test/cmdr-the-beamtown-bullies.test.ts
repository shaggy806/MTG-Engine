/**
 * The Beamtown Bullies — {1}{B}{R}{G} legendary 4/4 Ogre Devil Warrior.
 *
 *   Vigilance, haste
 *   {T}: Target opponent whose turn it is puts target nonlegendary creature
 *   card from your graveyard onto the battlefield under their control. It
 *   gains haste. Goad it. At the beginning of the next end step, exile it.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { goadersOf } from "../goad.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();
const BULLIES = "The Beamtown Bullies";

const setUp = (players: readonly PlayerId[]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const bullies = game.debugSpawn(BULLIES, A, "battlefield", { summoningSick: false });
  const giant = game.debugSpawn("Hill Giant", A, "graveyard");
  return { game, bullies, giant };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
type Offer = Extract<LegalAction, { kind: "activate-ability" }>;
const offerOf = (game: Game, bullies: ObjectId): Offer | undefined =>
  game.legalActions(A).find((o): o is Offer => o.kind === "activate-ability" && o.source === bullies);
/** Wait for Alice's priority in turn `n`'s precombat main phase. */
const alicesWindow = (game: Game, n: number) =>
  game.advanceUntil((s) => s.turn.number === n && s.turn.step === "precombat-main" && s.priority.holder === A);
const activate = (game: Game, bullies: ObjectId, opponent: PlayerId, card: ObjectId): void =>
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: bullies,
    abilityIndex: 0,
    targets: [
      { kind: "player", player: opponent },
      { kind: "object", object: card },
    ],
  });

describe("The Beamtown Bullies", () => {
  it("can't be activated on your own turn: there's no opponent whose turn it is", () => {
    const { game, bullies } = setUp([A, B]);
    expect(offerOf(game, bullies)).toBeUndefined();
  });

  it("targets only the opponent whose turn it is, and only a nonlegendary creature card of yours", () => {
    const { game, bullies, giant } = setUp([A, B, C]);
    game.debugSpawn("Jon Irenicus, Shattered One", A, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    alicesWindow(game, 2);
    const offer = offerOf(game, bullies);
    expect(offer).toBeDefined();
    const active = game.state.turnOrder[game.state.turn.activePlayerIndex];
    expect(offer!.targetOptions[0]).toEqual([{ kind: "player", player: active }]);
    expect(offer!.targetOptions[1]).toEqual([{ kind: "object", object: giant }]);
  });

  it("the opponent gets it hasty and goaded, and it's exiled at the next end step", () => {
    const { game, bullies, giant } = setUp([A, B]);
    alicesWindow(game, 2);
    activate(game, bullies, B, giant);
    game.advanceUntil(quiet);
    const g = game.state.objects[giant];
    expect(g.zone).toBe("battlefield");
    expect(g.controller).toBe(B);
    expect(game.characteristics(giant).keywords.has("haste")).toBe(true);
    expect(goadersOf(game.state, registry, giant)).toEqual([A]);
    expect(game.state.objects[bullies].tapped).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end" && quiet(s));
    expect(game.state.objects[giant].zone).toBe("exile");
  });

  it("an opponent gone illegal puts nothing anywhere, and the card stays in the graveyard (rules 608.2b, 603.7c)", () => {
    const { game, bullies, giant } = setUp([A, B]);
    alicesWindow(game, 2);
    activate(game, bullies, B, giant);
    game.state.hexproofPlayers = [...(game.state.hexproofPlayers ?? []), B];
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    expect(game.state.objects[giant].zone).toBe("graveyard");
  });
});
