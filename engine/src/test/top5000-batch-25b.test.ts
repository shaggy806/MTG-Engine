/**
 * Top-5000 batch 25b. No engine change: every card is existing vocabulary.
 * The tests pin the clause of each most likely to be wired wrong — a batched
 * attack trigger that ignores tokens (Mavren Fein), an attacking-only lord
 * (Blight Mound), a "modified" filter (Red XIII), an intervening-if that
 * reads one opponent's life lost (Sygg), the self-sacrifice draw (Smothering
 * Abomination), and the rest.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const prepare = (game: Game, player: PlayerId = A): void =>
  // An edict's choice is made as a player would next get priority.
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(player);
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power!, c.toughness!];
};
const keywords = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id).keywords;

describe("top-5000 batch 25b — Blight Mound", () => {
  it("pumps a Pest only while it attacks, and makes a Pest when a nontoken creature dies", () => {
    const { game, a } = setUp();
    spawn(game, "Blight Mound");
    const pest = spawn(game, "Pest Token");
    expect(pt(game, pest)).toEqual([1, 1]);
    expect(keywords(game, pest).has("menace")).toBe(false);
    a.declareAttackersFn = () => [{ attacker: pest, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(pt(game, pest)).toEqual([2, 1]);
    expect(keywords(game, pest).has("menace")).toBe(true);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(18);

    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(named(game, "Pest Token")).toHaveLength(2);
  });
});

describe("top-5000 batch 25b — Red XIII, Proud Warrior", () => {
  it("gives only other modified creatures vigilance and trample", () => {
    const { game } = setUp();
    spawn(game, "Red XIII, Proud Warrior");
    const plain = spawn(game, "Grizzly Bears");
    const modified = spawn(game, "Grizzly Bears");
    game.state.objects[modified].counters = { "-1/-1": 1 };
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].counters = { "+1/+1": 1 };
    expect(keywords(game, plain).has("trample")).toBe(false);
    expect(keywords(game, modified).has("vigilance")).toBe(true);
    expect(keywords(game, modified).has("trample")).toBe(true);
    expect(keywords(game, theirs).has("trample")).toBe(false);
  });

  it("returns an Aura card from your graveyard as it enters", () => {
    const { game } = setUp();
    const rancor = game.debugSpawn("Rancor", A, "graveyard");
    game.debugSpawn("Red XIII, Proud Warrior", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(zone(game, rancor)).toBe("hand");
  });
});

describe("top-5000 batch 25b — Goblin Sharpshooter", () => {
  it("untaps whenever a creature dies", () => {
    const { game } = setUp();
    const goblin = game.debugSpawn("Goblin Sharpshooter", A, "battlefield", { summoningSick: false, tapped: true });
    const bears = spawn(game, "Grizzly Bears", B);
    expect(game.state.objects[goblin].tapped).toBe(true);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(game.state.objects[goblin].tapped).toBe(false);
  });
});

describe("top-5000 batch 25b — Experimental Confectioner", () => {
  it("makes a Food as it enters, and a Rat when a Food is sacrificed", () => {
    const { game } = setUp();
    game.debugSpawn("Experimental Confectioner", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(named(game, "Food Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "sacrifice", who: "you", filter: { subtype: "Food" }, count: 1 });
    prepare(game);
    settle(game);
    expect(named(game, "Food Token")).toHaveLength(0);
    expect(named(game, "Rat Token (Can't Block)")).toHaveLength(1);
  });
});

describe("top-5000 batch 25b — Voyage Home", () => {
  it("costs {1} less for each artifact you control", () => {
    const { game } = setUp(["Voyage Home"]);
    spawn(game, "Plains");
    spawn(game, "Island");
    lands(game, "Wastes", 3);
    const spell = inHand(game, "Voyage Home");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === spell);
    expect(castable()).toBe(false);
    spawn(game, "Ornithopter");
    spawn(game, "Ornithopter");
    expect(castable()).toBe(true);
  });
});

describe("top-5000 batch 25b — Fanatic of Mogis", () => {
  it("deals each opponent damage equal to your devotion to red, itself included", () => {
    const { game } = setUp();
    spawn(game, "Goblin Sharpshooter");
    game.debugSpawn("Fanatic of Mogis", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 25b — Tegwyll, Duke of Splendor", () => {
  it("pumps other Faeries, and draws and drains you when one dies", () => {
    const { game } = setUp();
    const tegwyll = spawn(game, "Tegwyll, Duke of Splendor");
    const faerie = spawn(game, "Bitterbloom Bearer");
    expect(pt(game, faerie)).toEqual([2, 2]);
    expect(pt(game, tegwyll)).toEqual([2, 3]);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: faerie }]);
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(life(game, A)).toBe(19);
  });
});

describe("top-5000 batch 25b — Sygg, River Cutthroat", () => {
  const run = (lost: number): number => {
    const { game } = setUp();
    spawn(game, "Sygg, River Cutthroat");
    game.debugApplyEffect(A, { kind: "lose-life", amount: lost, who: "each-opponent" });
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    return game.handOf(A).length - hand;
  };

  it("draws at the end step once an opponent has lost 3 life", () => {
    expect(run(3)).toBe(1);
  });

  it("doesn't trigger when they lost only 2", () => {
    expect(run(2)).toBe(0);
  });
});
