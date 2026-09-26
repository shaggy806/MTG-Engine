/**
 * Rocco, Street Chef — {R}{G}{W} legendary 2/4 Elf Druid.
 *
 *   At the beginning of your end step, each player exiles the top card of
 *   their library. Until your next end step, each player may play the card
 *   they exiled this way.
 *   Whenever a player plays a land from exile or casts a spell from exile,
 *   you put a +1/+1 counter on target creature and create a Food token.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

/** Libraries: alice's top card Grizzly Bears, bob's Forest, carol's Opt. */
const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const tops: Record<string, string> = { [A]: "Grizzly Bears", [B]: "Forest", [C]: "Opt" };
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
  const rocco = game.debugSpawn("Rocco, Street Chef", A, "battlefield", { summoningSick: false });
  const top: Record<string, ObjectId> = {};
  for (const player of players) top[player] = game.debugSpawn(tops[player], player, "library");
  return { game, rocco, top, a: controllers[A] as ScriptedController };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const toEndStep = (game: Game, turn: number): void =>
  game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "end" && quiet(s));
const offers = (game: Game, player: PlayerId, card: ObjectId): boolean =>
  game.legalActions(player).some(
    (action) => (action.kind === "cast-spell" || action.kind === "play-land") && action.card === card,
  );
const foods = (game: Game): number =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Food Token").length;

describe("Rocco, Street Chef", () => {
  it("each player exiles their top card at your end step, and may play their own", () => {
    const { game, top } = setUp();
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield", { summoningSick: false });
    toEndStep(game, 1);
    expect(game.state.objects[top[A]].zone).toBe("exile");
    expect(game.state.objects[top[B]].zone).toBe("exile");
    expect(game.state.objects[top[A]].impulse?.player).toBe(A);
    expect(game.state.objects[top[B]].impulse?.player).toBe(B);
    // Bob plays his Forest on his own turn, and it's his land drop.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(offers(game, B, top[B])).toBe(true);
    expect(offers(game, B, top[A])).toBe(false);
    game.dispatch({ type: "play-land", player: B, card: top[B] });
    expect(game.state.objects[top[B]].zone).toBe("battlefield");
    expect(game.state.objects[top[B]].controller).toBe(B);
  });

  it("until your next end step: through the next turn, gone as your end step begins", () => {
    const { game, top } = setUp();
    toEndStep(game, 1);
    const grizzly = top[A];
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield", { summoningSick: false });
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(offers(game, A, grizzly)).toBe(true);
    // Turn 3's end step: the old permission ends, the new card's begins.
    toEndStep(game, 3);
    expect(game.state.objects[grizzly].zone).toBe("exile");
    expect(game.state.objects[grizzly].impulse).toBeUndefined();
  });

  it("any card played from exile: a +1/+1 counter on target creature, and a Food", () => {
    const { game, top, rocco, a } = setUp();
    a.chooseTargetsFn = () => [{ kind: "object", object: rocco }];
    // A land played from a hand isn't one.
    game.dispatch({ type: "play-land", player: A, card: game.debugSpawn("Forest", A, "hand") });
    game.advanceUntil(quiet);
    expect(foods(game)).toBe(0);
    toEndStep(game, 1);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    a.chooseTargetsFn = () => [{ kind: "object", object: rocco }];
    game.dispatch({ type: "play-land", player: B, card: top[B] });
    game.advanceUntil(quiet);
    expect(game.state.objects[rocco].counters).toEqual({ "+1/+1": 1 });
    expect(foods(game)).toBe(1);
    // Rocco's controller makes the Food.
    const food = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === "Food Token")!;
    expect(game.state.objects[food].controller).toBe(A);
  });

  it("a player who left: the others keep theirs until that player's turn would have begun (rule 800.4m)", () => {
    const { game, top } = setUp([A, B, C]);
    toEndStep(game, 1);
    game.state.players[A].life = 0;
    (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
    expect(game.state.players[A].hasLost).toBe(true);
    // Bob's turn and Carol's: Carol's Opt is still hers to cast.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    expect(game.state.objects[top[C]].impulse?.player).toBe(C);
    // Then alice's turn would have begun: it lapses.
    game.advanceUntil((s) => s.turn.number === 4);
    expect(game.state.objects[top[C]].impulse).toBeUndefined();
  });
});
