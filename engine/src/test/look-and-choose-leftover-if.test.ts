/**
 * A look-and-choose whose leftover destination depends on how things stand
 * once the chosen cards have moved (`leftoverIf`) — Nine-Fingers Keene's
 * "look at the top nine cards of your library. You may put a Gate card from
 * among them onto the battlefield. Then if you control nine or more Gates,
 * put the rest into your graveyard. Otherwise, put the rest on the bottom of
 * your library in a random order." (Three Gates here, not nine.)
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const GATE = "Test Gate";
const registry = createDefaultRegistry().register(
  defineCard({ name: GATE, types: ["land"], subtypes: ["Gate"], text: "" }),
);

const KEENE: EffectSpec = {
  kind: "look-and-choose",
  zone: "library",
  count: 5,
  min: 0,
  max: 1,
  filter: { subtype: "Gate" },
  destination: "battlefield",
  leftover: "bottom-random",
  leftoverIf: {
    condition: { kind: "controls", filter: { subtype: "Gate" }, atLeast: 3 },
    leftover: "graveyard",
  },
};

/** Alice's library, after her opening seven and first draw: a Gate, then
 * four Forests, then thirty Islands. */
const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      {
        player: A,
        cards: [
          ...Array<string>(8).fill("Island"),
          GATE,
          ...Array<string>(4).fill("Forest"),
          ...Array<string>(30).fill("Island"),
        ],
      },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const gates = (game: Game, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(GATE, A, "battlefield");
};
const look = (game: Game, take: boolean): ObjectId[] => {
  // A real source: "you control" is counted from its controller.
  const source = game.debugSpawn("Mountain", A, "battlefield");
  game.debugApplyEffect(A, KEENE, [], { source });
  const awaiting = game.state.awaiting;
  if (awaiting?.kind !== "choose-from-zone") throw new Error("expected a choice");
  const gate = awaiting.eligible[0];
  game.dispatch({ type: "choose-from-zone", player: A, chosen: take ? [gate] : [] });
  return [...awaiting.ids];
};
const zonesOf = (game: Game, ids: readonly ObjectId[]): string[] =>
  ids.map((id) => `${game.state.objects[id].cardName}:${game.state.objects[id].zone}`);

describe("a leftover destination decided after the choice", () => {
  it("the Gate just put onto the battlefield makes three: the rest into the graveyard", () => {
    const game = setUp();
    gates(game, 2);
    const looked = look(game, true);
    expect(zonesOf(game, looked)).toEqual([
      `${GATE}:battlefield`,
      "Forest:graveyard",
      "Forest:graveyard",
      "Forest:graveyard",
      "Forest:graveyard",
    ]);
  });

  it("two Gates: otherwise — the rest on the bottom", () => {
    const game = setUp();
    gates(game, 1);
    const looked = look(game, true);
    expect(zonesOf(game, looked).slice(1)).toEqual(Array<string>(4).fill("Forest:library"));
    const library = game.state.zones.perPlayer[A].library;
    expect(library.slice(-4).every((id) => looked.includes(id))).toBe(true);
  });

  it("taking nothing with two out: still two — bottom", () => {
    const game = setUp();
    gates(game, 2);
    const looked = look(game, false);
    expect(zonesOf(game, looked).every((z) => z.endsWith(":library"))).toBe(true);
  });
});
