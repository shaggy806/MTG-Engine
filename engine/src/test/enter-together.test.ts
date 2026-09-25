/**
 * Permanents put onto the battlefield by one instruction enter together, so
 * each one's "whenever another creature enters" sees all the others, whichever
 * the engine happened to move first (rule 603.6a — Elas il-Kor's ruling). The
 * entries are announced once all of them are on the battlefield.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

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
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });

describe("entering together", () => {
  it("a return-all: Elas il-Kor, moved last, sees both Bears enter", () => {
    const game = setUp();
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Elas il-Kor, Sadistic Pilgrim", A, "graveyard");
    game.debugApplyEffect(
      A,
      { kind: "return-from-graveyard", filter: { type: "creature" }, count: "all", destination: "battlefield" },
      [],
    );
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(22);
  });

  it("one instruction over two targets (a simultaneous sequence)", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const elas = game.debugSpawn("Elas il-Kor, Sadistic Pilgrim", A, "graveyard");
    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "put-onto-battlefield", target: 1 },
        ],
      },
      [obj(bears), obj(elas)],
    );
    game.advanceUntil(quiet);
    expect(game.state.objects[elas].zone).toBe("battlefield");
    expect(game.state.players[A].life).toBe(21);
  });

  it("Slimefoot and Squee returns itself and another creature card together", () => {
    const game = setUp();
    for (const land of ["Swamp", "Mountain", "Forest", "Forest"]) {
      game.debugSpawn(land, A, "battlefield", { summoningSick: false });
    }
    const slimefoot = game.debugSpawn("Slimefoot and Squee", A, "graveyard");
    const elas = game.debugSpawn("Elas il-Kor, Sadistic Pilgrim", A, "graveyard");
    game.debugApplyEffect(A, { kind: "create-token", token: "Saproling Token", count: 1 }, []);
    const saproling = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Saproling Token",
    );
    if (saproling === undefined) throw new Error("no Saproling");
    game.advanceUntil(quiet);
    const life = game.state.players[A].life;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: slimefoot,
      abilityIndex: 0,
      targets: [obj(elas)],
      sacrifice: saproling,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[slimefoot].zone).toBe("battlefield");
    expect(game.state.objects[elas].zone).toBe("battlefield");
    // Elas sees Slimefoot and Squee enter beside her, and then the Saproling
    // its enters trigger makes.
    expect(game.state.players[A].life).toBe(life + 2);
  });

  it("Slimefoot and Squee: a target gone by resolution counters the whole return", () => {
    const game = setUp();
    for (const land of ["Swamp", "Mountain", "Forest", "Forest"]) {
      game.debugSpawn(land, A, "battlefield", { summoningSick: false });
    }
    const slimefoot = game.debugSpawn("Slimefoot and Squee", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "create-token", token: "Saproling Token", count: 1 }, []);
    const saproling = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Saproling Token",
    );
    if (saproling === undefined) throw new Error("no Saproling");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: slimefoot,
      abilityIndex: 0,
      targets: [obj(bears)],
      sacrifice: saproling,
    });
    // The Bears leave the graveyard with the ability on the stack.
    (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(bears, "exile");
    game.advanceUntil(quiet);
    expect(game.state.objects[slimefoot].zone).toBe("graveyard");
  });

  it("separate instructions stay separate: the first doesn't see the second", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const elas = game.debugSpawn("Elas il-Kor, Sadistic Pilgrim", A, "graveyard");
    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        effects: [
          { kind: "put-onto-battlefield", target: 0 },
          { kind: "put-onto-battlefield", target: 1 },
        ],
      },
      [obj(bears), obj(elas)],
    );
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(20);
  });
});
