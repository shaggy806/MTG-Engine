/**
 * Amass (rule 701.44) — "Amass Zombies N": put N +1/+1 counters on an Army
 * you control; it's also a Zombie; if you control no Army, create a 0/0 black
 * Army creature token first.
 *
 * The behaviour that makes it one effect rather than a sequence of smaller
 * ones is that repeated amassing grows a *single* creature — "an Army you
 * control" has to resolve to the same object each time.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import { isLegalTarget } from "../targeting.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });

const armiesOf = (game: Game, player = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => {
    const o = game.state.objects[id];
    return o.controller === player && game.characteristics(id).subtypes.includes("Army");
  });

const amass = (game: Game, n: number) =>
  game.debugApplyEffect(A, { kind: "amass", amount: n, creatureType: "Zombie" });

describe("amass", () => {
  it("creates one 0/0 Army and puts the counters on it", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    amass(game, 2);

    const armies = armiesOf(game);
    expect(armies.length).toBe(1);
    const army = armies[0];
    expect(game.state.objects[army].counters["+1/+1"]).toBe(2);
    // 0/0 base plus two counters.
    expect(game.characteristics(army).power).toBe(2);
    expect(game.characteristics(army).toughness).toBe(2);
  });

  it("makes the Army the named creature type", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    amass(game, 1);
    const army = armiesOf(game)[0];
    const subtypes = game.characteristics(army).subtypes;
    expect(subtypes).toContain("Army");
    expect(subtypes).toContain("Zombie");
  });

  it("grows the same Army instead of making a second one", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    amass(game, 1);
    const first = armiesOf(game)[0];
    amass(game, 3);

    expect(armiesOf(game)).toEqual([first]);
    expect(game.state.objects[first].counters["+1/+1"]).toBe(4);
    expect(game.characteristics(first).power).toBe(4);
  });

  it("does not grow an opponent's Army", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugApplyEffect(B, { kind: "amass", amount: 2, creatureType: "Zombie" });
    expect(armiesOf(game, B).length).toBe(1);

    amass(game, 1);
    expect(armiesOf(game, A).length).toBe(1);
    expect(game.state.objects[armiesOf(game, B)[0]].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[armiesOf(game, A)[0]].counters["+1/+1"]).toBe(1);
  });

  it("a bare 0/0 Army would die — amass 0 makes nothing", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    amass(game, 0);
    expect(armiesOf(game).length).toBe(0);
  });
});

describe("Zombie-token lords", () => {
  it("Eternal Skylord gives the amassed Army flying, but not a nontoken Zombie", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    // `announceEntry` — a plain spawn is silent, so the ETB wouldn't fire.
    game.debugSpawn("Eternal Skylord", A, "battlefield", { announceEntry: true });
    // The trigger still has to be placed and resolved, and the stack is
    // momentarily empty before that happens, so wait for the Army itself.
    game.advanceUntil(() => armiesOf(game).length > 0 || game.state.result.over);

    const army = armiesOf(game)[0];
    expect(army).toBeDefined();
    expect(game.characteristics(army).keywords.has("flying")).toBe(true);

    // The Skylord itself is a Zombie, but not a token.
    const skylord = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Eternal Skylord",
    );
    expect(skylord).toBeDefined();
    if (skylord === undefined) return;
    expect(game.characteristics(skylord).keywords.has("flying")).toBe(false);
  });
});

describe("Lazotep Plating — player hexproof", () => {
  it("stops an opponent targeting you, but not you targeting yourself", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugApplyEffect(A, { kind: "grant-player-hexproof", who: "you" });

    expect(game.state.hexproofPlayers).toContain(A);
    const alice = { kind: "player" as const, player: A };
    const bob = { kind: "player" as const, player: B };
    const legal = (who: typeof A, ref: typeof alice) =>
      isLegalTarget(game.state, createDefaultRegistry(), "player", ref, who);
    // B can't point anything at A any more; A still can, and B is untouched.
    expect(legal(B, alice)).toBe(false);
    expect(legal(A, alice)).toBe(true);
    expect(legal(A, bob)).toBe(true);
    expect(game.state.hexproofPlayers.includes(B)).toBe(false);
  });

  it("wears off as a new turn begins", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    game.debugApplyEffect(A, { kind: "grant-player-hexproof", who: "you" });
    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.result.over);
    expect(game.state.hexproofPlayers).not.toContain(A);
  });
});
