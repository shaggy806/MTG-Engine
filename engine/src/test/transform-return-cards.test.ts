/**
 * The cards that exile themselves and return transformed, now that a card
 * which isn't double-faced stays put (rule 712.14a): Dion, Bahamut's
 * Dominant // Bahamut, Warden of Light and The Legend of Roku // Avatar
 * Roku. (The rule itself is in `put-onto-battlefield-options.test.ts`.)
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { faceName } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (a = new ScriptedController(A)) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const face = (game: Game, id: ObjectId): string => faceName(game.state.objects[id]);
const tokens = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const flying = (game: Game, id: ObjectId): boolean => game.characteristics(id).keywords.has("flying");
const toMain = (game: Game, turn: number): void =>
  game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "precombat-main" && quiet(s));
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

describe("Dion, Bahamut's Dominant // Bahamut, Warden of Light", () => {
  it("makes a Knight; Dion and other Knights you control fly during your turn only", () => {
    const game = setUp();
    const dion = game.debugSpawn("Dion, Bahamut's Dominant", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const [knight] = tokens(game, "2/2 White Knight Token");
    expect(knight).toBeDefined();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(flying(game, dion)).toBe(true);
    expect(flying(game, knight)).toBe(true);
    expect(flying(game, bears)).toBe(false);
    toMain(game, 2);
    expect(flying(game, dion)).toBe(false);
    expect(flying(game, knight)).toBe(false);
  });

  it("returns as Bahamut, whose chapter I grows and lifts the others; chapter III destroys and flips back", () => {
    const a = new ScriptedController(A);
    const game = setUp(a);
    const dion = game.debugSpawn("Dion, Bahamut's Dominant", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    lands(game, "Plains", 6);
    game.dispatch({ type: "activate-ability", player: A, source: dion, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(face(game, dion)).toBe("Bahamut, Warden of Light");
    expect(game.state.objects[dion].counters.lore).toBe(1);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[dion].counters["+1/+1"]).toBeUndefined();
    expect(flying(game, bears)).toBe(true);

    // Chapter III next, aimed at the opponent's Hill Giant.
    const theirs = game.debugSpawn("Hill Giant", B, "battlefield");
    game.state.objects[dion].counters.lore = 2;
    a.chooseTargetsFn = () => [{ kind: "object", object: theirs }];
    toMain(game, 3);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.state.objects[dion].zone).toBe("battlefield");
    expect(face(game, dion)).toBe("Dion, Bahamut's Dominant");
    // A new object, front face up: its enter trigger made a Knight.
    expect(tokens(game, "2/2 White Knight Token")).toHaveLength(1);
  });
});

describe("The Legend of Roku // Avatar Roku", () => {
  it("chapter III returns it as Avatar Roku, a creature that isn't a Saga", () => {
    const game = setUp();
    const roku = game.debugSpawn("The Legend of Roku", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[roku].counters.lore).toBe(1);
    // Chapter I exiled the top three, to play until the end of next turn.
    expect(game.state.zones.shared.exile).toHaveLength(3);
    game.state.objects[roku].counters.lore = 2;
    toMain(game, 3);
    expect(game.state.objects[roku].zone).toBe("battlefield");
    expect(face(game, roku)).toBe("Avatar Roku");
    expect(game.characteristics(roku).types).toEqual(["creature"]);
    toMain(game, 5);
    expect(game.state.objects[roku].zone).toBe("battlefield");
  });

  it("Avatar Roku makes a flying, firebending Dragon for {8}", () => {
    const game = setUp();
    const roku = game.debugSpawn("The Legend of Roku", A, "battlefield");
    game.state.objects[roku].face = 1;
    lands(game, "Mountain", 8);
    game.dispatch({ type: "activate-ability", player: A, source: roku, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    const [dragon] = tokens(game, "Dragon Token (Avatar Roku)");
    expect(dragon).toBeDefined();
    expect(flying(game, dragon)).toBe(true);
    expect(game.characteristics(dragon).power).toBe(4);
  });
});
