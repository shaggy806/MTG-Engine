/**
 * The `reveal-top` effect and Thrasios, Triton Hero, the card it was built
 * for: "{4}: Scry 1, then reveal the top card of your library. If it's a land
 * card, put it onto the battlefield tapped. Otherwise, draw a card."
 *
 * Also the `source` condition ("as long as ~ is equipped"), added alongside:
 * it's the same "read the object this ability belongs to" question, asked
 * by filter.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { staticConditionMet } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Grizzly Bears") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const thrasios = game.debugSpawn("Thrasios, Triton Hero", A, "battlefield");
  for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return { game, a, thrasios };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const activate = (game: Game, thrasios: ObjectId): void => {
  game.dispatch({ type: "activate-ability", player: A, source: thrasios, abilityIndex: 0 });
  game.advanceUntil(quiet);
};
const revealed = (game: Game): ObjectId[] =>
  game.state.eventLog.flatMap((e) => (e.type === "cards-revealed" ? e.objects : []));

describe("Thrasios, Triton Hero", () => {
  it("puts a revealed land onto the battlefield tapped", () => {
    const { game, thrasios } = setUp();
    const land = game.debugSpawn("Island", A, "library");
    const hand = game.handOf(A).length;

    activate(game, thrasios);
    expect(revealed(game)).toEqual([land]);
    expect(game.state.revealedThisTurn).toContain(land);
    expect(game.state.objects[land].zone).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(true);
    expect(game.handOf(A).length).toBe(hand);
  });

  it("draws the revealed card when it isn't a land", () => {
    const { game, thrasios } = setUp();
    const top = game.state.zones.perPlayer[A].library[0];
    const hand = game.handOf(A).length;

    activate(game, thrasios);
    expect(revealed(game)).toEqual([top]);
    expect(game.state.objects[top].zone).toBe("hand");
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("reveals the card the scry left on top, not the one it bottomed", () => {
    const { game, a, thrasios } = setUp();
    const land = game.debugSpawn("Island", A, "library");
    const next = game.state.zones.perPlayer[A].library[1];
    a.chooseScryFn = (_view, looked) => [...looked];

    activate(game, thrasios);
    expect(revealed(game)).toEqual([next]);
    expect(game.state.objects[land].zone).toBe("library");
    expect(game.state.objects[next].zone).toBe("hand");
  });
});

describe("the source condition", () => {
  it("asks whether the ability's own source matches a filter", () => {
    const { game, thrasios } = setUp();
    const blade = game.debugSpawn("Bonesplitter", A, "battlefield");
    const equipped = { kind: "source" as const, filter: { equipped: true } };
    const src = () => game.state.objects[thrasios];

    expect(staticConditionMet(game.state, registry, src(), equipped)).toBe(false);
    game.debugApplyEffect(A, { kind: "attach", target: 0 }, [{ kind: "object", object: thrasios }], {
      source: blade,
    });
    expect(staticConditionMet(game.state, registry, src(), equipped)).toBe(true);
    expect(
      staticConditionMet(game.state, registry, src(), { kind: "source", filter: { tapped: true } }),
    ).toBe(false);
  });
});
