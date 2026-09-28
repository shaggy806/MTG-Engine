/**
 * Prototype (rule 718): cast with the prototype mana cost, colors and size
 * instead — on the stack and the battlefield, and to whatever copies it —
 * and back to normal anywhere else. Shipped against Combat Thresher
 * (colorless {7} 3/3; "Prototype {2}{W} — 1/1").
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { printedManaCost } from "../filter.js";
import { manaValue, parseManaCost } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (lands: readonly string[]) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: ["Combat Thresher", ...Array(40).fill("Island")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (const land of lands) game.debugSpawn(land, A, "battlefield");
  const card = game.handOf(A).find((id) => game.state.objects[id].cardName === "Combat Thresher")!;
  return { game, a, card };
};

const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;
const casts = (game: Game, card: ObjectId) =>
  game.legalActions(A).filter((x): x is Extract<LegalAction, { kind: "cast-spell" }> => x.kind === "cast-spell" && x.card === card);
const mv = (game: Game, id: ObjectId): number => manaValue(parseManaCost(printedManaCost(game.registry, game.state.objects[id])));

describe("Prototype — Combat Thresher", () => {
  it("is offered prototyped for {2}{W} when only that is affordable", () => {
    const { game, card } = setUp(["Plains", "Plains", "Plains"]);
    expect(casts(game, card).map((c) => [c.prototype ?? false, c.prototypeCost ?? null])).toEqual([[true, "{2}{W}"]]);
  });

  it("is a white 1/1 of mana value 3 on the stack and the battlefield", () => {
    const { game, card } = setUp(["Plains", "Plains", "Plains"]);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], prototype: true });
    expect([...game.characteristics(card).colors]).toEqual(["W"]);
    expect(mv(game, card)).toBe(3);
    game.advanceUntil(settled);
    const c = game.characteristics(card);
    expect(c).toMatchObject({ power: 1, toughness: 1 });
    expect([...c.colors]).toEqual(["W"]);
    expect(c.keywords.has("double-strike")).toBe(true);
    expect(mv(game, card)).toBe(3);
    // Its enters trigger is its own either way.
    expect(game.handOf(A).length).toBe(hand);
  });

  it("is back to a colorless 3/3 of mana value 7 once it leaves", () => {
    const { game, card } = setUp(["Plains", "Plains", "Plains"]);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], prototype: true });
    game.advanceUntil(settled);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: card }]);
    expect(game.state.objects[card].zone).toBe("hand");
    expect([...game.characteristics(card).colors]).toEqual([]);
    expect(mv(game, card)).toBe(7);
  });

  it("cast normally, it's the printed colorless 3/3", () => {
    const { game, card } = setUp(Array(7).fill("Island"));
    expect(casts(game, card).map((c) => c.prototype ?? false)).toEqual([false]);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(settled);
    expect(game.characteristics(card)).toMatchObject({ power: 3, toughness: 3 });
    expect([...game.characteristics(card).colors]).toEqual([]);
  });

  it("a Clone of a prototyped one is a white 1/1 too (the ruling)", () => {
    const { game, a, card } = setUp(["Plains", "Plains", "Plains"]);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], prototype: true });
    game.advanceUntil(settled);
    a.chooseCopyFn = () => card;
    const clone = game.debugSpawn("Clone", A, "hand");
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A, "battlefield");
    game.dispatch({ type: "cast-spell", player: A, card: clone, targets: [] });
    game.advanceUntil(settled);
    const c = game.characteristics(clone);
    expect(game.state.objects[clone].copyOf).toBe("Combat Thresher");
    expect(c).toMatchObject({ power: 1, toughness: 1 });
    expect([...c.colors]).toEqual(["W"]);
  });
});
