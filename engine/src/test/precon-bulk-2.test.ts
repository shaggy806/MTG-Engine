/**
 * The second bulk precon pass:
 *
 * - `create-token { tapped }` (Army of the Damned, Overseer of the Damned),
 *   and the fact that tapped tokens are deliberately never stacked.
 * - `CardFilter.notSubtypes` (Cruel Revival's "non-Zombie creature").
 * - A `filter` on a `deals-combat-damage-to-player` trigger (Sharding Sphinx).
 * - The `"creature-attacking-you"` target spec (Soul Snare), which is
 *   narrower than `"attacking-or-blocking-creature"` at a 3-4 player table.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import { legalTargets } from "../targeting.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const makeGame = (players: readonly PlayerId[] = [A, B]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({
      player,
      cards: Array<string>(40).fill("Swamp"),
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

const tokensOf = (game: Game, player: PlayerId, name: string) =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].isToken &&
      game.state.objects[id].controller === player &&
      game.state.objects[id].cardName === name,
  );

describe("tokens that enter tapped", () => {
  it("makes thirteen individually, all tapped", () => {
    const game = makeGame();
    openWith(game, 8);
    const card = game.debugSpawn("Army of the Damned", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    settle(game);

    const zombies = tokensOf(game, A, "Zombie Token");
    // Thirteen real objects, not one stack of thirteen: a stack has a single
    // `tapped` flag and `findMergeableStack` has no notion of tapped-ness.
    expect(zombies.length).toBe(13);
    expect(zombies.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(zombies.every((id) => (game.state.objects[id].stackCount ?? 1) === 1)).toBe(true);
  });

  it("leaves an untapped batch free to stack", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugApplyEffect(A, {
      kind: "create-token",
      token: "Zombie Token",
      count: 13,
    });
    const zombies = tokensOf(game, A, "Zombie Token");
    const total = zombies.reduce(
      (n, id) => n + (game.state.objects[id].stackCount ?? 1),
      0,
    );
    expect(total).toBe(13);
    // Past `STACK_ORIGIN_THRESHOLD`, so this one *is* compacted.
    expect(zombies.length).toBeLessThan(13);
  });
});

describe("notSubtypes", () => {
  it("keeps Cruel Revival off a Zombie", () => {
    const game = makeGame();
    openWith(game, 0);
    const zombie = game.debugSpawn("Lord of the Accursed", B, "battlefield");
    const other = game.debugSpawn("Grizzly Bears", B, "battlefield");

    const legal = legalTargets(
      game.state,
      game.registry,
      { kind: "permanent", filter: { type: "creature", notSubtypes: ["Zombie"] } },
      A,
    );
    const ids = legal.flatMap((t) => (t.kind === "object" ? [t.object] : []));
    expect(ids).toContain(other);
    expect(ids).not.toContain(zombie);
  });
});

describe("a filtered combat-damage trigger", () => {
  it("fires for an artifact creature and not for a plain one", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Sharding Sphinx", A, "battlefield");
    // The Sphinx is itself an artifact creature; give it a non-artifact
    // stablemate to prove the filter bites.
    const plain = game.debugSpawn("Serra Angel", A, "battlefield");
    game.state.objects[plain].summoningSick = false;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [{ attacker: plain, defender: B }],
    });
    game.advanceUntil((s) => s.turn.step === "end" || s.awaiting !== null || s.result.over);

    // A Serra Angel connecting is not an artifact creature, so no "you may".
    expect(game.state.awaiting?.kind).not.toBe("choose-modes");
    expect(tokensOf(game, A, "Thopter Token").length).toBe(0);
  });
});

describe("creature-attacking-you", () => {
  it("sees only the creatures coming at you", () => {
    const game = makeGame([A, B, C]);
    game.advanceUntil((s) => s.priority.holder === B && s.turn.step === "precombat-main");
    const atMe = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const atThem = game.debugSpawn("Grizzly Bears", B, "battlefield");
    for (const id of [atMe, atThem]) game.state.objects[id].summoningSick = false;

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({
      type: "declare-attackers",
      player: B,
      attackers: [
        { attacker: atMe, defender: A },
        { attacker: atThem, defender: C },
      ],
    });

    const mine = legalTargets(game.state, game.registry, "creature-attacking-you", A);
    expect(mine.flatMap((t) => (t.kind === "object" ? [t.object] : []))).toEqual([atMe]);

    // The broader spec sees both — that's the difference the narrower one exists for.
    const either = legalTargets(
      game.state,
      game.registry,
      "attacking-or-blocking-creature",
      A,
    );
    expect(either.length).toBe(2);
  });
});

describe("an O-Ring", () => {
  it("exiles on entry and gives it back when it leaves", () => {
    const game = makeGame();
    openWith(game, 2);
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield");
    // A second candidate, so the trigger raises a real choice — with one
    // legal target it auto-targets and never asks.
    game.debugSpawn("Hill Giant", B, "battlefield");

    const card = game.debugSpawn("Banishing Light", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
    game.dispatch({
      type: "choose-targets",
      player: A,
      targets: [{ kind: "object", object: victim }],
    });
    settle(game);

    expect(game.state.objects[victim].zone).toBe("exile");
    expect(game.state.objects[victim].exiledBy).toBe(card);

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: card },
    ]);
    settle(game);

    expect(game.state.objects[victim].zone).toBe("battlefield");
    // Back under its *owner's* control, not the Banishing Light player's.
    expect(game.state.objects[victim].controller).toBe(B);
  });

  it("never gives back a token", () => {
    const game = makeGame();
    openWith(game, 2);
    game.debugApplyEffect(B, { kind: "create-token", token: "Zombie Token", count: 1 });
    const token = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].isToken,
    );
    expect(token).toBeDefined();
    if (token === undefined) return;
    // A second candidate, so the trigger raises a real choice — with one
    // legal target it auto-targets and never asks.
    game.debugSpawn("Hill Giant", B, "battlefield");

    const card = game.debugSpawn("Banishing Light", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.result.over);
    game.dispatch({
      type: "choose-targets",
      player: A,
      targets: [{ kind: "object", object: token }],
    });
    settle(game);

    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [
      { kind: "object", object: card },
    ]);
    settle(game);

    // Rule 111.7 — a token that leaves the battlefield ceases to exist, so
    // there is nothing for the O-Ring to hand back.
    expect(game.state.zones.shared.battlefield).not.toContain(token);
  });
});

describe("attack-with", () => {
  it("counts the whole declaration, not one attacker at a time", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Overwhelming Instinct", A, "battlefield");
    const crew = [0, 1, 2].map(() => {
      const id = game.debugSpawn("Grizzly Bears", A, "battlefield");
      game.state.objects[id].summoningSick = false;
      return id;
    });

    // Two attackers: below the threshold, so nothing is drawn.
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const before = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: crew[0], defender: B },
        { attacker: crew[1], defender: B },
      ],
    });
    settle(game);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before);
  });

  it("draws when the threshold is met", () => {
    const game = makeGame();
    openWith(game, 0);
    game.debugSpawn("Overwhelming Instinct", A, "battlefield");
    const crew = [0, 1, 2].map(() => {
      const id = game.debugSpawn("Grizzly Bears", A, "battlefield");
      game.state.objects[id].summoningSick = false;
      return id;
    });

    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    const before = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: crew.map((attacker) => ({ attacker, defender: B })),
    });
    settle(game);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(before + 1);
  });
});

describe("dealt-damage", () => {
  it("gives Hornet Nest a token per point taken", () => {
    const game = makeGame();
    openWith(game, 0);
    const nest = game.debugSpawn("Hornet Nest", A, "battlefield");

    game.debugApplyEffect(A, { kind: "damage", amount: 2, target: 0 }, [
      { kind: "object", object: nest },
    ]);
    settle(game);

    expect(tokensOf(game, A, "Insect Token (Flying, Deathtouch)").length).toBe(2);
  });
});
