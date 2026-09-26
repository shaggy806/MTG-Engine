/**
 * `choose-permanents` — a choice of permanents made as an effect resolves,
 * with no targeting: "untap up to two lands". The lands are picked then, from
 * anyone's, so nothing about them can make the spell fizzle; the old Frantic
 * Search authored them as three optional *targets*, which let a response that
 * removed all three counter its draw.
 *
 * Cards: Frantic Search, Snap, Rewind, Unwind, Peregrine Drake and Cloud of
 * Faeries.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import type { GameRules } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (rules: Partial<GameRules> = { maxLandsPerTurn: 99 }) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxHandSize: 99, ...rules },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const tapped = (game: Game, ids: readonly ObjectId[]): boolean[] => ids.map((id) => game.state.objects[id].tapped);
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: card }]);
  return card;
};

describe("Frantic Search", () => {
  it("draws two, discards two, then untaps up to three lands chosen as it resolves — anyone's", () => {
    const { game, a } = setUp();
    const islands = [spawn(game, "Island"), spawn(game, "Island"), spawn(game, "Island")];
    const theirs = spawn(game, "Swamp", B);
    game.state.objects[theirs].tapped = true;
    const search = game.debugSpawn("Frantic Search", A, "hand");
    const offer = game.legalActions(A).find((x) => x.kind === "cast-spell" && x.card === search);
    if (offer?.kind !== "cast-spell") throw new Error("not offered");
    // No targets at all: the lands aren't chosen as it's cast.
    expect(offer.targetSpecs).toEqual([]);
    let eligible: readonly ObjectId[] = [];
    let bounds: [number, number] = [-1, -1];
    a.choosePermanentsFn = (_view, options, min, max) => {
      eligible = options;
      bounds = [min, max];
      return [islands[0], islands[1], theirs];
    };
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: search });
    game.advanceUntil(quiet);
    expect(tapped(game, islands)).toEqual([false, false, true]);
    expect(game.state.objects[theirs].tapped).toBe(false);
    expect(eligible).toEqual(expect.arrayContaining([...islands, theirs]));
    expect(bounds).toEqual([0, 3]);
    // Frantic Search itself left the hand; two drawn, two discarded.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand - 1 + 2 - 2);
  });

  it("no land leaving in response can stop the draw", () => {
    const { game } = setUp();
    const islands = [spawn(game, "Island"), spawn(game, "Island"), spawn(game, "Island")];
    const search = game.debugSpawn("Frantic Search", A, "hand");
    const library = game.state.zones.perPlayer[A].library.length;
    game.dispatch({ type: "cast-spell", player: A, card: search });
    for (const id of islands) game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 2);
    expect(game.state.eventLog.some((e) => e.type === "spell-fizzled")).toBe(false);
  });
});

describe("the choose-permanents decision", () => {
  const raise = () => {
    const { game, a } = setUp();
    const islands = [spawn(game, "Island"), spawn(game, "Island")];
    const bears = spawn(game, "Grizzly Bears", B);
    for (const id of islands) game.state.objects[id].tapped = true;
    const hold = { set: false };
    a.choosePermanentsFn = () => {
      hold.set = true;
      return [];
    };
    // Snap with the answer withheld: dispatch the cast, then look at what's asked.
    const snap = game.debugSpawn("Snap", A, "hand");
    spawn(game, "Island");
    spawn(game, "Island");
    game.dispatch({ type: "cast-spell", player: A, card: snap, targets: [{ kind: "object", object: bears }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-permanents");
    return { game, islands, bears };
  };

  it("offers a bounded choice with its prompt, and refuses too many, repeats and strangers", () => {
    const { game, islands, bears } = raise();
    const offer = game.legalActions(A).find((x) => x.kind === "choose-permanents");
    if (offer?.kind !== "choose-permanents") throw new Error("not offered");
    expect(offer.min).toBe(0);
    expect(offer.max).toBe(2);
    expect(offer.prompt).toBe("Untap up to two lands");
    expect(game.state.objects[bears].zone).toBe("hand");
    const all = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Island");
    expect(() =>
      game.dispatch({ type: "choose-permanents", player: A, permanents: all.slice(0, 3) }),
    ).toThrow(/from 0 to 2/);
    expect(() =>
      game.dispatch({ type: "choose-permanents", player: A, permanents: [islands[0], islands[0]] }),
    ).toThrow(/twice/);
    expect(() =>
      game.dispatch({ type: "choose-permanents", player: A, permanents: [bears] }),
    ).toThrow(/can't be chosen/);
    game.dispatch({ type: "choose-permanents", player: A, permanents: [islands[1]] });
    expect(tapped(game, islands)).toEqual([true, false]);
  });

  it("asks nothing when nothing matches", () => {
    const { game, b } = setUp();
    let asked = false;
    b.choosePermanentsFn = () => {
      asked = true;
      return [];
    };
    // No lands anywhere yet: nothing to untap, so no question.
    enter(game, "Peregrine Drake", B);
    game.advanceUntil(quiet);
    expect(asked).toBe(false);
    // With one, it's asked.
    spawn(game, "Island");
    enter(game, "Peregrine Drake", B);
    game.advanceUntil(quiet);
    expect(asked).toBe(true);
  });
});

describe("Snap, Rewind and Unwind", () => {
  it("Snap bounces, then untaps your two lands by default", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const islands = [spawn(game, "Island"), spawn(game, "Island")];
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Snap", A, "hand"),
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(tapped(game, islands)).toEqual([false, false]);
  });

  it("Rewind counters and untaps four; with its spell gone it fizzles and untaps nothing", () => {
    const run = (removeFirst: boolean) => {
      const { game } = setUp();
      spawn(game, "Island", B);
      const opt = game.debugSpawn("Opt", B, "hand");
      game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
      game.dispatch({ type: "cast-spell", player: B, card: opt });
      game.advanceUntil((s) => s.priority.holder === A);
      const islands = [spawn(game, "Island"), spawn(game, "Island"), spawn(game, "Island"), spawn(game, "Island")];
      const rewind = game.debugSpawn("Rewind", A, "hand");
      game.dispatch({ type: "cast-spell", player: A, card: rewind, targets: [{ kind: "object", object: opt }] });
      if (removeFirst) game.debugApplyEffect(A, { kind: "counter", target: 0 }, [{ kind: "object", object: opt }]);
      game.advanceUntil(quiet);
      return { game, islands, opt, rewind };
    };
    const hit = run(false);
    expect(hit.game.state.objects[hit.opt].zone).toBe("graveyard");
    expect(tapped(hit.game, hit.islands)).toEqual([false, false, false, false]);
    const miss = run(true);
    expect(miss.game.state.eventLog.some((e) => e.type === "spell-fizzled" && e.object === miss.rewind)).toBe(true);
    expect(tapped(miss.game, miss.islands)).toEqual([true, true, true, true]);
  });

  it("Unwind counters only a noncreature spell", () => {
    const { game } = setUp();
    spawn(game, "Forest", B);
    const elves = game.debugSpawn("Llanowar Elves", B, "hand");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    game.dispatch({ type: "cast-spell", player: B, card: elves });
    game.advanceUntil((s) => s.priority.holder === A);
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const unwind = game.debugSpawn("Unwind", A, "hand");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === unwind)).toBe(false);
  });
});

describe("Peregrine Drake and Cloud of Faeries", () => {
  it("the Drake untaps up to five as it enters", () => {
    const { game } = setUp();
    const lands = Array.from({ length: 6 }, () => spawn(game, "Island"));
    for (const id of lands) game.state.objects[id].tapped = true;
    enter(game, "Peregrine Drake");
    game.advanceUntil(quiet);
    expect(tapped(game, lands).filter((t) => !t)).toHaveLength(5);
  });

  it("the Faeries untap up to two, and cycle for {2}", () => {
    const { game } = setUp();
    const lands = [spawn(game, "Island"), spawn(game, "Island"), spawn(game, "Island")];
    for (const id of lands) game.state.objects[id].tapped = true;
    enter(game, "Cloud of Faeries");
    game.advanceUntil(quiet);
    expect(tapped(game, lands).filter((t) => !t)).toHaveLength(2);
    const card = game.debugSpawn("Cloud of Faeries", A, "hand");
    expect(game.legalActions(A).some((x) => x.kind === "cycle" && x.card === card)).toBe(true);
  });
});
