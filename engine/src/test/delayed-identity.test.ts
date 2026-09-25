/**
 * Zone-change identity (rule 400.7), the two pieces `zone-change-identity`
 * left:
 * - a delayed trigger acts on none of its carried targets that has changed
 *   zones since it was created (Whip of Erebos's end-step exile), while what
 *   it reads of them still comes from last-known information (Mana Drain's
 *   "that spell's mana value");
 * - a permanent that left, came back and left again before an ability of its
 *   first departure resolved is still read as it was at that first
 *   departure (Juri, Master of the Revue).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const move = (game: Game, id: ObjectId, to: string) =>
  (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, to);

describe("a delayed trigger's carried targets", () => {
  it("Whip of Erebos doesn't exile a creature flickered since it came back", () => {
    const { game } = setUp();
    const whip = spawn(game, "Whip of Erebos");
    for (let i = 0; i < 4; i += 1) spawn(game, "Swamp");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: whip, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    // Flickered: exiled and back, a new object.
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("…and still exiles one left alone", () => {
    const { game } = setUp();
    const whip = spawn(game, "Whip of Erebos");
    for (let i = 0; i < 4; i += 1) spawn(game, "Swamp");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: whip, abilityIndex: 0, targets: [obj(bears)] });
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    expect(game.state.objects[bears].zone).toBe("exile");
  });

  it("a read of one that has left since still works (Mana Drain's mana value)", () => {
    const { game } = setUp();
    const bolt = game.debugSpawn("Lightning Bolt", B, "graveyard");
    game.debugApplyEffect(
      A,
      {
        kind: "delayed-trigger",
        at: "your-next-main-phase",
        effect: { kind: "add-mana", mana: "C", amount: { manaValueOf: 0 } },
        text: "Add an amount of {C} equal to the countered spell's mana value.",
      },
      [obj(bolt)],
    );
    // The card leaves the graveyard before the trigger fires.
    move(game, bolt, "exile");
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(poolCounts(game.state.players[A].manaPool).C).toBe(1);
  });
});

describe("a permanent that left twice", () => {
  it("an ability of its first departure reads it as it was then (Juri)", () => {
    const { game, a } = setUp();
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    const juri = spawn(game, "Juri, Master of the Revue");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 }, [obj(juri)]);
    // Dies at 4/4: its trigger goes on the stack.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(juri)]);
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 && s.pendingTriggers.length === 0);
    // In response: back as a 1/1, and dead again.
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(juri)]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(juri)]);
    game.advanceUntil(quiet);
    // 1 from the second death, 4 from the first.
    expect(game.state.players[B].life).toBe(15);
  });
});
