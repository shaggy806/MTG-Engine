/**
 * Proliferate (rule 701.27) as the choice it is printed as.
 *
 * The engine used to add a counter to *every* permanent on the battlefield.
 * That is not a weaker proliferate, it is a different and often worse one:
 * Atraxa grew the opponents' creatures and refilled their planeswalkers every
 * end step, with no way to decline. The card says "choose **any number** of
 * permanents and/or players with counters on them", so the choice *is* the
 * card, and choosing none is a legal answer.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import type { GameConfig } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const mkGame = (aCards: readonly string[], overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

const spawn = (
  game: Game,
  cardName: string,
  controller: PlayerId,
  counters: Record<string, number> = {},
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner: controller,
    controller,
    zone: "battlefield",
    tapped: false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false, loyaltyActivatedThisTurn: false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    timestamp: 0,
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    controlEndsAtCleanup: false,
    copyOf: null,
    counters: { ...counters },
    modifiers: [],
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const giveLands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, A);
};

const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });

/** Settle up to the pending proliferate decision, and return it. */
const awaitProliferate = (game: Game) => {
  game.advanceUntil((s) => s.awaiting !== null || settled(s));
  const awaiting = game.state.awaiting;
  if (awaiting === null || awaiting.kind !== "proliferate") {
    throw new Error(`expected a proliferate decision, got ${awaiting?.kind ?? "none"}`);
  }
  return awaiting;
};

const answer = (game: Game, chosen: readonly TargetRef[]): void => {
  game.dispatch({ type: "proliferate", player: A, chosen });
  game.advanceUntil(settled);
};

describe("proliferate", () => {
  it("adds one of each existing counter kind to each permanent chosen", () => {
    const game = mkGame(["Contentious Plan"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Island", 2);
    const buffed = spawn(game, "Walking Ballista", A, { "+1/+1": 2 });
    const shrunk = spawn(game, "Rumbling Baloth", B, { "-1/-1": 1 }); // 4/4 → survives
    const plain = spawn(game, "Grizzly Bears", A); // no counters — not offered

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Contentious Plan"),
    });
    const awaiting = awaitProliferate(game);
    // Only the two with counters are eligible; the bear was never a candidate.
    expect(awaiting.eligible).toHaveLength(2);

    // Taking both is legal and sometimes right — a -1/-1 counter on an
    // opponent's creature is one you *want* to grow. The point is that it's
    // chosen rather than done to you.
    answer(game, [obj(buffed), obj(shrunk)]);

    expect(game.state.objects[buffed].counters["+1/+1"]).toBe(3);
    expect(game.state.objects[shrunk].counters["-1/-1"]).toBe(2);
    expect(game.state.objects[plain].counters).toEqual({});
  });

  it("leaves an opponent's permanent alone when it isn't chosen", () => {
    // The old behaviour in one line: this used to be impossible to express.
    const game = mkGame(["Contentious Plan"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Island", 2);
    const mine = spawn(game, "Walking Ballista", A, { "+1/+1": 1 });
    const theirs = spawn(game, "Rumbling Baloth", B, { "+1/+1": 1 });

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Contentious Plan"),
    });
    awaitProliferate(game);
    answer(game, [obj(mine)]);

    expect(game.state.objects[mine].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[theirs].counters["+1/+1"]).toBe(1);
  });

  it("accepts choosing nothing, and rejects something with no counters", () => {
    const game = mkGame(["Contentious Plan"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Island", 2);
    const mine = spawn(game, "Walking Ballista", A, { "+1/+1": 1 });
    const bare = spawn(game, "Grizzly Bears", A);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Contentious Plan"),
    });
    awaitProliferate(game);

    expect(
      game.canDispatch({ type: "proliferate", player: A, chosen: [obj(bare)] }),
    ).not.toBeNull();
    answer(game, []);
    expect(game.state.objects[mine].counters["+1/+1"]).toBe(1);
  });

  it("does the rest of the card after the choice, not before it", () => {
    // Contentious Plan is "Proliferate. Draw a card." The draw is
    // proliferate's `then` rather than the second step of a `sequence`,
    // because a sequence runs synchronously — the card would have drawn while
    // the decision was still pending.
    const game = mkGame(["Contentious Plan"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Island", 2);
    const mine = spawn(game, "Walking Ballista", A, { "+1/+1": 1 });

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Contentious Plan"),
    });
    awaitProliferate(game);
    const before = game.handOf(A).length;
    answer(game, [obj(mine)]);

    expect(game.handOf(A).length).toBe(before + 1);
    expect(game.state.objects[mine].counters["+1/+1"]).toBe(2);
  });

  it("skips the decision entirely when nothing has a counter", () => {
    const game = mkGame(["Contentious Plan"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Island", 2);
    const before = game.handOf(A).length;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Contentious Plan"),
    });
    game.advanceUntil(settled);

    // No choice worth asking about — and the `then` still happened. (The cast
    // itself took one card out of hand, so the net is zero.)
    expect(game.state.awaiting).toBeNull();
    expect(game.handOf(A).length).toBe(before);
  });

  it("Volt Charge deals damage and then proliferates", () => {
    const game = mkGame(["Mountain", "Mountain", "Mountain", "Volt Charge"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, "Mountain", 3);
    const sentinel = spawn(game, "Walking Ballista", A, { "+1/+1": 1 });
    const bear = spawn(game, "Grizzly Bears", B); // 2/2, no counters

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Volt Charge"),
      targets: [{ kind: "object", object: bear }],
    });
    awaitProliferate(game);
    answer(game, [obj(sentinel)]);

    expect(game.state.objects[bear].zone).toBe("graveyard"); // 3 damage killed it
    expect(game.state.objects[sentinel].counters["+1/+1"]).toBe(2); // proliferated
  });
});
