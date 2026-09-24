/**
 * Choices an ability may make only once each turn.
 *
 * "You may [do something]. **Do this only once each turn.**" (Pantlaza,
 * Sun-Favored) is a `may` with `oncePerTurn`: the ability still triggers
 * every time, but once it has done it this turn it isn't offered again. A
 * turn it was declined doesn't count. "Choose one **that hasn't been chosen
 * this turn**" (Galadriel, Light of Valinor) is a `modal` with
 * `notChosenThisTurn`, which offers only the modes still unused.
 *
 * Both are counted per ability of one object, like `resolved-this-turn`: a
 * permanent that leaves and comes back is a new object (rule 400.7) and
 * starts again, and the count lapses as the next turn begins.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const onCreatureEnters = (name: string, text: string, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text,
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "creature" } },
        targets: [],
        effect,
        resolve: null,
        text,
      },
    ],
  });

/** "Whenever a creature you control enters, you may draw a card. Do this only
 * once each turn." */
const ONCE = "Test Once-a-Turn Draw";
/** As above, with "If you don't, you gain 1 life." */
const ONCE_ELSE = "Test Once-a-Turn Draw Or Life";
/** "Whenever a creature you control enters, choose one that hasn't been
 * chosen this turn — You gain 1 life; you gain 2 life; you gain 4 life." */
const UNCHOSEN = "Test Unchosen Modes";

const registry = createDefaultRegistry()
  .register(
    onCreatureEnters(ONCE, "Whenever a creature you control enters, you may draw a card. Do this only once each turn.", {
      kind: "may",
      prompt: "Draw a card?",
      effect: { kind: "draw", amount: 1 },
      oncePerTurn: true,
    }),
  )
  .register(
    onCreatureEnters(
      ONCE_ELSE,
      "Whenever a creature you control enters, you may draw a card. Do this only once each turn. If you don't, you gain 1 life.",
      {
        kind: "may",
        prompt: "Draw a card?",
        effect: { kind: "draw", amount: 1 },
        else: { kind: "gain-life", amount: 1 },
        oncePerTurn: true,
      },
    ),
  )
  .register(
    onCreatureEnters(
      UNCHOSEN,
      "Whenever a creature you control enters, choose one that hasn't been chosen this turn — You gain 1 life; or you gain 2 life; or you gain 4 life.",
      {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        notChosenThisTurn: true,
        modes: [
          { text: "You gain 1 life.", effect: { kind: "gain-life", amount: 1 } },
          { text: "You gain 2 life.", effect: { kind: "gain-life", amount: 2 } },
          { text: "You gain 4 life.", effect: { kind: "gain-life", amount: 4 } },
        ],
      },
    ),
  );

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
      { player: A, cards: Array<string>(60).fill("Island") },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const hand = (game: Game): number => game.handOf(A).length;
const life = (game: Game): number => game.state.players[A].life;
const enter = (game: Game): ObjectId => {
  const id = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
  game.advanceUntil(quiet);
  return id;
};
/** Every choose-modes decision `a` is asked, with how many modes it offered. */
const recordOffers = (a: ScriptedController, answer: (offered: number, asked: number) => number[]) => {
  const offers: number[] = [];
  a.chooseModesFn = (view) => {
    const awaiting = view.state.awaiting;
    const offered = awaiting?.kind === "choose-modes" ? awaiting.modes.length : 0;
    offers.push(offered);
    return answer(offered, offers.length);
  };
  return offers;
};
const nextTurnOf = (game: Game, player: PlayerId): void => {
  game.advanceUntil((s) => s.turn.step === "cleanup");
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.turn.activePlayerIndex === s.turnOrder.indexOf(player) && quiet(s),
  );
};

describe("'do this only once each turn'", () => {
  it("is offered until it has been done, then not again that turn", () => {
    const { game, a } = setUp();
    game.debugSpawn(ONCE, A, "battlefield");
    const offers = recordOffers(a, () => [0]);
    const before = hand(game);
    enter(game);
    enter(game);
    enter(game);
    expect(offers).toEqual([1]);
    expect(hand(game)).toBe(before + 1);
  });

  it("a turn it was declined doesn't count", () => {
    const { game, a } = setUp();
    game.debugSpawn(ONCE, A, "battlefield");
    const offers = recordOffers(a, (_offered, asked) => (asked === 1 ? [] : [0]));
    const before = hand(game);
    enter(game);
    enter(game);
    enter(game);
    expect(offers).toEqual([1, 1]);
    expect(hand(game)).toBe(before + 1);
  });

  it("its 'if you don't' applies once it can't be done", () => {
    const { game, a } = setUp();
    game.debugSpawn(ONCE_ELSE, A, "battlefield");
    recordOffers(a, () => [0]);
    enter(game);
    expect(life(game)).toBe(20);
    enter(game);
    expect(life(game)).toBe(21);
  });

  it("is offered again the next turn", () => {
    const { game, a } = setUp();
    game.debugSpawn(ONCE, A, "battlefield");
    const offers = recordOffers(a, () => [0]);
    enter(game);
    enter(game);
    nextTurnOf(game, B);
    nextTurnOf(game, A);
    enter(game);
    expect(offers).toEqual([1, 1]);
  });

  it("a permanent that leaves and comes back is a new object, and may do it again", () => {
    const { game, a } = setUp();
    const source = game.debugSpawn(ONCE, A, "battlefield");
    const offers = recordOffers(a, () => [0]);
    enter(game);
    game.debugApplyEffect(A, { kind: "flicker", target: "source" }, [], { source });
    game.advanceUntil(quiet);
    enter(game);
    expect(offers).toEqual([1, 1]);
  });

  it("counts each object's ability on its own", () => {
    const { game, a } = setUp();
    game.debugSpawn(ONCE, A, "battlefield");
    game.debugSpawn(ONCE, A, "battlefield");
    const offers = recordOffers(a, () => [0]);
    const before = hand(game);
    enter(game);
    enter(game);
    expect(offers).toEqual([1, 1]);
    expect(hand(game)).toBe(before + 2);
  });
});

describe("'choose one that hasn't been chosen this turn'", () => {
  it("offers only the modes still unused, then nothing", () => {
    const { game, a } = setUp();
    game.debugSpawn(UNCHOSEN, A, "battlefield");
    // Always take the first mode offered: 1 life, then 2, then 4.
    const offers = recordOffers(a, () => [0]);
    enter(game);
    expect(life(game)).toBe(21);
    enter(game);
    expect(life(game)).toBe(23);
    enter(game);
    expect(life(game)).toBe(27);
    enter(game);
    expect(life(game)).toBe(27);
    expect(offers).toEqual([3, 2, 1]);
  });

  it("logs the card's own mode, not its place among those offered", () => {
    const { game, a } = setUp();
    game.debugSpawn(UNCHOSEN, A, "battlefield");
    recordOffers(a, (_offered, asked) => (asked === 1 ? [1] : [1]));
    enter(game);
    enter(game);
    const chosen = game.state.eventLog
      .filter((e) => e.type === "modes-chosen")
      .map((e) => (e.type === "modes-chosen" ? e.modes : []));
    // First the 2-life mode (index 1); then, of the 1- and 4-life modes left,
    // the second offered — the card's third mode.
    expect(chosen).toEqual([[1], [2]]);
    expect(life(game)).toBe(26);
  });

  it("starts again the next turn", () => {
    const { game, a } = setUp();
    game.debugSpawn(UNCHOSEN, A, "battlefield");
    const offers = recordOffers(a, () => [0]);
    enter(game);
    enter(game);
    nextTurnOf(game, B);
    nextTurnOf(game, A);
    enter(game);
    expect(offers).toEqual([3, 2, 3]);
  });
});
