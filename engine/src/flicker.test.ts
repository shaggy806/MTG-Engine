import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Plains")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;

describe("Essence Flux — exile a creature you control, then return it fresh", () => {
  it("re-enters as a new object: untapped, no counters, no Aura, summoning sick again", () => {
    const { game } = mkGame(["Essence Flux", "Plains", "Plains"]);
    game.advanceUntil(toPrecombat);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    game.state.objects[bear].counters["+1/+1"] = 2;
    game.state.objects[bear].summoningSick = false;
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Essence Flux")!,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.objects[bear].controller).toBe(A);
    expect(game.state.objects[bear].tapped).toBe(false);
    expect(game.state.objects[bear].counters["+1/+1"]).toBeUndefined();
    expect(game.state.objects[bear].summoningSick).toBe(true);
  });

  it("drops an attached Aura, which then falls off to the graveyard", () => {
    const { game } = mkGame(["Essence Flux", "Plains", "Plains"]);
    game.advanceUntil(toPrecombat);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const aura = game.debugSpawn("Holy Strength", A, "battlefield");
    game.state.objects[aura].attachedTo = bear;
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Essence Flux")!,
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("battlefield");
    expect(game.state.objects[aura].zone).toBe("graveyard");
  });

  it("a flickered token ceases to exist instead of returning", () => {
    const { game } = mkGame(["Essence Flux", "Plains", "Plains"]);
    game.advanceUntil(toPrecombat);
    const token = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[token].isToken = true;
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Essence Flux")!,
      targets: [{ kind: "object", object: token }],
    });
    game.advanceUntil(quiet);

    expect(game.battlefield).not.toContain(token);
    expect(game.state.objects[token]).toBeUndefined();
  });
});
