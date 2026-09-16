/**
 * The `{ manaValueOf }` {@link EffectAmount} — "equal to that permanent's mana
 * value" (Feed the Swarm, Hoard-Smelter Dragon, Aura Mutation).
 *
 * The behaviour worth pinning down is that it reads *last known information*
 * (rule 608.2h): every card printed this way destroys the permanent first and
 * then reads its mana value, so by the time the amount is evaluated the object
 * is already in a graveyard.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });

describe("manaValueOf", () => {
  it("reads a permanent's printed mana value", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    // Craw Wurm is {4}{G}{G} — mana value 6.
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    const before = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "lose-life", amount: { manaValueOf: 0 } }, [
      { kind: "object", object: wurm },
    ]);
    expect(game.state.players[A].life).toBe(before - 6);
  });

  it("still answers after the permanent has been destroyed", () => {
    // The Feed the Swarm line: destroy, *then* read the mana value.
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    const before = game.state.players[A].life;

    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "lose-life", amount: { manaValueOf: 0 } },
        ],
      },
      [{ kind: "object", object: wurm }],
    );

    expect(game.state.objects[wurm].zone).toBe("graveyard");
    expect(game.state.players[A].life).toBe(before - 6);
  });

  it("is 0 for a player target", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    const before = game.state.players[A].life;
    game.debugApplyEffect(A, { kind: "lose-life", amount: { manaValueOf: 0 } }, [
      { kind: "player", player: B },
    ]);
    expect(game.state.players[A].life).toBe(before);
  });

  it("scales a token count, the Aura Mutation line", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    // Glorious Anthem is {1}{W}{W} — mana value 3.
    const anthem = game.debugSpawn("Glorious Anthem", B, "battlefield");
    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        effects: [
          { kind: "destroy", target: 0 },
          { kind: "create-token", token: "Saproling Token", count: { manaValueOf: 0 } },
        ],
      },
      [{ kind: "object", object: anthem }],
    );

    const saprolings = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Saproling Token",
    );
    const total = saprolings.reduce(
      (n, id) => n + (game.state.objects[id].stackCount ?? 1),
      0,
    );
    expect(total).toBe(3);
  });

  it("reads `source` as well as a target slot", () => {
    const game = makeGame();
    game.advanceUntil((s) => s.priority.holder === A);
    // Hoard-Smelter Dragon is {4}{R}{R} — mana value 6.
    const dragon = game.debugSpawn("Hoard-Smelter Dragon", A, "battlefield");
    const before = game.state.players[A].life;
    game.debugApplyEffect(
      A,
      { kind: "lose-life", amount: { manaValueOf: "source" } },
      [],
      { source: dragon },
    );
    expect(game.state.players[A].life).toBe(before - 6);
  });
});
