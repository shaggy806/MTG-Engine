import { describe, expect, it } from "vitest";
import { Game, HeuristicBotController, autoSettle, createDefaultRegistry } from "engine";
import type { ControllerView } from "engine";

import { ALICE, BOB, DECKS } from "../decks.js";
import { Room } from "../room.js";
import type { Connection } from "../room.js";

const registry = createDefaultRegistry();

/** A bot that plays like v1 until its `failAt`th decision, then throws — an
 * engine bug, or a loop `Game.advance` gave up on, as a bot's move meets it. */
class FailingBot extends HeuristicBotController {
  private calls = 0;
  constructor(player: typeof ALICE, private readonly failAt: number) {
    super(player, registry);
  }
  override act(view: ControllerView) {
    this.calls += 1;
    if (this.calls >= this.failAt) throw new Error("Game.advance exceeded its budget; likely an engine bug");
    return super.act(view);
  }
}

describe("a game the engine throws on", () => {
  it("stops that room, says why, and refuses moves after, without throwing out of the room", () => {
    const game = Game.create({
      seed: 1,
      registry,
      decks: [
        { player: ALICE, cards: [...DECKS.alice] },
        { player: BOB, cards: [...DECKS.bob] },
      ],
    });
    autoSettle(game);
    const frames: (string | null)[] = [];
    const room = new Room("STOP1", game, {
      pacing: "immediate",
      onUpdate: (r) => frames.push(r.stopped),
      botController: (player) => new FailingBot(player, player === ALICE ? 3 : Infinity),
    });
    // A timer-driven bot move would surface here: nothing outside the room
    // may see the throw.
    expect(() => {
      room.addBot(ALICE);
      room.addBot(BOB);
    }).not.toThrow();

    expect(room.stopped).toMatch(/exceeded its budget/);
    expect(frames.at(-1)).toBe(room.stopped);
    const connection = { send: () => {} } as unknown as Connection;
    expect(() => room.dispatch(connection, { type: "pass-priority", player: BOB })).toThrow(/stopped/);
  });
});
