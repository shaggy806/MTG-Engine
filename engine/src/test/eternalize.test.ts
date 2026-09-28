/**
 * Eternalize (rule 702.129a): "[Cost], Exile this card from your graveyard:
 * Create a token that's a copy of it, except it's a 4/4 black Zombie … with
 * no mana cost. Eternalize only as a sorcery." Shipped against Fanatic of
 * Rhonas and Timeless Witness.
 */
import { describe, expect, it } from "vitest";

import { manaValue, parseManaCost } from "../mana.js";
import { printedManaCost } from "../filter.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (lands: number) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array(40).fill("Forest") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (let i = 0; i < lands; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return game;
};

const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("Eternalize", () => {
  it("Fanatic of Rhonas: exiles the card and makes a 4/4 black Zombie Snake Druid with no mana cost", () => {
    const game = setUp(4);
    const card = game.debugSpawn("Fanatic of Rhonas", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: card, abilityIndex: 2, targets: [] });
    expect(game.state.objects[card].zone).toBe("exile");
    game.advanceUntil(settled);
    const token = game.battlefield.find((id) => game.state.objects[id].cardName === "Fanatic of Rhonas")!;
    expect(game.state.objects[token].isToken).toBe(true);
    const c = game.characteristics(token);
    expect(c).toMatchObject({ power: 4, toughness: 4 });
    expect([...c.colors]).toEqual(["B"]);
    expect([...c.subtypes].sort()).toEqual(["Druid", "Snake", "Zombie"]);
    expect(manaValue(parseManaCost(printedManaCost(game.registry, game.state.objects[token])))).toBe(0);
    // Still a Fanatic: it taps for {G} (once past summoning sickness).
    game.state.objects[token].summoningSick = false;
    expect(
      game.legalActions(A).some((a) => a.kind === "activate-ability" && a.source === token && a.abilityIndex === 0),
    ).toBe(true);
  });

  it("is sorcery speed", () => {
    const game = setUp(4);
    const card = game.debugSpawn("Fanatic of Rhonas", A, "graveyard");
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    expect(game.canDispatch({ type: "activate-ability", player: A, source: card, abilityIndex: 2, targets: [] })).not.toBeNull();
  });

  it("Timeless Witness: the token's enters trigger returns a card", () => {
    const game = setUp(7);
    const witness = game.debugSpawn("Timeless Witness", A, "graveyard");
    const bear = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: witness, abilityIndex: 0, targets: [] });
    game.advanceUntil(settled);
    expect(game.state.objects[bear].zone).toBe("hand");
  });
});
