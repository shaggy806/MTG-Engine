/**
 * Warp (rule 702.185a): cast from the hand for its warp cost; the permanent
 * is exiled at the beginning of the next end step by a delayed triggered
 * ability, and its owner may cast it from exile after that turn — for its
 * mana cost, for as long as it stays exiled. Shipped against Starfield
 * Vocalist.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (islands: number) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: ["Starfield Vocalist", ...Array(40).fill("Island")] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  for (let i = 0; i < islands; i += 1) game.debugSpawn("Island", A, "battlefield");
  const vocalist = game.handOf(A).find((id) => game.state.objects[id].cardName === "Starfield Vocalist")!;
  return { game, vocalist };
};

const casts = (game: Game, card: ObjectId): Extract<LegalAction, { kind: "cast-spell" }>[] =>
  game.legalActions(A).filter((a): a is Extract<LegalAction, { kind: "cast-spell" }> =>
    a.kind === "cast-spell" && a.card === card,
  );

const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;

const warpIt = (game: Game, vocalist: ObjectId): void => {
  game.dispatch({ type: "cast-spell", player: A, card: vocalist, targets: [], via: "warp" });
  game.advanceUntil(settled);
};

describe("Warp — Starfield Vocalist", () => {
  it("is offered from the hand for its warp cost, which two lands pay", () => {
    const { game, vocalist } = setUp(2);
    expect(casts(game, vocalist).map((a) => a.via)).toEqual(["warp"]);
    warpIt(game, vocalist);
    expect(game.state.objects[vocalist].zone).toBe("battlefield");
  });

  it("exiles it at the next end step with a trigger, castable from exile from the next turn on", () => {
    const { game, vocalist } = setUp(4);
    warpIt(game, vocalist);
    game.advanceUntil((s) => s.turn.step === "end" && s.zones.shared.stack.length > 0);
    // A delayed triggered ability on the stack, which players can respond to.
    expect(game.state.objects[vocalist].zone).toBe("battlefield");
    game.advanceUntil((s) => s.turn.step === "end" && settled(s));
    expect(game.state.objects[vocalist].zone).toBe("exile");
    expect(game.state.objects[vocalist].impulse).toMatchObject({ player: A, fromTurn: 2 });
    // Alice's next turn: cast from exile, for its mana cost.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const fromExile = casts(game, vocalist);
    expect(fromExile.map((a) => a.via)).toEqual(["impulse"]);
    game.dispatch({ type: "cast-spell", player: A, card: vocalist, targets: [], via: "impulse" });
    game.advanceUntil(settled);
    expect(game.state.objects[vocalist].zone).toBe("battlefield");
    // Cast for its mana cost this time: it stays.
    game.advanceUntil((s) => s.turn.number === 4);
    expect(game.state.objects[vocalist].zone).toBe("battlefield");
  });

  it("leaves be a creature that left and came back before the end step (rule 400.7)", () => {
    const { game, vocalist } = setUp(2);
    warpIt(game, vocalist);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: vocalist }]);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[vocalist].zone).toBe("hand");
  });

  it("can't be combined with another alternative cost", () => {
    const { game, vocalist } = setUp(2);
    expect(
      game.canDispatch({ type: "cast-spell", player: A, card: vocalist, targets: [], via: "warp", free: true }),
    ).toMatch(/alternative cost/);
  });
});

describe("Warp cards", () => {
  const board = (hand: readonly string[]) => {
    const a = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: [...hand, ...Array(40).fill("Plains")] },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    return { game, a };
  };

  it("Starwinder: may draw as many cards as the combat damage dealt", () => {
    const { game, a } = board([]);
    game.debugSpawn("Starwinder", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];
    a.chooseModesFn = () => [0];
    const before = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && settled(s));
    expect(game.handOf(A).length - before).toBe(6);
  });

  it("Haliya: draws at the end step only after 3 or more life gained this turn", () => {
    const { game } = board([]);
    game.debugSpawn("Haliya, Guided by Light", A, "battlefield");
    for (const n of [2, 3]) {
      const turn = game.state.turn.number;
      game.debugApplyEffect(A, { kind: "gain-life", amount: n });
      const before = game.handOf(A).length;
      game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "cleanup");
      expect(game.handOf(A).length - before).toBe(n >= 3 ? 1 : 0);
      game.advanceUntil((s) => s.turn.number === turn + 2 && s.turn.step === "precombat-main");
    }
  });

  it("Starfield Shepherd: finds a basic Plains or a creature card of mana value 1 or less", () => {
    // The opening hand and first draw take the Shepherd and seven Islands;
    // the rest is library. Cast for its warp cost.
    const { game, a } = board([
      "Starfield Shepherd",
      ...Array(7).fill("Island"),
      "Llanowar Elves",
      "Grizzly Bears",
      "Island",
    ]);
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, ids, _min, max) => {
      eligible = ids;
      return ids.slice(0, max);
    };
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    const shepherd = game.handOf(A).find((id) => game.state.objects[id].cardName === "Starfield Shepherd")!;
    game.dispatch({ type: "cast-spell", player: A, card: shepherd, targets: [], via: "warp" });
    game.advanceUntil(settled);
    const names = new Set(eligible.map((id) => game.state.objects[id].cardName));
    expect(names.has("Plains")).toBe(true);
    expect(names.has("Llanowar Elves")).toBe(true);
    expect(names.has("Grizzly Bears")).toBe(false);
    expect(names.has("Island")).toBe(false);
  });
});
