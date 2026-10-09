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

describe("a mana ability activated by hand (117.3c, 117.5)", () => {
  const activate = (game: Game, source: ObjectId): void => {
    game.dispatch({ type: "activate-ability", player: A, source, abilityIndex: 0, targets: [], manaColors: ["G"] });
  };

  it("checks state-based actions before its player gets priority again", () => {
    const game = setUp();
    const wall = ready(game, "Wall of Roots");
    game.state.objects[wall].counters["-0/-1"] = 4;
    activate(game, wall);
    // The {G} stays floating; the Wall, now 0/0, is already gone.
    expect(game.state.players[A].manaPool.map((unit) => unit.type)).toEqual(["G"]);
    expect(game.state.objects[wall].zone).toBe("graveyard");
    expect(game.state.priority.holder).toBe(A);
  });

  it("puts a trigger it caused on the stack before its player gets priority again", () => {
    const game = setUp();
    const infiltrator = ready(game, "Gixian Infiltrator");
    const treasure = ready(game, "Treasure Token");
    activate(game, treasure);
    expect(game.state.objects[treasure].zone).not.toBe("battlefield");
    expect(game.state.pendingTriggers).toHaveLength(0);
    const stack = game.state.zones.shared.stack;
    expect(stack).toHaveLength(1);
    expect(game.state.objects[stack[0]].sourceObjectId).toBe(infiltrator);
    expect(game.state.priority.holder).toBe(A);
  });

  it("paying a cost, gives no priority until the spell is cast (601.2g-h)", () => {
    const game = setUp();
    for (const id of game.state.zones.shared.battlefield) {
      if (game.state.objects[id].cardName === "Forest") game.state.objects[id].tapped = true;
    }
    const wall = ready(game, "Wall of Roots");
    game.state.objects[wall].counters["-0/-1"] = 4;
    // The auto-payer activates the Wall's mana ability inside the cast: the
    // Elves are on the stack, and only then does the 0/0 Wall die.
    const elves = cast(game, "Llanowar Elves");
    expect(game.state.objects[elves].zone).toBe("stack");
    expect(game.state.objects[wall].zone).toBe("graveyard");
  });
});
