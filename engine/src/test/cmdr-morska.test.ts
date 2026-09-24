import { describe, expect, it } from "vitest";

import { investigate } from "../cards/helpers.js";
import { HeuristicBotController, RandomController, ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Morska, Undersea Sleuth — {G}{W}{U} Legendary Creature — Vedalken Fish
// Detective 2/3
//   You have no maximum hand size.
//   At the beginning of your upkeep, investigate.
//   Whenever you draw your second card each turn, put two +1/+1 counters on
//   Morska.
// …and the Clue token investigate makes: "{2}, Sacrifice this token: Draw a
// card."

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(60).fill("Island") },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const clues = (game: Game, player: PlayerId = A): ObjectId[] =>
  game.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Clue Token" && game.state.objects[id].controller === player,
  );
const draw = (game: Game, player: PlayerId, amount: number): void => {
  game.debugApplyEffect(player, { kind: "draw", amount });
  game.advanceUntil(quiet);
};
const plusOnes = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;
const clueAbility = (game: Game, clue: ObjectId) =>
  game
    .legalActions(A)
    .find((l) => l.kind === "activate-ability" && l.source === clue);

describe("Clue token (investigate)", () => {
  it("investigate makes one untapped Clue artifact per time", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, investigate(2));
    game.advanceUntil(quiet);
    const made = clues(game);
    expect(made).toHaveLength(2);
    for (const id of made) {
      const o = game.state.objects[id];
      expect(o.isToken).toBe(true);
      expect(o.tapped).toBe(false);
      expect(game.characteristics(id).types).toEqual(["artifact"]);
      expect(game.characteristics(id).subtypes).toEqual(["Clue"]);
    }
  });

  it("is never folded into a token stack, however many are made at once", () => {
    const { game } = setUp();
    // Past STACK_ORIGIN_THRESHOLD (8): a stackable token would become one
    // object here. A Clue has an activated ability, so each is its own.
    game.debugApplyEffect(A, investigate(12));
    game.advanceUntil(quiet);
    const made = clues(game);
    expect(made).toHaveLength(12);
    expect(made.every((id) => (game.state.objects[id].stackCount ?? 1) === 1)).toBe(true);
  });

  it("{2}, sacrifice: draws a card — no tap, so a fresh one can be cracked", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, investigate());
    game.advanceUntil(quiet);
    const [clue] = clues(game);
    expect(clueAbility(game, clue)).toBeUndefined(); // no mana yet
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    expect(clueAbility(game, clue)).toBeDefined();

    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: clue, abilityIndex: 0, targets: [] });
    // The sacrifice is a cost: the Clue is gone before the draw resolves.
    expect(game.battlefield).not.toContain(clue);
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(clues(game)).toHaveLength(0);
  });

  it("the v1 bot and the fuzzer both reach the Clue's ability", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, investigate());
    game.advanceUntil(quiet);
    const [clue] = clues(game);
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    // Nothing else to do: the land drop is used and the hand is all Islands.
    game.state.players[A].landsPlayedThisTurn = game.state.rules.maxLandsPerTurn;
    const view = { state: game.state, player: A, legalActions: () => game.legalActions(A) };

    const botPick = new HeuristicBotController(A).act(view);
    expect(botPick).toMatchObject({ type: "activate-ability", source: clue });

    // RandomController picks uniformly from legalActions; a draw landing on
    // the Clue's entry must build a dispatchable action.
    const options = game.legalActions(A);
    const index = options.findIndex((l) => l.kind === "activate-ability" && l.source === clue);
    expect(index).toBeGreaterThanOrEqual(0);
    const fuzz = new RandomController(A, () => (index + 0.5) / options.length).act(view);
    expect(fuzz).toMatchObject({ type: "activate-ability", source: clue });
    expect(game.canDispatch(fuzz)).toBeNull();
  });
});

describe("Morska, Undersea Sleuth", () => {
  it("investigates at the beginning of your upkeep, not an opponent's", () => {
    const { game } = setUp();
    game.debugSpawn("Morska, Undersea Sleuth", A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(clues(game)).toHaveLength(0); // Bob's upkeep
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw" && quiet(s));
    expect(clues(game)).toHaveLength(1);
  });

  it("gets two +1/+1 counters on your second card each turn, and only that one", () => {
    const { game } = setUp();
    // Alice drew her first card this turn in her draw step, before Morska
    // was here; it still counts (the count is the player's).
    const morska = game.debugSpawn("Morska, Undersea Sleuth", A, "battlefield");
    draw(game, A, 1); // second card
    expect(plusOnes(game, morska)).toBe(2);
    expect(game.characteristics(morska).power).toBe(4);
    expect(game.characteristics(morska).toughness).toBe(5);
    draw(game, A, 1); // third
    expect(plusOnes(game, morska)).toBe(2);
  });

  it("counts on an opponent's turn too, and ignores the opponent's draws", () => {
    const { game } = setUp();
    const morska = game.debugSpawn("Morska, Undersea Sleuth", A, "battlefield");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    draw(game, B, 2); // Bob's second and third
    expect(plusOnes(game, morska)).toBe(0);
    draw(game, A, 2); // Alice's first and second this turn — one effect
    expect(plusOnes(game, morska)).toBe(2);
  });

  it("cracking a Clue can be the second draw", () => {
    const { game } = setUp();
    const morska = game.debugSpawn("Morska, Undersea Sleuth", A, "battlefield");
    game.debugApplyEffect(A, investigate());
    game.advanceUntil(quiet);
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    const [clue] = clues(game);
    game.dispatch({ type: "activate-ability", player: A, source: clue, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(plusOnes(game, morska)).toBe(2);
  });

  it("you have no maximum hand size", () => {
    const { game } = setUp();
    game.debugSpawn("Morska, Undersea Sleuth", A, "battlefield");
    draw(game, A, 6);
    const hand = game.handOf(A).length;
    expect(hand).toBeGreaterThan(game.state.rules.maxHandSize);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.handOf(A).length).toBe(hand);
  });
});
