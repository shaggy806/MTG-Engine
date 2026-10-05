/**
 * Ordering your own simultaneous triggers (rule 603.3b, the `order-triggers`
 * decision). Asked only of a player who orders their own
 * (`Game.setOrdersOwnTriggers`), and only when their waiting triggers aren't
 * all the same ability; everyone else gets the engine's own order.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Alice's main phase with `permanents` out, then a creature entering —
 * the event every one of them triggers on. */
const setUp = (permanents: readonly string[], orders: boolean) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const name of permanents) game.debugSpawn(name, A);
  game.setOrdersOwnTriggers(A, orders);
  game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
  game.advanceUntil((s) => s.awaiting !== null || (s.priority.holder !== null && s.pendingTriggers.length === 0));
  return game;
};

/** The source card of each ability on the stack, top first. */
const stackTopFirst = (game: Game): string[] =>
  [...game.state.zones.shared.stack].reverse().map((id) => game.state.objects[id].cardName);

describe("ordering simultaneous triggers (rule 603.3b)", () => {
  it("isn't asked by default: the engine's order stands", () => {
    const game = setUp(["Soul Warden", "Impact Tremors"], false);
    expect(game.state.awaiting).toBeNull();
    expect(stackTopFirst(game).sort()).toEqual(["Impact Tremors", "Soul Warden"]);
  });

  it("asks a player who orders their own, and stacks them as answered", () => {
    const game = setUp(["Soul Warden", "Impact Tremors"], true);
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("order-triggers");
    if (awaiting?.kind !== "order-triggers") return;
    const names = awaiting.triggers.map((t) => t.cardName);
    expect([...names].sort()).toEqual(["Impact Tremors", "Soul Warden"]);
    expect(awaiting.triggers.every((t) => t.text.length > 0)).toBe(true);
    // The engine's own order resolves `names[0]` first; ask for the opposite.
    expect(stackTopFirst(game)).toEqual([]);
    game.dispatch({ type: "order-triggers", player: A, order: [1, 0] });
    expect(game.state.awaiting).toBeNull();
    expect(stackTopFirst(game)).toEqual([names[1], names[0]]);
  });

  it("keeps the engine's order when answered with it", () => {
    const game = setUp(["Soul Warden", "Impact Tremors"], true);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "order-triggers") throw new Error("not asked");
    game.dispatch({ type: "order-triggers", player: A, order: [0, 1] });
    expect(stackTopFirst(game)).toEqual(awaiting.triggers.map((t) => t.cardName));
  });

  it("doesn't ask when every waiting trigger is the same ability", () => {
    const game = setUp(["Soul Warden", "Soul Warden"], true);
    expect(game.state.awaiting).toBeNull();
    expect(stackTopFirst(game)).toEqual(["Soul Warden", "Soul Warden"]);
  });

  it("refuses an order that doesn't name each trigger once", () => {
    const game = setUp(["Soul Warden", "Impact Tremors"], true);
    expect(game.canDispatch({ type: "order-triggers", player: A, order: [0, 0] })).toMatch(/once/);
    expect(game.canDispatch({ type: "order-triggers", player: B, order: [0, 1] })).toMatch(/not being asked/);
  });
});

describe("the engine's own order: what grows the board resolves before what counts it", () => {
  /** Alice's main phase with `permanents` out, then a Shivan Dragon entering.
   * Every trigger asking for a target is aimed at bob, and the stack then
   * resolved, so the damage dealt shows the order. */
  const dragonEnters = (permanents: readonly string[]) => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      decks: [
        { player: A, cards: Array<string>(40).fill("Mountain") },
        { player: B, cards: Array<string>(40).fill("Forest") },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (const name of permanents) game.debugSpawn(name, A);
    game.debugSpawn("Shivan Dragon", A, "battlefield", { announceEntry: true });
    for (let i = 0; i < 20; i += 1) {
      game.advanceUntil((s) => s.awaiting !== null || (s.zones.shared.stack.length === 0 && s.pendingTriggers.length === 0));
      const awaiting = game.state.awaiting;
      if (awaiting === null) break;
      if (awaiting.kind !== "choose-targets") throw new Error(`unexpected ${awaiting.kind}`);
      game.dispatch({ type: "choose-targets", player: A, targets: [{ kind: "player", player: B }] });
    }
    return game;
  };

  it("makes Lathliss's Dragon token before Dragon Tempest counts Dragons", () => {
    // Lathliss's token resolving first makes three Dragons (Lathliss, the
    // Shivan, the token) for Tempest's X on the Shivan; the other way round,
    // two. The token entering triggers Tempest again, at three either way:
    // 3 + 3, where the engine's old order dealt 2 + 3.
    const game = dragonEnters(["Dragon Tempest", "Lathliss, Dragon Queen"]);
    expect(game.state.players[B].life).toBe(20 - 6);
  });

  it("orders them the same way listed the other way round", () => {
    // Detection order doesn't decide it: Lathliss first on the battlefield.
    const game = dragonEnters(["Lathliss, Dragon Queen", "Dragon Tempest"]);
    expect(game.state.players[B].life).toBe(20 - 6);
  });
});
