import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import type { EffectSpec, EnterAttacking } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { EnterAttackingChoice, GameState } from "../state.js";

// Rule 508.4: a creature put onto the battlefield attacking attacks what its
// controller chooses — a defending player or a planeswalker one controls —
// unless the effect names it. It never "attacked" (508.3a), and only a
// creature under the attacking player's control, during combat, attacks at
// all (506.3a-c).

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const mkGame = (players: readonly PlayerId[]) => {
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  return { game, c: controllers as Record<PlayerId, ScriptedController> };
};

/** Soldier tokens, tapped and attacking as `attacking` says. */
const soldiers = (count: number, attacking: EnterAttacking): EffectSpec => ({
  kind: "create-token",
  token: "Soldier Token",
  count,
  tapped: true,
  attacking,
});

/** Alice's turn 1, in her declare-attackers step with priority, having
 * attacked bob with a Grizzly Bears. */
const inCombat = (players: readonly PlayerId[]) => {
  const { game, c } = mkGame(players);
  const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
  c[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting === null && s.priority.holder === A);
  return { game, c, bears };
};

const soldierIds = (game: Game): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === "Soldier Token");
const quiet = (s: GameState): boolean => s.awaiting === null && s.zones.shared.stack.length === 0;

describe("put onto the battlefield attacking (rule 508.4)", () => {
  it("attacks the only defender there is, tapped, and was never declared", () => {
    const { game } = inCombat([A, B]);
    const before = game.events.length;
    game.debugApplyEffect(A, soldiers(2, "choose"));
    const events = game.events.slice(before);
    const ids = soldierIds(game);
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect(game.state.objects[id].attacking).toBe(B);
      expect(game.state.objects[id].tapped).toBe(true);
      // Rule 508.3a: it never attacked.
      expect(game.state.objects[id].attackedThisTurn).toBeFalsy();
    }
    expect(events.filter((e) => e.type === "attacker-declared")).toHaveLength(0);
    expect(events.filter((e) => e.type === "entered-attacking")).toHaveLength(2);

    const life = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(life - 2 - 2); // the Bears and two Soldiers
  });

  it("outside combat, the tokens just enter (rule 506.3b: no attacking player)", () => {
    const { game } = mkGame([A, B]);
    game.advanceUntil((s) => s.turn.step === "precombat-main");
    game.debugApplyEffect(A, soldiers(1, "choose"));
    expect(game.state.objects[soldierIds(game)[0]].attacking).toBeNull();
  });

  it("under a player other than the attacking player, they aren't attacking", () => {
    const { game } = inCombat([A, B]);
    game.debugApplyEffect(A, { ...soldiers(1, "choose"), who: "each-opponent" } as EffectSpec);
    const [token] = soldierIds(game);
    expect(game.state.objects[token].controller).toBe(B);
    expect(game.state.objects[token].attacking).toBeNull();
  });

  it("asks its controller what each attacks when there's a choice, and re-points them", () => {
    const { game, c } = inCombat([A, B, C, D]);
    let asked: readonly EnterAttackingChoice[] = [];
    c[A].chooseAttackTargetsFn = (_view, creatures) => {
      asked = creatures;
      return creatures.map((cr, i) => ({ object: cr.object, target: i === 0 ? C : D }));
    };
    game.debugApplyEffect(A, soldiers(2, "choose"));
    expect(game.state.awaiting?.kind).toBe("enter-attacking");
    game.advanceUntil(quiet);
    expect(asked).toHaveLength(2);
    expect(asked[0].options).toEqual([B, C, D]);
    const [first, second] = soldierIds(game);
    expect(game.state.objects[first].attacking).toBe(C);
    expect(game.state.objects[second].attacking).toBe(D);
  });

  it("refuses an answer that leaves a creature out or picks something not offered", () => {
    const { game, c } = inCombat([A, B, C]);
    c[A].chooseAttackTargetsFn = () => [];
    game.debugApplyEffect(A, soldiers(1, "choose"));
    expect(() => game.advanceUntil(quiet)).toThrow(/choose what/);
  });

  it("\"attacking that player\" — one token per opponent, each at its own, with no question", () => {
    const { game, c } = inCombat([A, B, C, D]);
    c[A].chooseAttackTargetsFn = () => {
      throw new Error("nothing to choose");
    };
    game.debugApplyEffect(A, {
      kind: "for-each-player",
      who: "each-opponent",
      effect: soldiers(1, { player: "that-player" }),
    } as EffectSpec);
    game.advanceUntil(quiet);
    const targets = soldierIds(game).map((id) => game.state.objects[id].attacking);
    expect(targets.sort()).toEqual([B, C, D].sort());
  });

  it("\"that player or a planeswalker they control\" offers just those", () => {
    const { game, c } = inCombat([A, B, C]);
    const walker = game.debugSpawn("Garruk Wildspeaker", C, "battlefield");
    let asked: readonly EnterAttackingChoice[] = [];
    c[A].chooseAttackTargetsFn = (_view, creatures) => {
      asked = creatures;
      return creatures.map((cr) => ({ object: cr.object, target: walker }));
    };
    game.debugApplyEffect(A, {
      kind: "for-each-player",
      who: "each-opponent",
      effect: soldiers(1, { player: "that-player", orTheirPlaneswalker: true }),
    } as EffectSpec);
    game.advanceUntil(quiet);
    // Bob has no planeswalker: his token just attacks him.
    expect(asked).toHaveLength(1);
    expect(asked[0].options).toEqual([C, walker]);
    expect(soldierIds(game).map((id) => game.state.objects[id].attacking).sort()).toEqual([B, walker].sort());
  });

  it("entering after blockers are declared, it's unblocked and deals its damage (508.4d)", () => {
    const { game } = inCombat([A, B]);
    game.advanceUntil((s) => s.turn.step === "declare-blockers" && s.awaiting === null && s.priority.holder === A);
    game.debugApplyEffect(A, soldiers(1, "choose"));
    const [token] = soldierIds(game);
    expect(game.state.objects[token].attacking).toBe(B);
    expect(game.state.objects[token].blocked).toBe(false);
    const life = game.state.players[B].life;
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(life - 2 - 1);
  });
});
