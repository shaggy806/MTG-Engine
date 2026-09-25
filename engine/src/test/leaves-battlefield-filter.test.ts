/**
 * The `leaves-battlefield` trigger's `filter`, `otherOnly` and destinations
 * (`to`), read as the permanent last existed on the battlefield, and the
 * `countersOn` amount over every kind of counter — Reyhan, Last of the
 * Abzan's "whenever a creature you control dies or is put into the command
 * zone, if it had one or more +1/+1 counters on it, you may put that many
 * +1/+1 counters on target creature".
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Gains life equal to the +1/+1 counters a creature of yours had as it died
 * or went to the command zone. */
const HEIR = "Test Abzan Heir";
const registry = createDefaultRegistry().register(
  defineCard({
    name: HEIR,
    manaCost: "{0}",
    types: ["creature"],
    subtypes: ["Human"],
    power: 1,
    toughness: 1,
    text: HEIR,
    triggered: [
      {
        trigger: {
          on: "leaves-battlefield",
          who: "you-control",
          otherOnly: true,
          to: ["graveyard", "command"],
          filter: { type: "creature", counters: { kind: "+1/+1", compare: { op: "gte", n: 1 } } },
        },
        targets: [],
        effect: { kind: "gain-life", amount: { countersOn: "trigger-object", counter: "+1/+1" } },
        resolve: null,
        text: HEIR,
      },
    ],
  }),
);

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
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const run = (game: Game, effect: EffectSpec, target: ObjectId): void => {
  game.debugApplyEffect(A, effect, [{ kind: "object", object: target }]);
  game.advanceUntil(quiet);
};
const withCounters = (game: Game, n: number, player = A): ObjectId => {
  const bears = game.debugSpawn("Grizzly Bears", player, "battlefield");
  if (n > 0) game.state.objects[bears].counters["+1/+1"] = n;
  return bears;
};
const life = (game: Game): number => game.state.players[A].life;

describe("leaves the battlefield: filter, otherOnly, destination", () => {
  it("a creature of yours that dies with counters: that many", () => {
    const game = setUp();
    game.debugSpawn(HEIR, A, "battlefield");
    run(game, { kind: "destroy", target: 0 }, withCounters(game, 2));
    expect(life(game)).toBe(22);
  });

  it("none without counters, none for an opponent's, none bounced to a hand", () => {
    const game = setUp();
    game.debugSpawn(HEIR, A, "battlefield");
    run(game, { kind: "destroy", target: 0 }, withCounters(game, 0));
    run(game, { kind: "destroy", target: 0 }, withCounters(game, 3, B));
    run(game, { kind: "return-to-hand", target: 0 }, withCounters(game, 3));
    expect(life(game)).toBe(20);
  });

  it("exiled isn't one of its destinations; itself leaving doesn't count", () => {
    const game = setUp();
    const heir = game.debugSpawn(HEIR, A, "battlefield");
    run(game, { kind: "exile", target: 0 }, withCounters(game, 2));
    game.state.objects[heir].counters["+1/+1"] = 4;
    run(game, { kind: "destroy", target: 0 }, heir);
    expect(life(game)).toBe(20);
  });
});

describe("counters of every kind", () => {
  it("`countersOn` without a kind adds them all up", () => {
    const game = setUp();
    const bears = withCounters(game, 2);
    game.state.objects[bears].counters.charge = 3;
    run(game, { kind: "gain-life", amount: { countersOn: 0 } }, bears);
    expect(life(game)).toBe(25);
  });
});
