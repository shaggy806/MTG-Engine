/**
 * A creature that must attack if able — "attacks each combat if able", goad,
 * encore — is in the declaration, at a defender its controller chooses
 * (rule 508.1d). The engine used to add a left-out one itself, sent at the
 * first legal defender.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { attackingViolations, withRequiredAttackers } from "../combat/attacking.js";
import { ScriptedController } from "../controller.js";
import { autoAnswerFor, randomAnswerFor } from "../decisions/registry.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

type AttackOffer = Extract<LegalAction, { kind: "declare-attackers" }>;

/** A three-player game at Alice's attack declaration, with `creatures` hers. */
const atAttack = (creatures: readonly string[], players: readonly PlayerId[] = [A, B, C]) => {
  const a = new ScriptedController(A);
  const controllers: Record<PlayerId, ScriptedController> = {};
  for (const p of players) controllers[p] = p === A ? a : new ScriptedController(p);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const ids = creatures.map((name) => game.debugSpawn(name, A, "battlefield", { summoningSick: false }));
  game.dispatch({ type: "pass-priority", player: A });
  game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.priority.holder === A);
  if (game.state.awaiting?.kind !== "attackers") {
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
  }
  const offer = game.legalActions(A).find((o): o is AttackOffer => o.kind === "declare-attackers");
  if (offer === undefined) throw new Error("no attack declaration offered");
  return { game, a, ids, offer };
};

describe("a creature that must attack", () => {
  it("is named by the offer, and leaving it out is refused", () => {
    const { game, ids, offer } = atAttack(["Underworld Rage-Hound", "Grizzly Bears"]);
    const [hound, bears] = ids;
    expect(offer.mustAttack).toEqual([hound]);
    expect(() =>
      game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] }),
    ).toThrow(/Underworld Rage-Hound must attack if able/);
    expect(attackingViolations([], offer)).toEqual([{ kind: "must-attack", attacker: hound }]);
  });

  it("attacks whoever its controller chooses, not the first legal defender", () => {
    const { game, ids } = atAttack(["Underworld Rage-Hound"]);
    const [hound] = ids;
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: hound, defender: C }] });
    expect(game.state.objects[hound].attacking).toBe(C);
  });

  it("a scripted player who leaves it out has it sent at its first defender", () => {
    const { game, a, ids } = atAttack(["Underworld Rage-Hound"]);
    a.declareAttackersFn = () => [];
    const [hound] = ids;
    game.advanceUntil((s) => s.awaiting?.kind !== "attackers");
    expect(game.state.objects[hound].attacking).toBe(B);
  });

  it("one that can't attack isn't required", () => {
    const { offer, ids, game } = atAttack(["Underworld Rage-Hound"]);
    expect(offer.mustAttack).toContain(ids[0]);
    const sick = game.debugSpawn("Underworld Rage-Hound", A, "battlefield");
    const again = game.legalActions(A).find((o): o is AttackOffer => o.kind === "declare-attackers");
    expect(again?.mustAttack).not.toContain(sick);
  });
});

describe("an encore copy", () => {
  it("may attack only the opponent it was made for, while it can", () => {
    const { game, ids, offer } = atAttack(["Grizzly Bears"]);
    const [bears] = ids;
    game.state.objects[bears].mustAttackPlayer = C;
    const fresh = game.legalActions(A).find((o): o is AttackOffer => o.kind === "declare-attackers");
    expect(fresh?.defendersFor[bears]).toEqual([C]);
    expect(fresh?.mustAttack).toContain(bears);
    expect(offer).toBeDefined();
    expect(() =>
      game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] }),
    ).toThrow(/must attack the opponent/);
  });
});

describe("drivers that don't choose", () => {
  it("a seat skipping its windows answers only when each forced attacker has one defender", () => {
    const three = atAttack(["Underworld Rage-Hound"]);
    const awaiting = three.game.state.awaiting;
    if (awaiting === null) throw new Error("no decision");
    // Two opponents to choose from: the seat is asked.
    expect(autoAnswerFor(awaiting, A, three.game.legalActions(A))).toBeNull();

    const two = atAttack(["Underworld Rage-Hound"], [A, B]);
    const [hound] = two.ids;
    const waiting = two.game.state.awaiting;
    if (waiting === null) throw new Error("no decision");
    expect(autoAnswerFor(waiting, A, two.game.legalActions(A))).toEqual({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: hound, defender: B }],
    });

    const none = atAttack(["Grizzly Bears"]);
    const idle = none.game.state.awaiting;
    if (idle === null) throw new Error("no decision");
    expect(autoAnswerFor(idle, A, none.game.legalActions(A))).toEqual({
      type: "declare-attackers",
      player: A,
      attackers: [],
    });
  });

  it("the fuzzer always declares it", () => {
    const { ids, offer } = atAttack(["Underworld Rage-Hound", "Grizzly Bears"]);
    const [hound] = ids;
    let seed = 0;
    // Every coin flip says "stay home".
    const rng = {
      random: () => 0.99,
      pickIndex: (n: number) => seed++ % n,
      pickTargets: () => [],
    };
    for (let i = 0; i < 5; i += 1) {
      const action = randomAnswerFor(offer, A, rng);
      expect(action?.type === "declare-attackers" && action.attackers.map((d) => d.attacker)).toEqual([hound]);
    }
  });

  it("withRequiredAttackers keeps a choice already made", () => {
    const { ids, offer } = atAttack(["Underworld Rage-Hound", "Grizzly Bears"]);
    const [hound, bears] = ids;
    expect(withRequiredAttackers([{ attacker: hound, defender: C }], offer)).toEqual([
      { attacker: hound, defender: C },
    ]);
    expect(withRequiredAttackers([{ attacker: bears, defender: C }], offer)).toEqual([
      { attacker: bears, defender: C },
      { attacker: hound, defender: B },
    ]);
  });
});

