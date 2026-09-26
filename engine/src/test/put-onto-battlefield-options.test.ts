/**
 * Options on putting a card onto the battlefield: **transformed** — from a
 * graveyard ("return it to the battlefield tapped and transformed" — Ojer
 * Axonil) or out of a flicker ("exile Clive, then return it to the
 * battlefield transformed" — Clive, Ifrit's Dominant), now or at a delayed
 * return — and `return-from-graveyard`'s `withCounters` ("with a finality
 * counter on it" — Shilgengar), whether it returns everything at once or
 * asks which.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { TargetRef } from "../target.js";
import { faceName } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
/** A transforming double-faced card: Baithook Angler // Hook-Haunt Drifter. */
const DFC = "Baithook Angler";
const BACK = "Hook-Haunt Drifter";

const setUp = (a = new ScriptedController(A)) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
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
  s.suspendedResolutions.length === 0;
const run = (game: Game, effect: EffectSpec, target?: ObjectId): void => {
  const source = game.debugSpawn("Island", A, "battlefield");
  game.debugApplyEffect(A, effect, target === undefined ? [] : [{ kind: "object", object: target }], {
    source,
  });
  game.advanceUntil(quiet);
};
const face = (game: Game, id: ObjectId): string => faceName(game.state.objects[id]);

describe("transformed", () => {
  it("put onto the battlefield from a graveyard, tapped and transformed", () => {
    const game = setUp();
    const card = game.debugSpawn(DFC, A, "graveyard");
    run(game, { kind: "put-onto-battlefield", target: 0, enterTapped: true, transformed: true }, card);
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(face(game, card)).toBe(BACK);
    expect(game.state.objects[card].tapped).toBe(true);
  });

  it("a card that isn't double-faced just enters", () => {
    const game = setUp();
    const card = game.debugSpawn("Grizzly Bears", A, "graveyard");
    run(game, { kind: "put-onto-battlefield", target: 0, transformed: true }, card);
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(face(game, card)).toBe("Grizzly Bears");
  });

  it("flickered, it returns transformed", () => {
    const game = setUp();
    const card = game.debugSpawn(DFC, A, "battlefield");
    run(game, { kind: "flicker", target: 0, transformed: true }, card);
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(face(game, card)).toBe(BACK);
  });

  it("…at a delayed return too", () => {
    const game = setUp();
    const card = game.debugSpawn(DFC, A, "battlefield");
    run(game, { kind: "flicker", target: 0, transformed: true, returnAt: "next-end-step" }, card);
    expect(game.state.objects[card].zone).toBe("exile");
    game.advanceUntil((s) => s.turn.step === "end" && quiet(s));
    expect(game.state.objects[card].zone).toBe("battlefield");
    expect(face(game, card)).toBe(BACK);
  });
});

describe("return-from-graveyard with counters", () => {
  const finality: EffectSpec = {
    kind: "return-from-graveyard",
    filter: { type: "creature" },
    destination: "battlefield",
    count: "all",
    withCounters: { kind: "finality", amount: 1 },
  };

  it("each returned card enters with them", () => {
    const game = setUp();
    const cards = [game.debugSpawn("Grizzly Bears", A, "graveyard"), game.debugSpawn("Hill Giant", A, "graveyard")];
    run(game, finality);
    for (const id of cards) {
      expect(game.state.objects[id].zone).toBe("battlefield");
      expect(game.state.objects[id].counters.finality).toBe(1);
    }
  });

  it("…the chosen one, when it asks which", () => {
    const game = setUp();
    const cards = [game.debugSpawn("Grizzly Bears", A, "graveyard"), game.debugSpawn("Hill Giant", A, "graveyard")];
    run(game, { ...finality, count: 1 } as EffectSpec);
    const returned = cards.filter((id) => game.state.objects[id].zone === "battlefield");
    expect(returned).toHaveLength(1);
    expect(game.state.objects[returned[0]].counters.finality).toBe(1);
  });

  it("a finality counter exiles it instead of letting it die", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    run(game, finality);
    run(game, { kind: "destroy", target: 0 }, bears);
    expect(game.state.objects[bears].zone).toBe("exile");
  });
});

describe("a card that can't enter the battlefield stays where it was", () => {
  it("an instant or sorcery card (rule 400.4a)", () => {
    const game = setUp();
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    run(game, { kind: "put-onto-battlefield", target: 0 }, bolt);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
    expect(game.eventsOfType("permanent-entered-battlefield").map((e) => e.object)).not.toContain(bolt);
  });

  it("a modal double-faced card whose front face is a sorcery, though it left as its land", () => {
    const game = setUp();
    const card = game.debugSpawn("Malakir Rebirth", A, "hand");
    game.dispatch({ type: "play-land", player: A, card, face: 1 });
    expect(game.state.objects[card].zone).toBe("battlefield");
    // It would come back front face up, and that face can't enter.
    run(game, { kind: "flicker", target: 0 }, card);
    expect(game.state.objects[card].zone).toBe("exile");
  });

  it("Sun Titan returns only a permanent card", () => {
    const a = new ScriptedController(A);
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0] ?? [];
      return [undefined];
    };
    const game = setUp(a);
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Sun Titan", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const ids = offered.map((ref) => (ref.kind === "object" ? ref.object : null));
    expect(ids).toContain(bears);
    expect(ids).not.toContain(bolt);
  });
});
