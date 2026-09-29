import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

// Satya, Aetherflux Genius — and `delayed-trigger`'s `about: "created"`:
// "at the beginning of the next end step, sacrifice **that token** unless
// you pay …" acts on the token the resolution created, not the creature it
// copied.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setup = (energy: number, pay: boolean) => {
  const controllers = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99, startingLife: 40 },
    controllers,
    decks: [A, B].map((player) => ({ player, cards: Array(40).fill("Plains") })),
  });
  const c = controllers as Record<PlayerId, ScriptedController>;
  const satya = game.debugSpawn("Satya, Aetherflux Genius", A, "battlefield", { summoningSick: false });
  const giant = game.debugSpawn("Hill Giant", A, "battlefield");
  game.state.players[A].energy = energy;
  c[A].declareAttackersFn = () => [{ attacker: satya, defender: B }];
  c[A].chooseModesFn = () => (pay ? [0] : []);
  return { game, giant };
};

const afterAttackTriggers = (s: GameState): boolean =>
  s.turn.step === "declare-attackers" && s.zones.shared.stack.length === 0 && s.awaiting === null;
const copies = (game: Game, giant: ObjectId) =>
  game.battlefield.filter((id) => id !== giant && game.state.objects[id].cardName === "Hill Giant");
const toCleanup = (s: GameState): boolean => s.turn.number === 2;

describe("Satya, Aetherflux Genius", () => {
  it("a tapped and attacking copy of another creature, and two energy", () => {
    const { game, giant } = setup(0, true);
    game.advanceUntil(afterAttackTriggers);
    const [token] = copies(game, giant);
    expect(token).toBeDefined();
    expect(game.state.objects[token].isToken).toBe(true);
    expect(game.state.objects[token].tapped).toBe(true);
    expect(game.state.objects[token].attacking).toBe(B);
    expect(game.state.players[A].energy).toBe(2);
  });

  it("paying the token's mana value in energy keeps it", () => {
    const { game, giant } = setup(3, true);
    game.advanceUntil(toCleanup);
    expect(copies(game, giant)).toHaveLength(1);
    // Hill Giant's mana value is 4: 3 + 2 − 4.
    expect(game.state.players[A].energy).toBe(1);
    expect(game.state.objects[giant].zone).toBe("battlefield");
  });

  it("declining sacrifices that token — never the creature it copied", () => {
    const { game, giant } = setup(3, false);
    game.advanceUntil(toCleanup);
    expect(copies(game, giant)).toHaveLength(0);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.players[A].energy).toBe(5);
  });

  it("too little energy can't keep it", () => {
    const { game, giant } = setup(0, true);
    game.advanceUntil(toCleanup);
    expect(copies(game, giant)).toHaveLength(0);
    expect(game.state.players[A].energy).toBe(2);
  });
});
