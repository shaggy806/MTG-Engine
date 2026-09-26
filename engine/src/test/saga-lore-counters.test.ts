import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

/**
 * A chapter ability triggers "when one or more lore counters are put onto
 * this Saga, if the number of lore counters on it was less than N and became
 * at least N" (rule 714.2b) — whoever or whatever put them there. The engine
 * used to fire chapters only for a Saga's own lore counters (the one it
 * enters with, and the one each precombat main phase adds), so proliferating
 * a Saga, or an effect putting lore counters on one, never advanced it.
 */

const [A, B] = ["alice", "bob"].map(asPlayerId);
const registry = createDefaultRegistry();

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Plains") })),
  });
  game.advanceUntil(
    (s) => s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

/** Pass priority until nothing is left on the stack or waiting to go there. */
function settle(game: Game): void {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  for (let i = 0; i < 100; i += 1) {
    const awaiting = game.state.awaiting;
    if (awaiting !== null) throw new Error(`unexpected ${awaiting.kind} decision`);
    if (game.state.zones.shared.stack.length === 0 && game.state.pendingTriggers.length === 0) {
      return;
    }
    game.dispatch({ type: "pass-priority", player: game.state.priority.holder as PlayerId });
  }
  throw new Error("the stack never emptied");
}

/** The Knight token objects; a token stack is one object (see `knightCount`). */
const knights = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Knight Token",
  );

/** How many Knight tokens there are, a token stack counted in full. */
const knightCount = (game: Game): number =>
  knights(game).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

function proliferate(game: Game, chosen: readonly TargetRef[]): void {
  game.debugApplyEffect(A, { kind: "proliferate" }, []);
  expect(game.state.awaiting?.kind).toBe("proliferate");
  game.dispatch({ type: "proliferate", player: A, chosen });
  settle(game);
}

describe("lore counters put on a Saga fire its chapters (rule 714.2b)", () => {
  it("proliferating a Saga fires the chapter it reaches", () => {
    const game = table();
    const saga = game.debugSpawn("History of Benalia", A, "battlefield");
    settle(game);
    expect(game.state.objects[saga].counters.lore).toBe(1);
    expect(knightCount(game)).toBe(1);

    proliferate(game, [obj(saga)]);

    expect(game.state.objects[saga].counters.lore).toBe(2);
    expect(knightCount(game)).toBe(2);
  });

  it("lore counters put at once fire every chapter they pass, then the Saga is sacrificed", () => {
    const game = table();
    const saga = game.debugSpawn("History of Benalia", A, "battlefield");
    settle(game);

    // 1 → 3: "I, II" fires for 2, and III for 3.
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "lore", amount: 2 }, [obj(saga)]);
    settle(game);

    expect(knightCount(game)).toBe(2);
    for (const knight of knights(game)) {
      const c = computeCharacteristics(game.state, registry, knight);
      expect([c.power, c.toughness]).toEqual([4, 3]);
    }
    expect(game.state.objects[saga].zone).toBe("graveyard");
  });

  it("under Doubling Season a Saga enters with two lore counters and proliferate puts two more", () => {
    const game = table();
    game.debugSpawn("Doubling Season", A, "battlefield");
    const saga = game.debugSpawn("History of Benalia", A, "battlefield");
    settle(game);

    // "Enters with a lore counter" (rule 714.3a) is counters put on it as it
    // enters (rule 122.6): doubled, so chapter "I, II" fires twice — and each
    // time Doubling Season doubles the Knight it makes.
    expect(game.state.objects[saga].counters.lore).toBe(2);
    expect(knightCount(game)).toBe(4);

    // Proliferate puts counters too: 2 → 4, passing III.
    proliferate(game, [obj(saga)]);
    for (const knight of knights(game)) {
      const c = computeCharacteristics(game.state, registry, knight);
      expect([c.power, c.toughness]).toEqual([4, 3]);
    }
    expect(game.state.objects[saga].zone).toBe("graveyard");
  });
});
