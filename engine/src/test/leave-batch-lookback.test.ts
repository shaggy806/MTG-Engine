/**
 * Permanents that leave the battlefield in one event leave together, however
 * the engine orders the moves. So a static of one of them still reaches the
 * others:
 * - a dies-trigger doubler that dies with them doubles their triggers, and
 *   its own (Teysa Karlov's rulings);
 * - a "would die, exile instead" permanent destroyed with them still exiles
 *   them (Vren, the Relentless's ruling; Rest in Peace the same way).
 */

import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
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
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const wrath = (game: Game) => {
  game.debugApplyEffect(A, { kind: "destroy-all", filter: { type: "creature" } }, []);
  game.advanceUntil(quiet);
};

describe("Teysa Karlov", () => {
  it("doubles the dies triggers of creatures dying with her, and her own death's", () => {
    const game = setUp();
    ["Teysa Karlov", "Zulaport Cutthroat", "Grizzly Bears"].forEach((name) => spawn(game, name));
    wrath(game);
    // Three creatures died, each drain twice.
    expect(game.state.players[B].life).toBe(14);
    expect(game.state.players[A].life).toBe(26);
  });

  it("doubles the triggers her own lone death causes", () => {
    const game = setUp();
    const teysa = spawn(game, "Teysa Karlov");
    spawn(game, "Zulaport Cutthroat");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(teysa)]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(18);
  });

  it("gives creature tokens vigilance and lifelink", () => {
    const game = setUp();
    spawn(game, "Teysa Karlov");
    game.debugApplyEffect(A, { kind: "create-token", token: "Rat Token", count: 1 }, []);
    const rat = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].isToken);
    if (rat === undefined) throw new Error("no token");
    const keywords = computeCharacteristics(game.state, registry, rat).keywords;
    expect(keywords.has("vigilance") && keywords.has("lifelink")).toBe(true);
  });
});

describe("Vren, the Relentless", () => {
  it("exiles an opponent's creatures that die in the same wrath as Vren", () => {
    const game = setUp();
    const vren = spawn(game, "Vren, the Relentless");
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Hill Giant", B)];
    wrath(game);
    expect(game.state.objects[vren].zone).toBe("graveyard");
    for (const id of theirs) expect(game.state.objects[id].zone).toBe("exile");
  });

  it("makes a Rat per creature exiled from an opponent this turn, each growing with the others", () => {
    const game = setUp();
    spawn(game, "Vren, the Relentless");
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Hill Giant", B)];
    for (const id of theirs) {
      game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(id)]);
    }
    game.advanceUntil(quiet);
    for (const id of theirs) expect(game.state.objects[id].zone).toBe("exile");
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    const rats = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Rat Token (Vren)",
    );
    expect(rats).toHaveLength(2);
    // Each sees the other token and Vren, a Rat too.
    for (const id of rats) expect(computeCharacteristics(game.state, registry, id).power).toBe(3);
  });

  it("leaves a mill alone: only dying is replaced", () => {
    const game = setUp();
    spawn(game, "Vren, the Relentless");
    const top = game.state.zones.perPlayer[B].library[0];
    game.debugApplyEffect(A, { kind: "mill", target: 0, amount: 1 }, [{ kind: "player", player: B }]);
    expect(game.state.objects[top].zone).toBe("graveyard");
  });
});

describe("Rest in Peace destroyed beside creatures", () => {
  it("still exiles them", () => {
    const game = setUp();
    const rip = spawn(game, "Rest in Peace");
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(
      A,
      { kind: "destroy-all", filter: { typesAnyOf: ["creature", "enchantment"] } },
      [],
    );
    game.advanceUntil(quiet);
    expect(game.state.objects[rip].zone).toBe("exile");
    expect(game.state.objects[bears].zone).toBe("exile");
  });
});
