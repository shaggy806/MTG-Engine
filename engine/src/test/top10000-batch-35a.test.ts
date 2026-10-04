/**
 * Top-10000 batch 35a. Pins the clauses most likely to be wired wrong:
 * Incremental Blight's 1/2/3 split across three targets, Oni-Cult Anvil's
 * once-a-turn leave trigger off its own sacrifice cost, and Vodalian
 * Wave-Knight's "each other Merfolk and/or Knight".
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (hand: readonly string[] = []): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
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
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });

describe("top-10000 batch 35a — Incremental Blight", () => {
  it("puts one, two and three -1/-1 counters on its three targets in order", () => {
    const game = setUp(["Incremental Blight"]);
    for (let i = 0; i < 5; i += 1) spawn(game, "Swamp");
    const [x, y, z] = [spawn(game, "Colossal Dreadmaw", B), spawn(game, "Colossal Dreadmaw", B), spawn(game, "Colossal Dreadmaw", B)];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Incremental Blight"),
      targets: [obj(x), obj(y), obj(z)],
    });
    game.advanceUntil(quiet);
    expect([counters(game, x, "-1/-1"), counters(game, y, "-1/-1"), counters(game, z, "-1/-1")]).toEqual([1, 2, 3]);
  });
});

describe("top-10000 batch 35a — Oni-Cult Anvil", () => {
  it("sacrificing an artifact on your turn drains and makes one Construct, once a turn", () => {
    const game = setUp();
    const anvil = spawn(game, "Oni-Cult Anvil");
    const ring = spawn(game, "Sol Ring");
    const [lifeA, lifeB] = [life(game, A), life(game, B)];
    game.dispatch({ type: "activate-ability", player: A, source: anvil, abilityIndex: 0, sacrifice: ring });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(lifeB - 1);
    expect(life(game, A)).toBe(lifeA + 1);
    expect(named(game, "Construct Token (Jan Jansen, Chaos Crafter)")).toHaveLength(1);
    // A second artifact leaving the same turn doesn't trigger it again.
    const other = spawn(game, "Ornithopter");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(other)]);
    game.advanceUntil(quiet);
    expect(named(game, "Construct Token (Jan Jansen, Chaos Crafter)")).toHaveLength(1);
  });
});

describe("top-10000 batch 35a — Vodalian Wave-Knight", () => {
  it("a draw puts a counter on each other Merfolk or Knight you control, not itself or a Bear", () => {
    const game = setUp();
    const knight = spawn(game, "Vodalian Wave-Knight");
    const merfolk = spawn(game, "Lord of Atlantis");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Lord of Atlantis", B);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    game.advanceUntil(quiet);
    expect(counters(game, merfolk)).toBe(1);
    expect(counters(game, knight)).toBe(0);
    expect(counters(game, bears)).toBe(0);
    expect(counters(game, theirs)).toBe(0);
  });
});
