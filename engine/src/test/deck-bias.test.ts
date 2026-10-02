/**
 * Deck biases (`deck-bias.ts`): a commander's deck reading some effects the
 * other way round. v2's half is pinned by the gate scenarios ("Teval mills
 * itself, not an opponent", "Teval stops milling itself near an empty
 * library"); this file pins v1's, the table, and the lookup.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { HeuristicBotController } from "../controller.js";
import { COMMANDER_BIASES, deckBias } from "../deck-bias.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import { abilityPolarities } from "../target-polarity.js";

const registry = createDefaultRegistry();
const A = asPlayerId("alice");
const B = asPlayerId("bob");

const forests = (player: PlayerId) => ({ player, cards: Array<string>(40).fill("Forest") });

/** Alice's main phase with `commanders` in her command zone and a Hedron
 * Crab out, after she plays a Forest: the landfall trigger asking whom to
 * mill. */
function crabTrigger(commanders: readonly string[]): Game {
  const game = Game.create({
    seed: 3,
    registry,
    decks: [{ ...forests(A), commanders }, forests(B)],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  game.debugSpawn("Hedron Crab", A, "battlefield", { summoningSick: false });
  const forest = game.debugSpawn("Forest", A, "hand");
  game.dispatch({ type: "play-land", player: A, card: forest });
  game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
  expect(game.state.awaiting?.kind).toBe("choose-targets");
  return game;
}

function millTarget(game: Game): PlayerId | undefined {
  const action = new HeuristicBotController(A, registry).act(game.controllerView(A));
  const target = action.type === "choose-targets" ? action.targets[0] : undefined;
  return target?.kind === "player" ? target.player : undefined;
}

describe("deck biases", () => {
  it("v1 mills an opponent by default, and itself under Teval", () => {
    expect(millTarget(crabTrigger([]))).toBe(B);
    expect(millTarget(crabTrigger(["Felothar the Steadfast"]))).toBe(B);
    expect(millTarget(crabTrigger(["Teval, the Balanced Scale"]))).toBe(A);
  });

  it("reads a seat's commanders, and only its own", () => {
    const game = crabTrigger(["Teval, the Balanced Scale"]);
    expect(deckBias(game.state, A)).toBe(COMMANDER_BIASES["Teval, the Balanced Scale"]);
    expect(deckBias(game.state, B)).toBeNull();
  });

  it("flips only the kinds a bias names, and leaves the shared memo alone", () => {
    const crab = registry.get("Hedron Crab").triggered[0];
    const bolt = registry.get("Lightning Bolt");
    const bias = COMMANDER_BIASES["Teval, the Balanced Scale"].polarity;
    expect(abilityPolarities(crab)).toEqual(["harm"]);
    expect(abilityPolarities(crab, bias)).toEqual(["help"]);
    expect(abilityPolarities(crab)).toEqual(["harm"]);
    expect(abilityPolarities({ targets: bolt.targets, effect: bolt.effect }, bias)).toEqual(["harm"]);
  });

  it("is keyed by real cards that can be commanders", () => {
    for (const [name, bias] of Object.entries(COMMANDER_BIASES)) {
      expect(registry.has(name), name).toBe(true);
      const def = registry.get(name);
      expect((def.supertypes ?? []).includes("legendary") && def.types.includes("creature"), name).toBe(true);
      expect(bias.why.length, name).toBeGreaterThan(0);
    }
  });
});
