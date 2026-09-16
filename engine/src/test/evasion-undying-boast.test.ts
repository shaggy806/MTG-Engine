/**
 * Three more of phase D's named mechanics:
 *
 * - **Fear / Intimidate** (rules 702.36 / 702.13), evasion checked in
 *   `whyCannotBlock`.
 * - **Undying** (702.92), whose "if it had no +1/+1 counters on it" can only
 *   be answered from last-known information — the card is already in a
 *   graveyard by the time the trigger is checked, and `moveObject` clears
 *   counters on every zone change.
 * - **Boast** (702.135), which is "attacked this turn" *and* "only once each
 *   turn" together.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Mountain") },
      { player: B, cards: Array<string>(40).fill("Mountain") },
    ],
  });

/** Attack with `attacker`, then report which of B's creatures may block it. */
const blockersFor = (game: Game, attacker: ObjectId): ObjectId[] => {
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
  game.dispatch({
    type: "declare-attackers",
    player: A,
    attackers: [{ attacker, defender: B }],
  });
  game.advanceUntil((s) => s.awaiting?.kind === "blockers" || s.result.over);
  const legal = game
    .legalActions(B)
    .find((a) => a.kind === "declare-blockers");
  if (legal === undefined || legal.kind !== "declare-blockers") return [];
  return legal.eligible.filter((e) => e.canBlock.includes(attacker)).map((e) => e.blocker);
};

describe("intimidate", () => {
  const setup = (blocker: string) => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    // Vela is blue-black and has intimidate.
    const vela = game.debugSpawn("Vela the Night-Clad", A, "battlefield");
    game.state.objects[vela].summoningSick = false;
    const blockerId = game.debugSpawn(blocker, B, "battlefield");
    return { game, vela, blockerId };
  };

  it("lets a colour-sharing creature block", () => {
    // Vampire Nighthawk is black, and Vela is blue-black.
    const { game, vela, blockerId } = setup("Vampire Nighthawk");
    expect(blockersFor(game, vela)).toContain(blockerId);
  });

  it("stops a creature sharing no colour", () => {
    const { game, vela, blockerId } = setup("Grizzly Bears");
    expect(blockersFor(game, vela)).not.toContain(blockerId);
  });

  it("lets an artifact creature block whatever its colour", () => {
    const { game, vela, blockerId } = setup("Darksteel Myr");
    expect(blockersFor(game, vela)).toContain(blockerId);
  });

  it("is granted to your other creatures too", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugSpawn("Vela the Night-Clad", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.state.objects[bear].summoningSick = false;
    expect(game.characteristics(bear).keywords.has("intimidate")).toBe(true);

    // A red blocker shares no colour with the green Bears and isn't an
    // artifact, so the granted intimidate stops it.
    const blockerId = game.debugSpawn("Raging Goblin", B, "battlefield");
    expect(blockersFor(game, bear)).not.toContain(blockerId);
  });
});

describe("undying", () => {
  /**
   * Drain the pending trigger queue.
   *
   * `advanceUntil` checks its predicate *before* ticking, so waiting on
   * "the stack is empty" returns immediately — the undying trigger is
   * queued in `pendingTriggers` and hasn't reached the stack yet. Wait for
   * the queue instead.
   */
  const settleTriggers = (game: Game) =>
    game.advanceUntil(
      (s) =>
        s.pendingTriggers.length === 0 &&
        s.zones.shared.stack.length === 0 &&
        s.priority.holder !== null,
    );

  it("returns with a +1/+1 counter the first time it dies", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const crusher = game.debugSpawn("Geralf's Mindcrusher", A, "battlefield");

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: crusher },
    ]);
    settleTriggers(game);

    expect(game.state.objects[crusher].zone).toBe("battlefield");
    expect(game.state.objects[crusher].counters["+1/+1"]).toBe(1);
  });

  it("stays dead the second time, because it now has a counter", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    const crusher = game.debugSpawn("Geralf's Mindcrusher", A, "battlefield");
    game.state.objects[crusher].counters["+1/+1"] = 1;

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: crusher },
    ]);
    settleTriggers(game);

    expect(game.state.objects[crusher].zone).toBe("graveyard");
  });
});

describe("boast", () => {
  const readyMana = (game: Game, n: number) => {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn("Mountain", A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  };

  const boastAction = (game: Game) =>
    game
      .legalActions(A)
      .find((a) => a.kind === "activate-ability" && a.cardName === "Dragonkin Berserker");

  it("is not offered before the creature has attacked", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyMana(game, 8);
    const berserker = game.debugSpawn("Dragonkin Berserker", A, "battlefield");
    game.state.objects[berserker].summoningSick = false;
    expect(boastAction(game)).toBeUndefined();
  });

  it("becomes available once it attacks, and only once", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    readyMana(game, 20);
    const berserker = game.debugSpawn("Dragonkin Berserker", A, "battlefield");
    game.state.objects[berserker].summoningSick = false;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: berserker, defender: B }],
    });
    game.advanceUntil((s) => s.priority.holder === A || s.result.over);

    const legal = boastAction(game);
    expect(legal).toBeDefined();
    if (legal === undefined || legal.kind !== "activate-ability") return;

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: legal.source,
      abilityIndex: legal.abilityIndex,
      targets: [],
    });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    const dragons = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Dragon Token",
    );
    expect(dragons.length).toBe(1);
    // Once each turn (702.135).
    expect(boastAction(game)).toBeUndefined();
  });
});
