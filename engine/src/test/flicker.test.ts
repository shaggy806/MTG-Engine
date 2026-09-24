import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

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
      { player: A, cards: [...aHand, ...Array(40).fill("Island")] },
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
    const { game } = mkGame(["Essence Flux", "Island"]);
    game.advanceUntil(toPrecombat);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true });
    game.state.objects[bear].counters["+1/+1"] = 2;
    game.state.objects[bear].summoningSick = false;
    game.debugSpawn("Island", A, "battlefield");

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
    const { game } = mkGame(["Essence Flux", "Island"]);
    game.advanceUntil(toPrecombat);
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const aura = game.debugSpawn("Holy Strength", A, "battlefield");
    game.state.objects[aura].attachedTo = bear;
    game.debugSpawn("Island", A, "battlefield");

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

  it("puts a +1/+1 counter on the returning creature only if it's a Spirit", () => {
    for (const [name, expected] of [
      ["Remorseful Cleric", 1],
      ["Grizzly Bears", undefined],
    ] as const) {
      const { game } = mkGame(["Essence Flux", "Island"]);
      game.advanceUntil(toPrecombat);
      const creature = game.debugSpawn(name, A, "battlefield");
      game.debugSpawn("Island", A, "battlefield");

      game.dispatch({
        type: "cast-spell",
        player: A,
        card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Essence Flux")!,
        targets: [{ kind: "object", object: creature }],
      });
      game.advanceUntil(quiet);

      expect(game.state.objects[creature].zone).toBe("battlefield");
      expect(game.state.objects[creature].counters["+1/+1"]).toBe(expected);
    }
  });

  it("a flickered token ceases to exist instead of returning", () => {
    const { game } = mkGame(["Essence Flux", "Island"]);
    game.advanceUntil(toPrecombat);
    const token = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[token].isToken = true;
    game.debugSpawn("Island", A, "battlefield");

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

describe("Essence Flux on a commander — the 903.9a choice interrupts the blink", () => {
  /** Flicker `A`'s commander and answer the command-zone question with
   * `toCommandZone`. Returns the commander's id and the game. */
  const flickerCommander = (toCommandZone: boolean) => {
    const { game } = mkGame(["Essence Flux", "Island"]);
    game.advanceUntil(toPrecombat);
    // A Spirit Dragon, so the +1/+1 counter clause is in play too.
    const commander = game.debugSpawn("Ureni of the Unwritten", A, "battlefield");
    game.state.objects[commander].isCommander = true;
    game.debugSpawn("Island", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Essence Flux")!,
      targets: [{ kind: "object", object: commander }],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "commander-replacement");
    expect(game.state.awaiting).toMatchObject({ commander, intendedZone: "exile" });

    game.dispatch({ type: "commander-replacement", player: A, toCommandZone });
    game.advanceUntil(quiet);
    return { game, commander };
  };

  it("declining the command zone lets the blink finish — it comes back to the battlefield", () => {
    const { game, commander } = flickerCommander(false);
    expect(game.state.objects[commander].zone).toBe("battlefield");
    expect(game.state.objects[commander].counters["+1/+1"]).toBe(1);
    expect(game.state.pendingFlickerReturns).toEqual([]);
  });

  it("choosing the command zone takes it out of the blink's reach", () => {
    const { game, commander } = flickerCommander(true);
    expect(game.state.objects[commander].zone).toBe("command");
    expect(game.state.pendingFlickerReturns).toEqual([]);
  });
});
