import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

// A token stack past the combat wake-up cap attacks as one counted object
// (`Game.attackingStackPart`): every token attacks, as the player declared
// (rule 508.1a) — a bug report (2026-10-07) had 336 Scute Swarms and only 103
// offered. Blockers split off the tokens they block; the rest deal their
// damage as one event from that many sources.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

function table(tokens: number, aExtras: readonly string[] = [], bBlockers = 0) {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 10_000 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array(40).fill("Forest") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const stack = game.debugSpawn("Scute Swarm", A, "battlefield", { summoningSick: false });
  game.state.objects[stack].isToken = true;
  game.state.objects[stack].stackCount = tokens;
  for (const name of aExtras) game.debugSpawn(name, A, "battlefield", { summoningSick: false });
  const bears: ObjectId[] = [];
  for (let i = 0; i < bBlockers; i += 1) bears.push(game.debugSpawn("Grizzly Bears", B, "battlefield"));
  return { game, a, b, stack, bears };
}

const postcombat = (s: GameState): boolean => s.turn.number === 1 && s.turn.step === "postcombat-main";

/** Every Scute Swarm token A has, stacks counted in full. */
const scutes = (game: Game): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === "Scute Swarm" && game.state.objects[id].controller === A)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("a token stack past the wake-up cap attacks as one counted object", () => {
  it("attacks with every token of 336, without minting an object per token", () => {
    const { game, a, stack } = table(336);
    const objects = game.battlefield.length;
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    game.advanceUntil(postcombat);
    expect(game.state.players[B].life).toBe(10_000 - 336);
    expect(game.battlefield.length).toBe(objects);
    expect(game.state.objects[stack].tapped).toBe(true);
    expect(scutes(game)).toBe(336);
  });

  it("splits a declared count off to attack, and leaves the rest at home untapped", () => {
    const { game, a, stack } = table(336);
    a.declareAttackersFn = () => [{ attacker: stack, defender: B, count: 200 }];
    game.advanceUntil(postcombat);
    expect(game.state.players[B].life).toBe(10_000 - 200);
    const swarms = game.battlefield.filter((id) => game.state.objects[id].cardName === "Scute Swarm");
    const tapped = swarms.filter((id) => game.state.objects[id].tapped);
    expect(tapped.map((id) => game.state.objects[id].stackCount ?? 1)).toEqual([200]);
    expect(scutes(game)).toBe(336);
  });

  it("gives each blocker a token of its own to block", () => {
    const { game, a, b, stack, bears } = table(300, [], 2);
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    b.declareBlockersFn = () => bears.map((bear) => ({ blocker: bear, attacker: stack }));
    game.advanceUntil(postcombat);
    // Two tokens blocked, each by a 2/2 that kills it; the other 298 connect.
    expect(game.state.players[B].life).toBe(10_000 - 298);
    expect(scutes(game)).toBe(298);
    for (const bear of bears) expect(game.state.objects[bear]?.damageMarked).toBe(1);
  });

  it("puts two blockers on one token when they name the same member", () => {
    const { game, a, b, stack, bears } = table(300, [], 2);
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    b.declareBlockersFn = () => bears.map((bear) => ({ blocker: bear, attacker: stack, attackerMember: 0 }));
    game.advanceUntil(postcombat);
    expect(game.state.players[B].life).toBe(10_000 - 299);
    expect(scutes(game)).toBe(299);
  });

  it("needs two blockers on a token with menace", () => {
    const { game, a, b, stack, bears } = table(300, ["Goblin War Drums"], 2);
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    // One creature on each of two tokens is two lone blocks: menace forbids it.
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: B, blocks: bears.map((bear) => ({ blocker: bear, attacker: stack })) }),
    ).toThrow(/menace/);
    game.dispatch({
      type: "declare-blockers",
      player: B,
      blocks: bears.map((bear) => ({ blocker: bear, attacker: stack, attackerMember: 0 })),
    });
    void b;
    game.advanceUntil(postcombat);
    expect(game.state.players[B].life).toBe(10_000 - 299);
  });

  it("refuses more blocked tokens than the stack holds, or a member past its last", () => {
    const { game, a, stack, bears } = table(150, [], 1);
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    expect(() =>
      game.dispatch({
        type: "declare-blockers",
        player: B,
        blocks: [{ blocker: bears[0], attacker: stack, attackerMember: 150 }],
      }),
    ).toThrow(/150 tokens/);
  });

  it("fires a creature's attack trigger once per attacking token (Hellrider)", () => {
    const { game, a, stack } = table(300, ["Hellrider"]);
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    game.advanceUntil(postcombat);
    // 300 tokens attacking: Hellrider's 1 damage each, then their 1 each.
    expect(game.state.players[B].life).toBe(10_000 - 600);
  });

  it('fires "one or more creatures deal combat damage" once (Grim Hireling)', () => {
    const { game, a, stack } = table(300, ["Grim Hireling"]);
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    game.advanceUntil(postcombat);
    const treasures = game.battlefield.filter((id) => game.state.objects[id].cardName === "Treasure Token");
    expect(treasures.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
  });

  it("keeps a stack at or under the cap waking into separate attackers, as before", () => {
    const { game, a, stack } = table(40);
    const objects = game.battlefield.length;
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" || postcombat(s));
    const attacking = game.battlefield.filter((id) => game.state.objects[id].attacking !== null);
    expect(attacking).toHaveLength(40);
    expect(game.battlefield.length).toBe(objects + 39);
  });
});
