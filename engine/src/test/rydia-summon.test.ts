/**
 * Rydia, Summoner of Mist's Summon: "{X}, {T}: Return target Saga card with
 * mana value X from your graveyard …". A target filter that reads X has no
 * options until X is chosen, so the ability is offered once per X that some
 * Saga card fits, with that X fixed.
 */

import { describe, expect, it } from "vitest";

import type { Action, LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { RandomController, ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (lands: number) => {
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
  const rydia = game.debugSpawn("Rydia, Summoner of Mist", A, "battlefield", { summoningSick: false });
  for (let i = 0; i < lands; i += 1) game.debugSpawn("Forest", A, "battlefield");
  const benalia = game.debugSpawn("History of Benalia", A, "graveyard"); // mana value 3
  const titan = game.debugSpawn("Summon: Titan", A, "graveyard"); // mana value 5
  return { game, rydia, benalia, titan };
};

type Activate = Extract<LegalAction, { kind: "activate-ability" }>;
const summons = (game: Game, rydia: ObjectId): Activate[] =>
  game
    .legalActions(A)
    .filter((a): a is Activate => a.kind === "activate-ability" && a.source === rydia);
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.priority.holder !== null;

describe("Rydia, Summoner of Mist's Summon", () => {
  it("is offered once per X a Saga card in the graveyard has, each with its own target", () => {
    const { game, rydia, benalia, titan } = setUp(5);
    const offers = summons(game, rydia);
    expect(offers.map((o) => o.xCost)).toEqual([
      { minX: 3, maxX: 3 },
      { minX: 5, maxX: 5 },
    ]);
    expect(offers[0].targetOptions).toEqual([[{ kind: "object", object: benalia }]]);
    expect(offers[1].targetOptions).toEqual([[{ kind: "object", object: titan }]]);
  });

  it("isn't offered at an X it can't pay for", () => {
    const { game, rydia } = setUp(4);
    expect(summons(game, rydia).map((o) => o.xCost)).toEqual([{ minX: 3, maxX: 3 }]);
  });

  it("returns the Saga with a finality counter, hasty", () => {
    const { game, rydia, titan } = setUp(5);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: rydia,
      abilityIndex: 0,
      targets: [{ kind: "object", object: titan }],
      xValue: 5,
    });
    game.advanceUntil((s) => quiet(s) && s.zones.shared.battlefield.includes(titan));
    const returned = game.state.objects[titan];
    expect(returned.zone).toBe("battlefield");
    expect(returned.counters.finality).toBe(1);
    expect(game.viewFor(A).objects[titan]?.keywords).toContain("haste");
  });

  it("refuses a target whose mana value isn't the X paid", () => {
    const { game, rydia, benalia } = setUp(5);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: rydia,
        abilityIndex: 0,
        targets: [{ kind: "object", object: benalia }],
        xValue: 5,
      }),
    ).toThrow();
    expect(game.state.objects[benalia].zone).toBe("graveyard");
  });

  it("a random driver only ever activates it legally", () => {
    const { game, rydia } = setUp(6);
    let seed = 7;
    const random = new RandomController(A, () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    });
    const toAction = (offer: LegalAction): Action =>
      (random as unknown as { toAction(o: LegalAction): Action }).toAction(offer);
    for (let i = 0; i < 20; i += 1) {
      for (const offer of summons(game, rydia)) {
        const copy = Game.fromSnapshot(game.snapshot(), {
          registry,
          controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
        });
        expect(() => copy.dispatch(toAction(offer))).not.toThrow();
      }
    }
  });
});
