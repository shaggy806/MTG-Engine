/**
 * Counters a player has (rule 122.1), apart from energy: poison and
 * experience, on `PlayerState.counters`.
 *
 * Poison: ten or more and that player loses (rule 704.5c, a state-based
 * action); "corrupted" reads an opponent's count. Experience: "you get an
 * experience counter", then "for each experience counter you have" as an
 * amount, a P/T bonus, a characteristic-defining count and a cost reduction.
 * Proliferate reaches every player with a counter of any kind, giving each
 * one more of each kind they have.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState, PlayerCounterKind } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Whenever a creature you control with deathtouch deals combat damage to a
 * player, that player gets two poison counters." (Fynn, the Fangbearer's.) */
const FANGS = "Test Fangs";
/** "This creature gets +1/+1 for each experience counter you have." */
const VETERAN = "Test Veteran";
/** "This creature's power and toughness are each equal to the number of
 * experience counters you have." */
const SPIRIT = "Test Experience Spirit";
/** "This spell costs {1} less to cast for each experience counter you have.
 * Draw a card." */
const LESSON = "Test Lesson";
/** "As long as an opponent has three or more poison counters, this creature
 * has flying." (corrupted) */
const CORRUPTED = "Test Corrupted Flier";
/** "Draw a card for each experience counter you have." */
const STUDY = "Test Study";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: FANGS,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Whenever a creature you control with deathtouch deals combat damage to a player, that player gets two poison counters.",
      triggered: [
        {
          trigger: {
            on: "deals-combat-damage-to-player",
            who: "you-control",
            filter: { keyword: "deathtouch" },
          },
          targets: [],
          effect: { kind: "add-player-counters", counter: "poison", amount: 2, who: "trigger-player" },
          resolve: null,
          text: "Whenever a creature you control with deathtouch deals combat damage to a player, that player gets two poison counters.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: VETERAN,
      manaCost: "{0}",
      types: ["creature"],
      power: 1,
      toughness: 1,
      text: "This creature gets +1/+1 for each experience counter you have.",
      static: [
        {
          affects: { scope: "self" },
          grantPtPerCount: { playerCounters: "experience", pt: [1, 1] },
          text: "This creature gets +1/+1 for each experience counter you have.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: SPIRIT,
      manaCost: "{0}",
      types: ["creature"],
      power: 0,
      toughness: 0,
      text: "This creature's power and toughness are each equal to the number of experience counters you have.",
      static: [
        {
          affects: { scope: "self" },
          setBasePtFromCount: { countOf: { playerCounters: "experience" }, plusPower: 0, plusToughness: 0 },
          text: "This creature's power and toughness are each equal to the number of experience counters you have.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: LESSON,
      manaCost: "{3}{U}",
      types: ["sorcery"],
      text: "This spell costs {1} less to cast for each experience counter you have. Draw a card.",
      selfCostReduction: {
        condition: { kind: "opponent-count", atLeast: 1 },
        reduceGeneric: { playerCounters: "experience" },
      },
      effect: { kind: "draw", amount: 1 },
    }),
  )
  .register(
    defineCard({
      name: CORRUPTED,
      manaCost: "{0}",
      types: ["creature"],
      power: 2,
      toughness: 2,
      text: "As long as an opponent has three or more poison counters, this creature has flying.",
      static: [
        {
          affects: { scope: "self" },
          condition: { kind: "player-counters", counter: "poison", who: "opponent", atLeast: 3 },
          grantKeywords: ["flying"],
          text: "As long as an opponent has three or more poison counters, this creature has flying.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: STUDY,
      manaCost: "{0}",
      types: ["sorcery"],
      text: "Draw a card for each experience counter you have.",
      effect: { kind: "draw", amount: { playerCounters: "experience" } },
    }),
  );

const setUp = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const give = (game: Game, player: PlayerId, counter: PlayerCounterKind, amount: number): void => {
  game.debugApplyEffect(A, { kind: "add-player-counters", counter, amount, who: player === A ? "you" : "each-opponent" });
  game.advanceUntil(quiet);
};
const countersOf = (game: Game, player: PlayerId, counter: PlayerCounterKind): number =>
  game.state.players[player].counters[counter] ?? 0;

describe("poison counters", () => {
  it("a deathtouch creature's combat damage gives that player two (a trigger-player scope)", () => {
    const { game, a } = setUp();
    game.debugSpawn(FANGS, A, "battlefield");
    const rats = game.debugSpawn("Typhoid Rats", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: rats, defender: B }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(countersOf(game, B, "poison")).toBe(2);
    expect(countersOf(game, A, "poison")).toBe(0);
    const event = game.state.eventLog.find((e) => e.type === "player-counters-changed");
    expect(event).toMatchObject({ player: B, counter: "poison", delta: 2, total: 2 });
  });

  it("ten or more lose the game (rule 704.5c); nine don't", () => {
    const { game } = setUp();
    // `debugApplyEffect` performs no state-based actions of its own; moving
    // on to the next step is a check.
    const nextStep = (): void =>
      game.advanceUntil((s) => s.turn.step !== "precombat-main" || s.result.over);
    give(game, B, "poison", 9);
    nextStep();
    expect(game.state.players[B].hasLost).toBe(false);
    give(game, B, "poison", 1);
    game.advanceUntil((s) => s.result.over);
    expect(game.state.players[B].hasLost).toBe(true);
    expect(game.state.players[B].lossReason).toContain("poison");
    expect(game.state.result).toMatchObject({ over: true, winner: A });
  });

  it("corrupted: a static that checks for an opponent with three or more", () => {
    const { game } = setUp();
    const flier = game.debugSpawn(CORRUPTED, A, "battlefield");
    give(game, B, "poison", 2);
    expect(game.characteristics(flier).keywords.has("flying")).toBe(false);
    give(game, B, "poison", 1);
    expect(game.characteristics(flier).keywords.has("flying")).toBe(true);
  });

  it("your own poison doesn't make you corrupted", () => {
    const { game } = setUp();
    const flier = game.debugSpawn(CORRUPTED, A, "battlefield");
    give(game, A, "poison", 5);
    expect(game.characteristics(flier).keywords.has("flying")).toBe(false);
  });

  it("is public: every seat's view shows it", () => {
    const { game } = setUp();
    give(game, B, "poison", 3);
    expect(game.viewFor(A).players[B].counters.poison).toBe(3);
    expect(game.viewFor(B).players[B].counters.poison).toBe(3);
    expect(game.viewFor(A).players[A].counters).toEqual({});
  });
});

describe("experience counters", () => {
  it("'for each experience counter you have' as an amount", () => {
    const { game } = setUp([STUDY]);
    give(game, A, "experience", 3);
    const hand = game.handOf(A).length;
    const study = game.handOf(A).find((id) => game.state.objects[id].cardName === STUDY);
    game.dispatch({ type: "cast-spell", player: A, card: study!, targets: [] });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand - 1 + 3);
  });

  it("a +1/+1 bonus per experience counter, read live", () => {
    const { game } = setUp();
    const veteran = game.debugSpawn(VETERAN, A, "battlefield");
    expect(game.characteristics(veteran).power).toBe(1);
    give(game, A, "experience", 2);
    expect(game.characteristics(veteran).power).toBe(3);
    expect(game.characteristics(veteran).toughness).toBe(3);
    // An opponent's experience isn't "yours".
    give(game, B, "experience", 4);
    expect(game.characteristics(veteran).power).toBe(3);
  });

  it("a characteristic-defining count of them", () => {
    const { game } = setUp();
    give(game, A, "experience", 4);
    const spirit = game.debugSpawn(SPIRIT, A, "battlefield");
    expect(game.characteristics(spirit).power).toBe(4);
    expect(game.characteristics(spirit).toughness).toBe(4);
  });

  it("a cost reduction per experience counter", () => {
    const { game } = setUp([LESSON]);
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    const lesson = game.handOf(A).find((id) => game.state.objects[id].cardName === LESSON)!;
    const castable = (): boolean =>
      game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === lesson);
    // {3}{U} off two Islands: only with {2} off.
    give(game, A, "experience", 1);
    expect(castable()).toBe(false);
    give(game, A, "experience", 1);
    expect(castable()).toBe(true);
  });
});

describe("proliferate reaches players", () => {
  it("offers every player with a counter, and gives each one more of each kind", () => {
    const { game, a } = setUp();
    give(game, A, "experience", 1);
    give(game, B, "poison", 2);
    let offered: readonly string[] = [];
    a.chooseProliferateFn = (_view, eligible) => {
      offered = eligible.map((t) => (t.kind === "player" ? t.player : t.object));
      return eligible;
    };
    game.debugApplyEffect(A, { kind: "proliferate" } as EffectSpec);
    game.advanceUntil(quiet);
    expect(offered).toEqual([A, B]);
    expect(countersOf(game, A, "experience")).toBe(2);
    expect(countersOf(game, B, "poison")).toBe(3);
  });

  it("the default answer grows your experience and an opponent's poison, not your own poison", () => {
    const { game } = setUp();
    give(game, A, "experience", 1);
    give(game, B, "poison", 2);
    game.debugApplyEffect(A, { kind: "proliferate" } as EffectSpec);
    game.advanceUntil(quiet);
    expect(countersOf(game, A, "experience")).toBe(2);
    expect(countersOf(game, B, "poison")).toBe(3);

    const poisoned = setUp().game;
    give(poisoned, A, "poison", 1);
    give(poisoned, A, "experience", 1);
    poisoned.debugApplyEffect(A, { kind: "proliferate" } as EffectSpec);
    poisoned.advanceUntil(quiet);
    expect(countersOf(poisoned, A, "poison")).toBe(1);
  });
});
