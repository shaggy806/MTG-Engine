/**
 * When state-based actions are checked, and what one check reads: deathtouch
 * damage counts only until the next check (rule 704.5h).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (let i = 0; i < 6; i += 1) {
    const id = game.debugSpawn("Forest", A, "battlefield");
    game.state.objects[id].tapped = false;
  }
  return game;
};

const ready = (game: Game, name: string, who: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, who, "battlefield");
  game.state.objects[id].summoningSick = false;
  return id;
};

const cast = (game: Game, name: string): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  return card;
};

describe("deathtouch damage and the state-based check (704.5h)", () => {
  it("an indestructible creature that survived it isn't destroyed by losing indestructible later", () => {
    const game = setUp();
    const avacyn = ready(game, "Avacyn, Angel of Hope");
    const bears = ready(game, "Grizzly Bears");
    const rats = ready(game, "Typhoid Rats", B);
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [obj(bears)], { source: rats });
    // A check while it's indestructible: it survives (704.5h's destruction
    // can't destroy it), and that check has read the deathtouch damage.
    cast(game, "Llanowar Elves");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].damageMarked).toBe(1);
    game.advanceUntil(quiet);
    // Avacyn leaves, and the next check finds a 2/2 with 1 damage marked —
    // not a creature dealt deathtouch damage since the last check.
    game.debugMove(avacyn, "graveyard");
    cast(game, "Llanowar Elves");
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("still destroys a creature dealt it since the last check", () => {
    const game = setUp();
    const bears = ready(game, "Grizzly Bears");
    const rats = ready(game, "Typhoid Rats", B);
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [obj(bears)], { source: rats });
    cast(game, "Llanowar Elves");
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });
});
