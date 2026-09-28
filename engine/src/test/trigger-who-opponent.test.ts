/**
 * `TriggerWho` `"opponent"` on a trigger about an object: "whenever a
 * creature an opponent controls …". It used to be false for every object
 * (only a player subject — Archfiend of Depravity's "each opponent's end
 * step" — read it), so a card built on it would never have triggered. It
 * reads the object's controller the way `"you-control"` does, as it last
 * existed on the battlefield once it has left (rule 603.10a).
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

/** "Whenever a creature an opponent controls dies, you gain 1 life." */
const WATCHER = "Test Opponent Watcher";
/** "Whenever a creature an opponent controls enters, you gain 1 life." */
const GREETER = "Test Opponent Greeter";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: WATCHER,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Whenever a creature an opponent controls dies, you gain 1 life.",
      triggered: [
        {
          trigger: { on: "dies", who: "opponent", filter: { type: "creature" } },
          targets: [],
          effect: { kind: "gain-life", amount: 1 },
          resolve: null,
          text: "Whenever a creature an opponent controls dies, you gain 1 life.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: GREETER,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Whenever a creature an opponent controls enters, you gain 1 life.",
      triggered: [
        {
          trigger: { on: "enters-battlefield", who: "opponent", filter: { type: "creature" } },
          targets: [],
          effect: { kind: "gain-life", amount: 1 },
          resolve: null,
          text: "Whenever a creature an opponent controls enters, you gain 1 life.",
        },
      ],
    }),
  );

const setUp = (players: readonly PlayerId[]) => {
  const ctl = {} as Record<PlayerId, ScriptedController>;
  for (const player of players) ctl[player] = new ScriptedController(player);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: ctl,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  game.advanceUntil(quiet);
};
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe('a trigger about an object an "opponent" controls', () => {
  it("fires when any opponent's creature dies, and not for its controller's own", () => {
    const game = setUp([A, B, C]);
    spawn(game, WATCHER, A);
    const mine = spawn(game, "Grizzly Bears", A);
    const bobs = spawn(game, "Grizzly Bears", B);
    const carols = spawn(game, "Hill Giant", C);
    const start = life(game, A);

    destroy(game, mine);
    expect(life(game, A)).toBe(start);
    destroy(game, bobs);
    expect(life(game, A)).toBe(start + 1);
    destroy(game, carols);
    expect(life(game, A)).toBe(start + 2);
  });

  it("reads who controlled a creature that died as it last was, not its owner", () => {
    const game = setUp([A, B]);
    spawn(game, WATCHER, A);
    // Bob's Bears, stolen by Alice: it dies under her control, so it isn't an
    // opponent's creature dying, though an opponent owns it.
    const stolen = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [
      { kind: "object", object: stolen },
    ]);
    game.advanceUntil(quiet);
    expect(game.state.objects[stolen].controller).toBe(A);
    const start = life(game, A);
    destroy(game, stolen);
    expect(life(game, A)).toBe(start);
  });

  it("fires when an opponent's creature enters", () => {
    const game = setUp([A, B]);
    spawn(game, GREETER, A);
    const start = life(game, A);
    game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(start);
    game.debugSpawn("Grizzly Bears", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(start + 1);
  });
});
