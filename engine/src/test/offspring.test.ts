/**
 * Offspring (rule 702.175a): an optional additional cost; if it was paid,
 * "when this creature enters, create a 1/1 token copy of it" — even once the
 * creature has left (the ruling), and never for a token copy itself.
 * Shipped against Iridescent Vinelasher.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: ["Iridescent Vinelasher", ...Array(40).fill("Swamp")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
  const card = game.handOf(A).find((id) => game.state.objects[id].cardName === "Iridescent Vinelasher")!;
  return { game, card };
};

const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;
const lashers = (game: Game) =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === "Iridescent Vinelasher");

describe("Offspring — Iridescent Vinelasher", () => {
  it("is offered with and without the offspring cost, labelled as offspring", () => {
    const { game, card } = setUp();
    const offers = game.legalActions(A).filter((a) => a.kind === "cast-spell" && a.card === card);
    expect(offers.map((a) => (a.kind === "cast-spell" ? (a.kickerKeyword ?? null) : null))).toEqual([
      null,
      "offspring",
    ]);
  });

  it("makes a 1/1 token copy when the offspring cost was paid", () => {
    const { game, card } = setUp();
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], kicked: true });
    game.advanceUntil(settled);
    const both = lashers(game);
    expect(both).toHaveLength(2);
    const token = both.find((id) => game.state.objects[id].isToken)!;
    expect(game.characteristics(token)).toMatchObject({ power: 1, toughness: 1 });
  });

  it("makes none when it wasn't", () => {
    const { game, card } = setUp();
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(settled);
    expect(lashers(game)).toHaveLength(1);
  });

  it("still makes the copy when the creature has left before the trigger resolves", () => {
    const { game, card } = setUp();
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], kicked: true });
    game.advanceUntil((s) => s.zones.shared.stack.some((id) => s.objects[id].kind === "ability"));
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: card }]);
    game.advanceUntil(settled);
    expect(game.state.objects[card].zone).toBe("graveyard");
    const tokens = lashers(game);
    expect(tokens).toHaveLength(1);
    expect(game.state.objects[tokens[0]].isToken).toBe(true);
  });
});

describe("Darkstar Augur", () => {
  it("at upkeep puts the revealed top card into your hand, not drawn, and costs its mana value in life", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
      // Eight to the opening hand and turn 1's draw, then the Wurm (mana
      // value 6) is on top for turn 3's upkeep, before its draw.
      decks: [
        { player: A, cards: [...Array(8).fill("Swamp"), "Craw Wurm", ...Array(40).fill("Swamp")] },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    game.debugSpawn("Darkstar Augur", A, "battlefield");
    const life = game.state.players[A].life;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    const wurm = Object.values(game.state.objects).find((o) => o.cardName === "Craw Wurm")!;
    expect(wurm.zone).toBe("hand");
    expect(game.state.players[A].life).toBe(life - 6);
    expect(game.eventsOfType("card-drawn").some((e) => e.object === wurm.id)).toBe(false);
  });
});
