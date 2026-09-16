/**
 * The fifth precon pass — mostly First Flight:
 *
 * - `AffectSpec` scope `"all-creatures"` with `withKeyword`/`withoutKeyword`
 *   (Gravitational Shift).
 * - `StaticAbility.grantPtPerCount`, a layer-7d bonus that scales with a live
 *   count (Skycat Sovereign) — distinct from `setBasePtFromCount`, which is a
 *   CDA that replaces the printed P/T.
 * - `StaticAbility.noMaxHandSize` (Thought Vessel).
 * - `put-on-bottom-of-library` and `{ toughnessOf }` (Condemn).
 * - `AbilityCost.exileSelf` (Hanged Executioner) — not a sacrifice, so
 *   nothing watching for a death sees one.
 * - `attack-with { attackingYou }` (Ever-Watching Threshold), which fires
 *   once per *attack* where an `attacks` trigger fires once per attacker.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 7 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Plains"),
    })),
  });

const openWith = (game: Game, n: number) => {
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const kind of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
};

const settle = (game: Game) =>
  game.advanceUntil(
    (s) =>
      s.zones.shared.stack.length === 0 &&
      s.pendingTriggers.length === 0 &&
      s.awaiting === null &&
      s.priority.holder !== null,
  );

describe("an all-creatures anthem", () => {
  it("reaches both sides of the table, split on the keyword", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Gravitational Shift", A, "battlefield");
    const myFlier = game.debugSpawn("Serra Angel", A, "battlefield");
    const myGround = game.debugSpawn("Hill Giant", A, "battlefield");
    const theirFlier = game.debugSpawn("Serra Angel", B, "battlefield");
    const theirGround = game.debugSpawn("Hill Giant", B, "battlefield");

    // Serra Angel is 4/4, Hill Giant 3/3.
    expect(game.characteristics(myFlier).power).toBe(6);
    expect(game.characteristics(theirFlier).power).toBe(6);
    expect(game.characteristics(myGround).power).toBe(1);
    expect(game.characteristics(theirGround).power).toBe(1);
    // Toughness is untouched by either half.
    expect(game.characteristics(theirGround).toughness).toBe(3);
  });
});

describe("a count-scaled P/T bonus", () => {
  it("grows Skycat Sovereign with every other flier, and shrinks back", () => {
    const game = makeGame();
    openWith(game, 0);
    const cat = game.debugSpawn("Skycat Sovereign", A, "battlefield");
    expect(game.characteristics(cat).power).toBe(1);

    const first = game.debugSpawn("Serra Angel", A, "battlefield");
    game.debugSpawn("Serra Angel", A, "battlefield");
    expect(game.characteristics(cat).power).toBe(3);

    // Someone else's flier, and a ground creature of yours, don't count.
    game.debugSpawn("Serra Angel", B, "battlefield");
    game.debugSpawn("Hill Giant", A, "battlefield");
    expect(game.characteristics(cat).power).toBe(3);

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: first },
    ]);
    settle(game);
    expect(game.characteristics(cat).power).toBe(2);
  });

  it("stacks with counters rather than replacing the printed P/T", () => {
    const game = makeGame();
    openWith(game, 0);
    const cat = game.debugSpawn("Skycat Sovereign", A, "battlefield");
    game.debugSpawn("Serra Angel", A, "battlefield");
    game.debugApplyEffect(A, {
      kind: "add-counter",
      target: 0,
      counter: "+1/+1",
      amount: 2,
    }, [{ kind: "object", object: cat }]);

    // 1 printed + 1 per other flier + 2 counters.
    expect(game.characteristics(cat).power).toBe(4);
  });
});

describe("no maximum hand size", () => {
  it("skips the cleanup discard while Thought Vessel is out", () => {
    const game = makeGame();
    openWith(game, 0);
    for (let i = 0; i < 10; i += 1) game.debugSpawn("Plains", A, "hand");
    game.debugSpawn("Thought Vessel", A, "battlefield");

    const held = game.state.zones.perPlayer[A].hand.length;
    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.awaiting !== null || s.result.over);
    // No discard was ever asked for, and the hand is untouched.
    expect(game.state.awaiting).toBeNull();
    expect(game.state.zones.perPlayer[A].hand.length).toBe(held);
  });

  it("still discards without one", () => {
    const game = makeGame();
    openWith(game, 0);
    for (let i = 0; i < 10; i += 1) game.debugSpawn("Plains", A, "hand");

    const turn = game.state.turn.number;
    game.advanceUntil((s) => s.turn.number > turn || s.awaiting?.kind === "discard" || s.result.over);
    expect(game.state.awaiting?.kind).toBe("discard");
  });
});

describe("Condemn", () => {
  it("buries the attacker and pays its controller its toughness", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    // Serra Angel is a 4/4, so B gains 4.
    const attacker = game.debugSpawn("Serra Angel", B, "battlefield");
    game.state.objects[attacker].summoningSick = false;
    for (const kind of ["Plains"]) {
      const id = game.debugSpawn(kind, A, "battlefield");
      game.state.objects[id].tapped = false;
    }

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: B,
      attackers: [{ attacker, defender: A }],
    });

    const bLife = game.state.players[B].life;
    const librarySize = game.state.zones.perPlayer[B].library.length;
    const card = game.debugSpawn("Condemn", A, "hand");
    game.advanceUntil((s) => s.priority.holder === A || s.result.over);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [{ kind: "object", object: attacker }],
    });
    settle(game);

    expect(game.state.objects[attacker].zone).toBe("library");
    expect(game.state.players[B].life).toBe(bLife + 4);
    // On the *bottom* — index 0 is the top, which is what `drawCard` takes.
    const library = game.state.zones.perPlayer[B].library;
    expect(library.length).toBe(librarySize + 1);
    expect(library[library.length - 1]).toBe(attacker);
  });
});

describe("exiling the source as a cost", () => {
  it("exiles rather than sacrifices, so no death is seen", () => {
    const game = makeGame();
    openWith(game, 2);
    const executioner = game.debugSpawn("Hanged Executioner", A, "battlefield");
    // A death-watcher that must stay quiet.
    game.debugSpawn("Midnight Reaper", A, "battlefield");
    const victim = game.debugSpawn("Hill Giant", B, "battlefield");

    const handBefore = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: executioner,
      abilityIndex: 0,
      targets: [{ kind: "object", object: victim }],
    });
    settle(game);

    expect(game.state.objects[executioner].zone).toBe("exile");
    expect(game.state.objects[victim].zone).toBe("exile");
    // Midnight Reaper draws on a nontoken creature *dying*; this wasn't one.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore);
  });
});

describe("attack-with, aimed at you", () => {
  it("draws once for an attack on you, whatever its size", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    game.debugSpawn("Ever-Watching Threshold", A, "battlefield");
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const crew = [0, 1, 2].map(() => {
      const id = game.debugSpawn("Hill Giant", B, "battlefield");
      game.state.objects[id].summoningSick = false;
      return id;
    });

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const before = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "declare-attackers",
      player: B,
      attackers: crew.map((attacker) => ({ attacker, defender: A })),
    });
    settle(game);

    // One card for the attack, not three for the attackers.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before + 1);
  });
});
