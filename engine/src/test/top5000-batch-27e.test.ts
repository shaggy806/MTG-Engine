/**
 * Top-5000 batch 27e. No engine change: each test pins the clause most likely
 * to be wired wrong — Akroan Horse handing itself to an opponent (and its
 * upkeep then making Soldiers for *its new controller's* opponents), Kura's
 * announced modal dies trigger and its X fixed as the token is made,
 * Knollspine Dragon's damage-taken count of its target, Vindictive Vampire's
 * "another", and Angelic Field Marshal's own-commander condition.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
/** Run everything out, answering every `choose-modes` with `mode`. */
const settle = (game: Game, mode = 0): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [mode] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};

describe("top-5000 batch 27e — Akroan Horse", () => {
  it("goes to the opponent as it enters, and its upkeep makes Soldiers for its new controller's opponents", () => {
    const { game } = setUp();
    const horse = game.debugSpawn("Akroan Horse", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[horse].controller).toBe(B);
    // Bob's upkeep: "each opponent" is Bob's — Alice gets the Soldier.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    settle(game);
    const soldiers = named(game, "Soldier Token");
    expect(soldiers).toHaveLength(1);
    expect(game.state.objects[soldiers[0]].controller).toBe(A);
  });
});

describe("top-5000 batch 27e — Vindictive Vampire", () => {
  it("pings each opponent and gains 1 for another creature dying, not for itself", () => {
    const { game } = setUp();
    const vampire = spawn(game, "Vindictive Vampire");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: vampire }]);
    settle(game);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(21);
  });
});

describe("top-5000 batch 27e — Kura, the Boundless Sky", () => {
  it("makes an X/X Spirit, X the lands its controller has as the token is made", () => {
    const { game } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest");
    spawn(game, "Forest", B);
    const kura = spawn(game, "Kura, the Boundless Sky");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: kura }]);
    settle(game, 1);
    const spirits = named(game, "Spirit Token (Kura, the Boundless Sky)");
    expect(spirits).toHaveLength(1);
    const read = (): number[] => {
      const c = computeCharacteristics(game.state, registry, spirits[0]);
      return [c.power, c.toughness];
    };
    expect(read()).toEqual([3, 3]);
    // X was read once, as it was made: a fourth land changes nothing.
    spawn(game, "Forest");
    expect(read()).toEqual([3, 3]);
  });
});

describe("top-5000 batch 27e — Knollspine Dragon", () => {
  it("discards the hand and draws the damage dealt to the target opponent this turn", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, { kind: "damage", amount: 3, target: 0 }, [{ kind: "player", player: B }]);
    const before = game.handOf(A).length;
    expect(before).toBeGreaterThan(3);
    const graveyardBefore = game.state.zones.perPlayer[A].graveyard.length;
    game.debugSpawn("Knollspine Dragon", A, "battlefield", { announceEntry: true });
    settle(game, 0);
    expect(game.handOf(A)).toHaveLength(3);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(graveyardBefore + before);
  });
});

describe("top-5000 batch 27e — Angelic Field Marshal", () => {
  it("gets +2/+2 and gives every creature vigilance only while you control your own commander", () => {
    const { game } = setUp();
    const marshal = spawn(game, "Angelic Field Marshal");
    const bears = spawn(game, "Grizzly Bears");
    const read = (id: ObjectId) => computeCharacteristics(game.state, registry, id);
    expect([read(marshal).power, read(marshal).toughness]).toEqual([3, 3]);
    expect(read(bears).keywords.has("vigilance")).toBe(false);
    // Another player's commander doesn't count.
    const theirs = spawn(game, "Hill Giant", B);
    game.state.objects[theirs].isCommander = true;
    expect([read(marshal).power, read(marshal).toughness]).toEqual([3, 3]);
    const mine = spawn(game, "Hill Giant");
    game.state.objects[mine].isCommander = true;
    expect([read(marshal).power, read(marshal).toughness]).toEqual([5, 5]);
    expect(read(bears).keywords.has("vigilance")).toBe(true);
    expect(read(marshal).keywords.has("vigilance")).toBe(true);
  });
});
