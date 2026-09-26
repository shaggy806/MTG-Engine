/**
 * Effect durations past "until end of turn" (rule 611.2): "until your next
 * turn" — the effect's controller's, ending as that turn begins, or as it
 * would have begun once they've left the game (rule 800.4m) — and "for as
 * long as it has a [kind] counter on it" (rule 611.2b), which does nothing
 * without one, ends with the last one, and isn't brought back by a new one.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { PtDuration } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (players: readonly PlayerId[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])),
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const check = (game: Game): void =>
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(
    game.state.priority.holder ?? A,
  );
/** `by` gives `id` flying for `duration`. */
const fly = (game: Game, by: PlayerId, id: ObjectId, duration: PtDuration): void =>
  game.debugApplyEffect(by, { kind: "grant-keyword", target: 0, keyword: "flying", duration }, [
    { kind: "object", object: id },
  ]);
const flying = (game: Game, id: ObjectId): boolean => game.characteristics(id).keywords.has("flying");
const toTurn = (game: Game, turn: number): void => game.advanceUntil((s) => s.turn.number === turn);
const counters = (game: Game, id: ObjectId, counter: string, amount: number): void =>
  game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter, amount }, [{ kind: "object", object: id }]);

describe("until your next turn", () => {
  it("lasts through the other players' turns and ends as the effect's controller's turn begins", () => {
    const game = setUp([A, B]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    fly(game, A, bears, "until-your-next-turn");
    toTurn(game, 2);
    expect(flying(game, bears)).toBe(true);
    toTurn(game, 3);
    expect(flying(game, bears)).toBe(false);
  });

  it("is the controller's of the effect, not of the permanent", () => {
    const game = setUp([A, B]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    fly(game, B, bears, "until-your-next-turn");
    expect(flying(game, bears)).toBe(true);
    toTurn(game, 2);
    expect(flying(game, bears)).toBe(false);
  });

  it("a player who left: it lasts until their turn would have begun (rule 800.4m)", () => {
    const game = setUp([A, B, C]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    fly(game, B, bears, "until-your-next-turn");
    game.debugApplyEffect(B, { kind: "goad", target: 0 }, [{ kind: "object", object: bears }]);
    game.state.players[B].life = 0;
    check(game);
    expect(game.state.players[B].hasLost).toBe(true);
    // Not over the moment they leave…
    expect(flying(game, bears)).toBe(true);
    expect(game.state.objects[bears].goadedBy).toEqual([B]);
    // …but as the turn after A's begins: B's would have been that one.
    toTurn(game, 2);
    expect(game.state.turn.activePlayerIndex).toBe(game.state.turnOrder.indexOf(C));
    expect(flying(game, bears)).toBe(false);
    expect(game.state.objects[bears].goadedBy).toBeUndefined();
  });

  it("a player who left on their own turn: it lasts the whole way round", () => {
    const game = setUp([A, B, C]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    toTurn(game, 2);
    fly(game, B, bears, "until-your-next-turn");
    game.state.players[B].life = 0;
    check(game);
    toTurn(game, 3);
    toTurn(game, 4);
    expect(flying(game, bears)).toBe(true);
    // Turn 5 is where B's would have begun, rotation passing over their seat.
    toTurn(game, 5);
    expect(flying(game, bears)).toBe(false);
  });
});

describe("for as long as it has a [kind] counter on it", () => {
  it("ends with the last counter and isn't brought back by a new one", () => {
    const game = setUp([A, B]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    counters(game, bears, "+1/+1", 1);
    fly(game, A, bears, { whileCounter: "+1/+1" });
    expect(flying(game, bears)).toBe(true);
    // A -1/-1 counter: the pair is removed (rule 704.5q), and the last
    // +1/+1 counter with it.
    counters(game, bears, "-1/-1", 1);
    check(game);
    expect(game.state.objects[bears].counters).toEqual({});
    expect(flying(game, bears)).toBe(false);
    counters(game, bears, "+1/+1", 1);
    expect(flying(game, bears)).toBe(false);
  });

  it("lasts while some are left", () => {
    const game = setUp([A, B]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    counters(game, bears, "+1/+1", 2);
    fly(game, A, bears, { whileCounter: "+1/+1" });
    counters(game, bears, "-1/-1", 1);
    check(game);
    expect(game.state.objects[bears].counters).toEqual({ "+1/+1": 1 });
    expect(flying(game, bears)).toBe(true);
  });

  it("does nothing if it has none as the effect would begin", () => {
    const game = setUp([A, B]);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    fly(game, A, bears, { whileCounter: "blight" });
    expect(flying(game, bears)).toBe(false);
    counters(game, bears, "blight", 1);
    expect(flying(game, bears)).toBe(false);
  });
});
