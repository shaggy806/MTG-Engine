import { describe, expect, it } from "vitest";

import type { Action } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

// Attacking and blocking are choices made per creature (rules 508.1a,
// 509.1a). A compacted token stack is one object standing for many tokens,
// so a declaration's `count` says how many of it take part: the rest stay
// home, or go elsewhere in another entry (`combat/stack-counts.ts`).

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array(40).fill("Mountain") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

/** Mint `count` Goblin tokens for `player` — eight or more compact into one
 * stack — and return the stack's id. */
const goblinStack = (game: Game, player: typeof A, count: number): ObjectId => {
  game.debugApplyEffect(player, { kind: "create-token", token: "Goblin Token", count });
  const id = game.battlefield.find(
    (each) =>
      game.state.objects[each].cardName === "Goblin Token" &&
      game.state.objects[each].controller === player,
  );
  if (id === undefined || (game.state.objects[id].stackCount ?? 1) !== count) {
    throw new Error(`no stack of ${count} Goblins`);
  }
  return id;
};

const goblins = (game: Game, player: typeof A) =>
  game.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Goblin Token" && o.controller === player);
const tokens = (game: Game, player: typeof A): number =>
  goblins(game, player).reduce((n, o) => n + (o.stackCount ?? 1), 0);

/** Turn 3, alice's, at her attack declaration — the stack made on turn 1 is
 * past its summoning sickness. */
const atAttackDeclaration = (game: Game) =>
  game.advanceUntil((s) => s.turn.number === 3 && s.awaiting?.kind === "attackers");

const attack = (attackers: Extract<Action, { type: "declare-attackers" }>["attackers"]) =>
  ({ type: "declare-attackers", player: A, attackers }) as const;

describe("token stacks — attacking with part of one", () => {
  it("sends only the declared count; the rest stay home, untapped and still one stack", () => {
    const { game } = mkGame();
    const stack = goblinStack(game, A, 10);
    atAttackDeclaration(game);
    const life = game.state.players[B].life;

    game.dispatch(attack([{ attacker: stack, defender: B, count: 3 }]));
    const attacking = goblins(game, A).filter((o) => o.attacking !== null);
    expect(attacking).toHaveLength(3);
    expect(attacking.every((o) => o.tapped)).toBe(true);
    expect(game.state.objects[stack].stackCount).toBe(7);
    expect(game.state.objects[stack].attacking).toBeNull();
    expect(game.state.objects[stack].tapped).toBe(false);

    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "postcombat-main");
    expect(game.state.players[B].life).toBe(life - 3);
    expect(tokens(game, A)).toBe(10);
  });

  it("takes several counted entries for one stack, up to what it holds", () => {
    const { game } = mkGame();
    const stack = goblinStack(game, A, 10);
    atAttackDeclaration(game);
    expect(game.canDispatch(attack([
      { attacker: stack, defender: B, count: 4 },
      { attacker: stack, defender: B, count: 7 },
    ]))).toMatch(/11 declared, but it is only 10/);

    game.dispatch(attack([
      { attacker: stack, defender: B, count: 4 },
      { attacker: stack, defender: B, count: 6 },
    ]));
    expect(goblins(game, A).filter((o) => o.attacking === B)).toHaveLength(10);
  });

  it("refuses a count out of range, and a stack named twice without counts", () => {
    const { game } = mkGame();
    const stack = goblinStack(game, A, 10);
    atAttackDeclaration(game);
    expect(game.canDispatch(attack([{ attacker: stack, defender: B, count: 0 }]))).not.toBeNull();
    expect(game.canDispatch(attack([{ attacker: stack, defender: B, count: 11 }]))).not.toBeNull();
    expect(game.canDispatch(attack([{ attacker: stack, defender: B, count: 2.5 }]))).not.toBeNull();
    expect(game.canDispatch(attack([
      { attacker: stack, defender: B },
      { attacker: stack, defender: B, count: 2 },
    ]))).toMatch(/twice/);
    // No count is still the whole stack.
    expect(game.canDispatch(attack([{ attacker: stack, defender: B }]))).toBeNull();
  });
});

describe("token stacks — blocking with part of one", () => {
  /** Alice attacks with a Hill Giant and a menace creature; bob, holding a
   * stack of ten Goblins, is at his block declaration. */
  const atBlocks = () => {
    const { game, a } = mkGame();
    const giant = game.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
    const brute = game.debugSpawn("Boggart Brute", A, "battlefield", { summoningSick: false });
    const stack = goblinStack(game, B, 10);
    a.declareAttackersFn = () => [
      { attacker: giant, defender: B },
      { attacker: brute, defender: B },
    ];
    game.advanceUntil((s) => s.awaiting?.kind === "blockers" && s.awaiting.player === B);
    return { game, giant, brute, stack };
  };
  const block = (blocks: Extract<Action, { type: "declare-blockers" }>["blocks"]) =>
    ({ type: "declare-blockers", player: B, blocks }) as const;

  it("splits a stack between attackers and leaves the rest unblocking", () => {
    const { game, giant, brute, stack } = atBlocks();
    game.dispatch(block([
      { blocker: stack, attacker: giant, count: 3 },
      { blocker: stack, attacker: brute, count: 2 },
    ]));
    expect(game.state.objects[giant].blockedBy).toHaveLength(3);
    expect(game.state.objects[brute].blockedBy).toHaveLength(2);
    expect(game.state.objects[stack].stackCount).toBe(5);
    expect(game.state.objects[stack].blocking).toBeNull();
    expect(tokens(game, B)).toBe(10);
  });

  it("counts a stack's entry as its count for menace", () => {
    const { game, brute, stack } = atBlocks();
    // Rule 702.111b: a menace attacker can't be blocked except by two or more.
    expect(game.canDispatch(block([{ blocker: stack, attacker: brute, count: 1 }]))).toMatch(/menace/);
    expect(game.canDispatch(block([{ blocker: stack, attacker: brute, count: 2 }]))).toBeNull();
    // Without a count the whole stack blocks, which is plenty.
    expect(game.canDispatch(block([{ blocker: stack, attacker: brute }]))).toBeNull();
  });
});
