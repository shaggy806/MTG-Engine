/**
 * Helga, Skittish Seer — {G}{W}{U} legendary 1/3 Frog Druid.
 *
 *   Whenever you cast a creature spell with mana value 4 or greater, you
 *   draw a card, gain 1 life, and put a +1/+1 counter on Helga.
 *   {T}: Add X mana of any one color, where X is Helga's power. Spend this
 *   mana only to cast creature spells with mana value 4 or greater or
 *   creature spells with {X} in their mana costs.
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
const HELGA = "Helga, Skittish Seer";

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
  const helga = game.debugSpawn(HELGA, A, "battlefield", { summoningSick: false });
  return { game, helga };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
/** Put `n` +1/+1 counters on Helga: her power is 1 + n. */
const grow = (game: Game, helga: ObjectId, n: number): void =>
  game.debugApplyEffect(A, { kind: "add-counter", target: "source", counter: "+1/+1", amount: n }, [], {
    source: helga,
  });
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === card);

describe("Helga, Skittish Seer", () => {
  it("a creature spell with mana value 4 or greater draws a card, gains 1 life and grows her; a smaller one doesn't", () => {
    const { game, helga } = setUp();
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", A, "hand");
    const hand = game.handOf(A).length;
    const life = game.state.players[A].life;
    game.dispatch({ type: "cast-spell", player: A, card: giant });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toHaveLength(hand); // Hill Giant out, one card in
    expect(game.state.players[A].life).toBe(life + 1);
    expect(game.state.objects[helga].counters["+1/+1"]).toBe(1);

    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Grizzly Bears", A, "hand") });
    game.advanceUntil(quiet);
    expect(game.state.objects[helga].counters["+1/+1"]).toBe(1);
  });

  it("taps for her power in one colour, for a big creature or one with {X} only", () => {
    const { game, helga } = setUp();
    grow(game, helga, 2); // power 3
    game.debugSpawn("Island", A, "battlefield");
    // Hill Giant ({3}{R}, mana value 4): three red from Helga and the Island.
    expect(castable(game, game.debugSpawn("Hill Giant", A, "hand"))).toBe(true);
    // Grizzly Bears ({1}{G}) is too small, and the Island makes no green.
    expect(castable(game, game.debugSpawn("Grizzly Bears", A, "hand"))).toBe(false);
    // Mind Spring has {X}, but isn't a creature: the Island alone can't pay {U}{U}.
    expect(castable(game, game.debugSpawn("Mind Spring", A, "hand"))).toBe(false);
  });

  it("pays for a small creature spell that has {X}", () => {
    const { game, helga } = setUp();
    grow(game, helga, 1); // power 2
    const ballista = game.debugSpawn("Walking Ballista", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: ballista, xValue: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[ballista].zone).toBe("battlefield");
    expect(game.state.objects[helga].tapped).toBe(true);
  });

  it("by hand, offers X of each colour, never a mix", () => {
    const { game, helga } = setUp();
    grow(game, helga, 2); // power 3
    const offers = game
      .legalActions(A)
      .flatMap((o) => (o.kind === "activate-ability" && o.source === helga ? [o.manaColors ?? []] : []));
    expect(offers.map((m) => m.join(""))).toEqual(["WWW", "UUU", "BBB", "RRR", "GGG"]);
  });
});
