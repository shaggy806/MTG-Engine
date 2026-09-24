import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { activePlayerOf } from "../state.js";
import type { GameState } from "../state.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const VALGAVOTH = "Valgavoth, Harrower of Souls";

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Mountain"),
];

const mkGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(["Lightning Bolt", "Lightning Bolt", "Lightning Bolt"]) },
      { player: B, cards: pad([]) },
    ],
  });
  return { game, a, b };
};

const mainOf =
  (player: PlayerId) =>
  (s: GameState): boolean =>
    s.turn.step === "precombat-main" && activePlayerOf(s) === player && s.priority.holder === player;
const drained = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Alice Bolts herself (a way to make an opponent of Bob's lose life). */
const boltSelf = (game: Game): void => {
  const bolt = game.handOf(A).find((id) => game.state.objects[id].cardName === "Lightning Bolt");
  if (bolt === undefined) throw new Error("no Bolt");
  game.debugSpawn("Mountain", A, "battlefield");
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: bolt,
    targets: [{ kind: "player", player: A }],
  });
  game.advanceUntil(drained);
};

const plusOnes = (game: Game, id: ObjectId): number =>
  game.state.objects[id].counters["+1/+1"] ?? 0;

describe("Valgavoth, Harrower of Souls", () => {
  it("is a 4/4 black-red legendary Elder Demon with flying, ward—pay 2 life and a life-loss trigger", () => {
    const def = createDefaultRegistry().get(VALGAVOTH);
    expect(def.manaCost).toBe("{2}{B}{R}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.subtypes).toEqual(["Elder", "Demon"]);
    expect([def.power, def.toughness]).toEqual([4, 4]);
    expect(def.keywords).toEqual(["flying"]);
    expect(def.triggered[0].effect).toEqual({ kind: "ward", cost: { payLife: 2 } });
    expect(def.triggered[0].text).toBe("Ward—Pay 2 life.");
    expect(identityString(colorIdentityOf(def))).toBe("BR");
  });

  it("grows and draws the first time an opponent loses life during their own turn — once", () => {
    const { game } = mkGame();
    game.advanceUntil(mainOf(A));
    const valgavoth = game.debugSpawn(VALGAVOTH, B, "battlefield");
    const hand = game.handOf(B).length;

    boltSelf(game);
    expect(plusOnes(game, valgavoth)).toBe(1);
    expect(game.handOf(B).length).toBe(hand + 1);

    boltSelf(game);
    expect(plusOnes(game, valgavoth)).toBe(1);
    expect(game.handOf(B).length).toBe(hand + 1);
  });

  it("a loss earlier in the turn, before Valgavoth arrived, uses the first time up", () => {
    const { game } = mkGame();
    game.advanceUntil(mainOf(A));
    boltSelf(game);
    const valgavoth = game.debugSpawn(VALGAVOTH, B, "battlefield");
    boltSelf(game);
    expect(plusOnes(game, valgavoth)).toBe(0);
  });

  it("ignores an opponent losing life during someone else's turn", () => {
    const { game } = mkGame();
    game.advanceUntil(mainOf(B));
    const valgavoth = game.debugSpawn(VALGAVOTH, B, "battlefield");
    game.dispatch({ type: "pass-priority", player: B });
    boltSelf(game);
    expect(game.state.players[A].life).toBe(17);
    expect(plusOnes(game, valgavoth)).toBe(0);
  });

  it("doesn't trigger on its controller losing life", () => {
    const { game } = mkGame();
    game.advanceUntil(mainOf(B));
    const valgavoth = game.debugSpawn(VALGAVOTH, A, "battlefield");
    game.dispatch({ type: "pass-priority", player: B });
    // Alice (Valgavoth's controller) hits Bob on Bob's turn: an opponent, on
    // their own turn — that one counts.
    const bolt = game.handOf(A).find((id) => game.state.objects[id].cardName === "Lightning Bolt");
    game.debugSpawn("Mountain", A, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt as ObjectId,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(drained);
    expect(plusOnes(game, valgavoth)).toBe(1);
    // And Alice losing life herself never does.
    game.dispatch({ type: "pass-priority", player: B });
    boltSelf(game);
    expect(game.state.players[A].life).toBe(17);
    expect(plusOnes(game, valgavoth)).toBe(1);
  });
});
