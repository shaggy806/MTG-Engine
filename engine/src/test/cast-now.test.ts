/**
 * "You may cast that card" during a resolution — the `cast-now` effect and
 * decision (Chandra, Acolyte of Flame's −2). The card is cast by the
 * ordinary rules (modes, X, targets, its mana cost), timing ignored (rule
 * 608.2g), or not at all; "if that spell would be put into your graveyard,
 * exile it instead".
 */
import { describe, expect, it } from "vitest";

import type { Action, LegalAction } from "../actions.js";
import { HeuristicBotController, RandomController, ScriptedController } from "../controller.js";
import type { PlayerController } from "../controller.js";
import { EvalBotController } from "../bot/eval-bot.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";
import { viewFor } from "../view.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;
type Cast = Extract<Action, { type: "cast-spell" }>;

const setUp = (graveyard: string, lands: readonly string[], bot?: PlayerController) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: bot ?? a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array(40).fill("Plains") },
      { player: B, cards: Array(40).fill("Plains") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const chandra = game.debugSpawn("Chandra, Acolyte of Flame", A, "battlefield");
  for (const land of lands) game.debugSpawn(land, A, "battlefield");
  const card = game.debugSpawn(graveyard, A, "graveyard");
  return { game, a, chandra, card };
};

const minusTwo = (game: Game, chandra: ObjectId, card: ObjectId): void =>
  game.dispatch({
    type: "activate-ability",
    player: A,
    source: chandra,
    abilityIndex: 2,
    targets: [{ kind: "object", object: card }],
  });

const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;

describe("cast-now — Chandra, Acolyte of Flame's −2", () => {
  it("casts Lightning Bolt from the graveyard, paying for it, and exiles it afterwards", () => {
    const { game, a, chandra, card } = setUp("Lightning Bolt", ["Mountain"]);
    let offered: CastNowOffer | undefined;
    a.chooseCastNowFn = (_v, offer): Cast => {
      offered = offer;
      return { type: "cast-spell", player: A, card, targets: [{ kind: "player", player: B }], via: "effect" };
    };
    minusTwo(game, chandra, card);
    game.advanceUntil(settled);
    expect(offered?.casts.map((c) => c.via)).toEqual(["effect"]);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[card].zone).toBe("exile");
    expect(game.battlefield.some((id) => id !== chandra && game.state.objects[id].tapped)).toBe(true);
  });

  it("ignores timing: a sorcery is cast with the ability still resolving", () => {
    const { game, a, chandra, card } = setUp("Divination", ["Island", "Island", "Island"]);
    a.chooseCastNowFn = (): Cast => ({ type: "cast-spell", player: A, card, targets: [], via: "effect" });
    const hand = game.handOf(A).length;
    minusTwo(game, chandra, card);
    game.advanceUntil(settled);
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(game.state.objects[card].zone).toBe("exile");
  });

  it("may be declined: nothing is cast and the card stays", () => {
    const { game, chandra, card } = setUp("Lightning Bolt", ["Mountain"]);
    minusTwo(game, chandra, card);
    game.advanceUntil(settled);
    expect(game.state.objects[card].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(20);
  });

  it("offers nothing when the card can't be paid for", () => {
    const { game, a, chandra, card } = setUp("Lightning Bolt", []);
    let asked = false;
    a.chooseCastNowFn = () => {
      asked = true;
      return null;
    };
    minusTwo(game, chandra, card);
    game.advanceUntil(settled);
    expect(asked).toBe(false);
  });

  it("exiles it when it's countered too", () => {
    const { game, a, chandra, card } = setUp("Lightning Bolt", ["Mountain"]);
    a.chooseCastNowFn = (): Cast => ({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "player", player: B }],
      via: "effect",
    });
    minusTwo(game, chandra, card);
    game.advanceUntil((s) => s.awaiting === null && s.zones.shared.stack.includes(card));
    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [{ kind: "object", object: card }]);
    expect(game.state.objects[card].zone).toBe("exile");
  });

  it("lets an X spell's X be chosen and paid (Fireball, mana value 1 in the graveyard)", () => {
    const { game, a, chandra, card } = setUp("Fireball", ["Mountain", "Mountain", "Mountain"]);
    a.chooseCastNowFn = (_v, offer): Cast => {
      expect(offer.casts[0].xCost?.maxX).toBe(2);
      return { type: "cast-spell", player: A, card, targets: [{ kind: "player", player: B }], via: "effect", xValue: 2 };
    };
    minusTwo(game, chandra, card);
    game.advanceUntil(settled);
    expect(game.state.players[B].life).toBe(18);
  });

  it("casts a modal spell with the modes chosen (Kolaghan's Command)", () => {
    const { game, a, chandra, card } = setUp("Kolaghan's Command", ["Mountain", "Swamp", "Mountain"]);
    const hand = game.handOf(B).length;
    a.chooseCastNowFn = (): Cast => ({
      type: "cast-spell",
      player: A,
      card,
      modes: [1, 3],
      targets: [
        { kind: "player", player: B },
        { kind: "player", player: B },
      ],
      via: "effect",
    });
    minusTwo(game, chandra, card);
    game.advanceUntil(settled);
    expect(game.handOf(B).length).toBe(hand - 1);
    expect(game.state.players[B].life).toBe(18);
    expect(game.state.objects[card].zone).toBe("exile");
  });

  // Each seat kind answers the decision with something the engine takes:
  // the fuzzer's random cast, v1's cast, v2's (v1's, as it has no candidates).
  for (const [name, make] of [
    ["random", () => new RandomController(A, () => 0.99)],
    ["v1", () => new HeuristicBotController(A)],
    ["v2", () => new EvalBotController(A, undefined, {})],
  ] as const) {
    it(`is answered by the ${name} bot`, () => {
      const { game, chandra, card } = setUp("Lightning Bolt", ["Mountain"], make());
      minusTwo(game, chandra, card);
      game.advanceUntil(settled);
      expect(game.state.objects[card].zone).toBe("exile");
      // The random seat aims anywhere; the bots at the opponent.
      if (name !== "random") expect(game.state.players[B].life).toBe(17);
    });
  }
});

// Baral's Expertise: "you may cast a spell with mana value 4 or less from
// your hand without paying its mana cost" — a card picked from a zone, on
// the offer's terms (rule 118.9: an alternative cost; 118.9d: kicker still
// may be paid on top).
describe("cast-now — a free spell from hand (Baral's Expertise)", () => {
  const setUpHand = (hand: readonly string[], bot?: PlayerController) => {
    const a = new ScriptedController(A);
    const game = Game.create({
      seed: 1,
      shuffle: false,
      startingPlayer: A,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: bot ?? a, [B]: new ScriptedController(B) },
      decks: [
        { player: A, cards: ["Baral's Expertise", ...hand, ...Array<string>(40).fill("Plains")] },
        { player: B, cards: Array(40).fill("Plains") },
      ],
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Island", A, "battlefield");
    const inHand = (name: string): ObjectId => game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
    const expertise = (): void =>
      game.dispatch({ type: "cast-spell", player: A, card: inHand("Baral's Expertise"), targets: [null, null, null] });
    return { game, a, inHand, expertise };
  };

  it("offers only free casts, a kicked one among them, and the kicker is paid", () => {
    const { game, a, inHand, expertise } = setUpHand(["Orim's Chant"]);
    const chant = inHand("Orim's Chant");
    let offered: CastNowOffer | undefined;
    a.chooseCastNowFn = (_v, offer): Cast => {
      offered = offer;
      return { type: "cast-spell", player: A, card: chant, targets: [{ kind: "player", player: B }], via: "effect", free: true, kicked: true };
    };
    expertise();
    // Only the Plains can pay the kicker's {W}, and it arrives once the
    // Expertise is paid for.
    const plains = game.debugSpawn("Plains", A, "battlefield");
    game.advanceUntil(settled);
    expect(offered?.casts.map((c) => [c.free, c.kicked === true])).toEqual([
      [true, false],
      [true, true],
    ]);
    // Kicked: the {W} was paid, and creatures can't attack this turn.
    expect(game.state.objects[plains].tapped).toBe(true);
    expect(game.state.objects[chant].zone).toBe("graveyard");
  });

  it("refuses a cast that pays the mana cost, or a card it didn't offer", () => {
    const { game, inHand, expertise } = setUpHand(["Divination", "Shivan Dragon"]);
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Island", A, "battlefield");
    expertise();
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    const paid: Cast = { type: "cast-spell", player: A, card: inHand("Divination"), targets: [], via: "effect" };
    expect(() => game.dispatch({ type: "cast-now", player: A, cast: paid })).toThrow();
    const dragon: Cast = { type: "cast-spell", player: A, card: inHand("Shivan Dragon"), targets: [], via: "effect", free: true };
    expect(() => game.dispatch({ type: "cast-now", player: A, cast: dragon })).toThrow();
    game.dispatch({ type: "cast-now", player: A, cast: { ...paid, free: true } });
    game.advanceUntil(settled);
    expect(game.state.objects[inHand("Shivan Dragon")].zone).toBe("hand");
  });

  it("shows the offer to its player only", () => {
    const { game, inHand, expertise } = setUpHand(["Divination"]);
    expertise();
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    const mine = viewFor(game.state, createDefaultRegistry(), A).awaiting;
    const theirs = viewFor(game.state, createDefaultRegistry(), B).awaiting;
    expect(mine?.kind === "cast-now" && mine.cards).toEqual([inHand("Divination")]);
    expect(theirs?.kind === "cast-now" && [theirs.cards.length, theirs.offers.length]).toEqual([0, 0]);
  });

  for (const [name, make] of [
    ["random", () => new RandomController(A, () => 0.99)],
    ["v1", () => new HeuristicBotController(A)],
    ["v2", () => new EvalBotController(A, undefined, {})],
  ] as const) {
    it(`is answered by the ${name} bot, which casts the dearest spell`, () => {
      // Opt comes first in hand, so casting the first offer would cast it.
      const { game, inHand, expertise } = setUpHand(["Opt", "Divination"], make());
      const divination = inHand("Divination");
      expertise();
      game.advanceUntil(settled);
      if (name !== "random") expect(game.state.objects[divination].zone).toBe("graveyard");
    });
  }
});
