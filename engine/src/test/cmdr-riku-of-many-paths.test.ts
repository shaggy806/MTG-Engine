/**
 * Riku of Many Paths — {G}{U}{R} legendary 3/3 Human Wizard.
 *
 *   Whenever you cast a modal spell, choose up to X, where X is the number of
 *   times you chose a mode for that spell —
 *   • Exile the top card of your library. Until the end of your next turn,
 *     you may play it.
 *   • Put a +1/+1 counter on Riku. It gains trample until end of turn.
 *   • Create a 1/1 blue Bird creature token with flying.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();
const BIRD = "1/1 Blue Bird Token";

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const riku = game.debugSpawn("Riku of Many Paths", A, "battlefield", { summoningSick: false });
  for (const land of ["Forest", "Forest", "Island", "Island"]) game.debugSpawn(land, A, "battlefield");
  const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
  return { game, a, riku, bears };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const birds = (game: Game): number =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === BIRD).length;
/** Applied Biomancy with both of its modes: +1/+1 on Riku, and Bob's Bears
 * back to hand. */
const castBothModes = (game: Game, riku: ObjectId, bears: ObjectId): void =>
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: game.debugSpawn("Applied Biomancy", A, "hand"),
    modes: [0, 1],
    targets: [obj(riku), obj(bears)],
  });

describe("Riku of Many Paths", () => {
  it("a modal spell cast with two modes: choose up to two, as the ability goes on the stack", () => {
    const { game, riku, bears } = setUp();
    castBothModes(game, riku, bears);
    // Asked before the ability is on the stack — only the spell is there.
    const asked = game.state.awaiting;
    expect(asked?.kind === "choose-modes" ? [asked.announcing, asked.minModes, asked.maxModes] : null).toEqual([
      true,
      0,
      2,
    ]);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    game.dispatch({ type: "choose-modes", player: A, modes: [2, 1] });
    const ability = game.state.zones.shared.stack.at(-1)!;
    expect(game.state.objects[ability].chosenModes).toEqual([1, 2]);
    game.advanceUntil(quiet);
    expect(game.state.objects[riku].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(riku).keywords.has("trample")).toBe(true);
    expect(birds(game)).toBe(1);
  });

  it("a mode chosen once: up to one", () => {
    const { game } = setUp();
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Evolution Charm", A, "hand"),
      modes: [0],
    });
    const asked = game.state.awaiting;
    expect(asked?.kind === "choose-modes" ? asked.maxModes : null).toBe(1);
  });

  it("a spell that isn't modal doesn't trigger it", () => {
    const { game } = setUp();
    const before = game.state.eventLog.length;
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand") });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.zones.shared.stack).toHaveLength(1);
    // Not triggered and then dropped for choosing nothing: not triggered.
    expect(game.state.eventLog.slice(before).some((e) => e.type === "trigger-removed")).toBe(false);
  });

  it("choosing none removes the ability from the stack", () => {
    const { game, riku, bears } = setUp();
    castBothModes(game, riku, bears);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    expect(game.state.zones.shared.stack).toHaveLength(1);
    game.advanceUntil(quiet);
    expect(game.state.objects[riku].counters["+1/+1"]).toBeUndefined();
    expect(birds(game)).toBe(0);
  });

  it("the modes stay what was chosen, whatever happens before it resolves", () => {
    const { game, riku, bears } = setUp();
    castBothModes(game, riku, bears);
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    // In response, Riku is destroyed: the +1/+1 mode does nothing, and
    // nothing is asked again as it resolves.
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(riku)]);
    let askedAgain = false;
    game.advanceUntil((s) => {
      if (s.awaiting?.kind === "choose-modes") askedAgain = true;
      return quiet(s);
    });
    expect(askedAgain).toBe(false);
    expect(birds(game)).toBe(0);
    expect(game.state.objects[riku].zone).toBe("graveyard");
  });

  it("the first mode exiles the top card, playable until the end of your next turn", () => {
    const { game, riku, bears } = setUp();
    const top = game.state.zones.perPlayer[A].library[0];
    castBothModes(game, riku, bears);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.state.objects[top].zone).toBe("exile");
    expect(game.state.objects[top].impulse).toBeDefined();
  });
});
