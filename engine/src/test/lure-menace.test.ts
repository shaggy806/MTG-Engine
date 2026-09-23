import { describe, expect, it } from "vitest";

import { blockingViolations, lurePlan, obeyingLure } from "../combat/blocking.js";
import type { BlockOffer } from "../combat/blocking.js";
import { HeuristicBotController, ScriptedController } from "../controller.js";
import type { ControllerView } from "../controller.js";
import type { RandomSource } from "../decisions/contract.js";
import { blockers as blockersDecision } from "../decisions/blockers.js";
import { Game } from "../game.js";
import { asObjectId, asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

/**
 * Lure (a requirement) meeting menace (a restriction) — rule 509.1c: a block
 * declaration obeys as many requirements as it can without breaking a
 * restriction. A Lured attacker with menace used to force nothing at all.
 */

const id = (s: string): ObjectId => asObjectId(s);
const [A, C, B] = [id("A"), id("C"), id("B")];
const [b1, b2, b3, f] = [id("b1"), id("b2"), id("b3"), id("f")];

const offer = (
  eligible: BlockOffer["eligible"],
  mustBlock: readonly ObjectId[],
  menaceAttackers: readonly ObjectId[],
): BlockOffer => ({ kind: "declare-blockers", eligible, mustBlock, menaceAttackers });

const block = (blocker: ObjectId, attacker: ObjectId) => ({ blocker, attacker });

describe("Lure with menace, against the offer", () => {
  it("a lone creature able to block isn't forced — it couldn't block alone", () => {
    const o = offer([{ blocker: b1, canBlock: [A] }], [A], [A]);
    expect(lurePlan(o).required).toBe(0);
    expect(blockingViolations([], o)).toEqual([]);
    expect(blockingViolations([block(b1, A)], o)).toEqual([{ kind: "menace", attacker: A }]);
  });

  it("two creatures able to block both have to", () => {
    const o = offer(
      [
        { blocker: b1, canBlock: [A] },
        { blocker: b2, canBlock: [A] },
      ],
      [A],
      [A],
    );
    expect(lurePlan(o).required).toBe(2);
    expect(blockingViolations([], o)).toEqual([
      { kind: "must-be-blocked", blocker: b1 },
      { kind: "must-be-blocked", blocker: b2 },
    ]);
    expect(blockingViolations([block(b1, A)], o)).toEqual([
      { kind: "menace", attacker: A },
      { kind: "must-be-blocked", blocker: b2 },
    ]);
    expect(blockingViolations([block(b1, A), block(b2, A)], o)).toEqual([]);
  });

  it("a token stack is enough on its own, as it is for menace", () => {
    const o = offer([{ blocker: b1, canBlock: [A], copies: 3 }], [A], [A]);
    expect(lurePlan(o).required).toBe(3);
    expect(blockingViolations([], o)).toEqual([{ kind: "must-be-blocked", blocker: b1 }]);
    expect(blockingViolations([block(b1, A)], o)).toEqual([]);
  });

  it("a creature that could obey elsewhere makes up the pair", () => {
    // f can block the plain Lured B or the Lured menace A; b1 only A. Both
    // on A obeys two requirements; f on B obeys only one.
    const o = offer(
      [
        { blocker: b1, canBlock: [A] },
        { blocker: f, canBlock: [A, B] },
      ],
      [A, B],
      [A],
    );
    expect(lurePlan(o).required).toBe(2);
    expect(blockingViolations([block(b1, A), block(f, A)], o)).toEqual([]);
    expect(blockingViolations([block(f, B)], o)).toEqual([{ kind: "must-be-blocked", blocker: b1 }]);
    expect(blockingViolations([block(b1, A), block(f, B)], o)).toEqual([
      { kind: "menace", attacker: A },
    ]);
  });

  // "Every creature able to block one" can't be obeyed here: b2 can only
  // make up one of the two pairs. Demanding it anyway would leave no legal
  // declaration at all.
  it("two menace attackers sharing a blocker force the most that can be obeyed", () => {
    const o = offer(
      [
        { blocker: b1, canBlock: [A] },
        { blocker: b2, canBlock: [A, C] },
        { blocker: b3, canBlock: [C] },
      ],
      [A, C],
      [A, C],
    );
    expect(lurePlan(o).required).toBe(2);
    expect(blockingViolations([block(b1, A), block(b2, A)], o)).toEqual([]);
    expect(blockingViolations([block(b2, C), block(b3, C)], o)).toEqual([]);
    expect(blockingViolations([], o).map((v) => v.kind)).toContain("must-be-blocked");
    expect(blockingViolations([block(b1, A), block(b2, A), block(b3, C)], o)).toEqual([
      { kind: "menace", attacker: C },
    ]);
  });

  it("without menace, every creature able to block a Lured attacker still has to", () => {
    const o = offer(
      [
        { blocker: b1, canBlock: [B] },
        { blocker: b2, canBlock: [A, B] },
      ],
      [B],
      [],
    );
    expect(lurePlan(o).required).toBe(2);
    expect(blockingViolations([block(b1, B)], o)).toEqual([{ kind: "must-be-blocked", blocker: b2 }]);
    expect(blockingViolations([block(b1, B), block(b2, B)], o)).toEqual([]);
  });

  it("obeyingLure makes any of those declarations legal, and leaves a legal one alone", () => {
    const offers = [
      offer([{ blocker: b1, canBlock: [A] }], [A], [A]),
      offer([{ blocker: b1, canBlock: [A] }, { blocker: b2, canBlock: [A] }], [A], [A]),
      offer([{ blocker: b1, canBlock: [A] }, { blocker: f, canBlock: [A, B] }], [A, B], [A]),
      offer(
        [
          { blocker: b1, canBlock: [A] },
          { blocker: b2, canBlock: [A, C] },
          { blocker: b3, canBlock: [C] },
        ],
        [A, C],
        [A, C],
      ),
    ];
    for (const o of offers) {
      for (const start of [[], [block(b1, A)], o.eligible.map((e) => block(e.blocker, e.canBlock[0]))]) {
        expect(blockingViolations(obeyingLure(start, o), o)).toEqual([]);
      }
    }
    const legal = [block(b2, C), block(b3, C)];
    expect(obeyingLure(legal, offers[3])).toEqual(legal);
  });
});

// ---------------------------------------------------------------------------
// Through a real game: Boggart Brute (3/2 menace) wearing Lure.

const P1 = asPlayerId("alice");
const P2 = asPlayerId("bob");

const pad = (): string[] => Array(40).fill("Forest");

function spawn(game: Game, cardName: string, controller: PlayerId): ObjectId {
  return game.debugSpawn(cardName, controller, "battlefield", { summoningSick: false });
}

function luredBrute(bobs: readonly string[], bobController?: HeuristicBotController) {
  const a = new ScriptedController(P1);
  const b = bobController ?? new ScriptedController(P2);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [P1]: a, [P2]: b },
    decks: [
      { player: P1, cards: pad() },
      { player: P2, cards: pad() },
    ],
  });
  const brute = spawn(game, "Boggart Brute", P1);
  const lure = spawn(game, "Lure", P1);
  game.state.objects[lure].attachedTo = brute;
  const blockers = bobs.map((name) => spawn(game, name, P2));
  a.declareAttackersFn = () => [{ attacker: brute, defender: P2 }];
  return { game, b, brute, blockers };
}

const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";

const viewOf = (game: Game, player: PlayerId): ControllerView => ({
  state: game.state,
  player,
  legalActions: () => game.legalActions(player),
});

describe("Lure with menace, in a game", () => {
  it("advertises a Lured menace attacker as one that must be blocked", () => {
    const { game, brute } = luredBrute(["Grizzly Bears"]);
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    const offerNow = game.legalActions(P2).find((x) => x.kind === "declare-blockers");
    expect(offerNow?.kind === "declare-blockers" ? offerNow.mustBlock : []).toEqual([brute]);
  });

  it("one creature able to block it: not blocking is legal", () => {
    const { game, b } = luredBrute(["Grizzly Bears"]);
    (b as ScriptedController).declareBlockersFn = () => [];
    game.advanceUntil(toPostcombat);
    expect(game.state.players[P2].life).toBe(17);
  });

  it("two creatures able to block it: both must", () => {
    const { game, b, brute, blockers: [x, y] } = luredBrute(["Grizzly Bears", "Grizzly Bears"]);
    const scripted = b as ScriptedController;
    scripted.declareBlockersFn = () => [{ blocker: x, attacker: brute }];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/menace/);
    scripted.declareBlockersFn = () => [];
    expect(() => game.advanceUntil(toPostcombat)).toThrow(/must block/);
    scripted.declareBlockersFn = () => [
      { blocker: x, attacker: brute },
      { blocker: y, attacker: brute },
    ];
    game.advanceUntil(toPostcombat);
    expect(game.state.objects[brute]?.zone ?? "gone").not.toBe("battlefield");
    expect(game.state.players[P2].life).toBe(20);
  });

  it("v1 and the fuzzer's random answer both declare legally", () => {
    const bot = new HeuristicBotController(P2);
    const { game } = luredBrute(["Grizzly Bears", "Grizzly Bears"], bot);
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    const offerNow = game.legalActions(P2).find((x) => x.kind === "declare-blockers");
    if (offerNow?.kind !== "declare-blockers") throw new Error("no block offer");

    expect(blockingViolations(bot.declareBlockers(viewOf(game, P2)), offerNow)).toEqual([]);
    let n = 0;
    const rng: RandomSource = {
      random: () => (n++ % 7) / 7,
      pickIndex: (length) => n++ % length,
      pickTargets: () => {
        throw new Error("a block declaration picks no targets");
      },
    };
    for (let i = 0; i < 20; i += 1) {
      const answer = blockersDecision.randomAnswer!(offerNow, P2, rng);
      if (answer.type !== "declare-blockers") throw new Error("not a block declaration");
      expect(blockingViolations(answer.blocks, offerNow)).toEqual([]);
    }
    game.advanceUntil(toPostcombat);
  });
});
