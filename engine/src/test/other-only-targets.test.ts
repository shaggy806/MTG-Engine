/**
 * An activated ability's `otherOnly` keeps its source out of its own
 * sacrifice cost and nowhere else: "Sacrifice another creature: … target
 * creature you control" may target the source itself.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });

describe("Dina, Essence Brewer — its only other creature has shroud", () => {
  it("may still target Dina herself", () => {
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
    const dina = spawn(game, "Dina, Essence Brewer");
    for (let i = 0; i < 2; i += 1) spawn(game, "Swamp");
    // Algae Gharial (1/1, shroud) can be sacrificed but not targeted.
    const gharial = spawn(game, "Algae Gharial");
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === dina && x.abilityIndex === 0);
    expect(offer).toBeDefined();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: dina,
      abilityIndex: 0,
      targets: [obj(dina)],
      sacrifice: gharial,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[gharial].zone).toBe("graveyard");
    expect(game.state.objects[dina].counters["+1/+1"]).toBe(1);
    expect(game.state.players[A].life).toBe(21);
  });
});
