/**
 * Three small rules fixes turned up while authoring a batch of staples.
 *
 * - A transforming double-faced permanent with its back face up has its
 *   front face's mana value (rule 712.8e). Lord of Lineage prints no cost,
 *   but a flipped Bloodline Keeper is still mana value 4 — Despark can exile
 *   it.
 * - Typecycling reveals what it finds (rule 702.29e): Migratory Route's
 *   basic landcycling shows the land to every player.
 * - "Sacrifice a creature" reads what is a creature now: an animated land
 *   can pay it.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

describe("small rules fixes", () => {
  it("a transformed permanent has its front face's mana value", () => {
    const { game } = setUp();
    const keeper = game.debugSpawn("Bloodline Keeper", A, "battlefield");
    const four = { manaValue: { op: "eq" as const, n: 4 } };
    expect(matchesFilter(game.state, registry, keeper, four, { you: A })).toBe(true);
    game.debugApplyEffect(A, { kind: "transform", target: "source" }, [], { source: keeper });
    expect(game.state.objects[keeper].face).toBe(1);
    expect(matchesFilter(game.state, registry, keeper, four, { you: A })).toBe(true);
  });

  it("basic landcycling reveals the land it finds", () => {
    const { game, a } = setUp(["Migratory Route"]);
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const plains = game.debugSpawn("Plains", A, "library");
    const route = game.handOf(A).find((id) => game.state.objects[id].cardName === "Migratory Route");
    if (route === undefined) throw new Error("no Migratory Route");
    game.dispatch({ type: "cycle", player: A, card: route });
    game.advanceUntil(quiet);
    expect(game.state.objects[plains].zone).toBe("hand");
    const revealed = game.state.eventLog.flatMap((e) => (e.type === "cards-revealed" ? e.objects : []));
    expect(revealed).toContain(plains);
  });

  it("an animated land can be sacrificed to a sacrifice-a-creature cost", () => {
    const { game } = setUp();
    const prossh = game.debugSpawn("Prossh, Skyraider of Kher", A, "battlefield");
    const factory = game.debugSpawn("Mishra's Factory", A, "battlefield", { summoningSick: false });
    game.debugSpawn("Forest", A, "battlefield");
    const choices = () => {
      const offer = game
        .legalActions(A)
        .find((o) => o.kind === "activate-ability" && o.source === prossh);
      return offer !== undefined && "sacrifice" in offer ? (offer.sacrifice?.choices ?? []) : [];
    };
    // A land that isn't a creature right now is no creature to sacrifice.
    expect(choices()).not.toContain(factory);
    game.dispatch({ type: "activate-ability", player: A, source: factory, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(choices()).toContain(factory);
  });
});
