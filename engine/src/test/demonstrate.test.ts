/**
 * Demonstrate (rule 702.144a): "When you cast this spell, you may copy it
 * and you may choose new targets for the copy. If you copy the spell, choose
 * an opponent. That player copies the spell and may choose new targets for
 * that copy." — the `demonstrate()` trigger, and the TDC / Strixhaven cards
 * that carry it: Transforming Flourish (its controller's free cast, by
 * `cast-now`'s `by`), Creative Technique, Incarnation Technique and
 * Replication Technique.
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;

const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: players.map((p) => ({ player: p, cards: Array<string>(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const land of ["Mountain", "Mountain", "Mountain", "Mountain", "Swamp", "Island"]) {
    game.debugSpawn(land, A, "battlefield", { summoningSick: false });
  }
  return game;
};

const spawn = (game: Game, name: string, p: PlayerId): ObjectId =>
  game.debugSpawn(name, p, "battlefield", { summoningSick: false });

/** Put `names` on top of `p`'s library, the first named on top. */
const stackLibrary = (game: Game, p: PlayerId, names: readonly string[]): ObjectId[] => {
  const ids = names.map((n) => game.debugSpawn(n, p, "library"));
  const library = game.state.zones.perPlayer[p].library;
  game.state.zones.perPlayer[p].library = [...ids, ...library.filter((id) => !ids.includes(id))];
  return ids;
};

const cast = (game: Game, name: string, targets: readonly TargetRef[] = []): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [...targets] });
  game.advanceUntil((s) => s.awaiting !== null || s.zones.shared.stack.length === 0);
  return card;
};

/** Answer demonstrate's "copy this spell?". */
const demonstrate = (game: Game, yes: boolean): void => {
  expect(game.state.awaiting?.kind).toBe("choose-modes");
  game.dispatch({ type: "choose-modes", player: A, modes: yes ? [0] : [] });
};

const onStack = (game: Game) =>
  game.state.zones.shared.stack.map((id) => {
    const o = game.state.objects[id];
    return { name: o.cardName, controller: o.controller, copy: o.isCopy === true, targets: o.targets };
  });

describe("demonstrate", () => {
  it("declined, nobody copies the spell", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    cast(game, "Transforming Flourish", [obj(bears)]);
    demonstrate(game, false);
    expect(onStack(game)).toEqual([
      { name: "Transforming Flourish", controller: A, copy: false, targets: [obj(bears)] },
    ]);
  });

  it("copies for you, then for the opponent, whose copy is on top", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    // Something of Alice's, so Bob's copy has a target of its own to choose.
    const mine = spawn(game, "Runeclaw Bear", A);
    cast(game, "Transforming Flourish", [obj(bears)]);
    demonstrate(game, true);
    // Alice's copy: may change the target.
    expect(game.state.awaiting).toMatchObject({ kind: "choose-targets", player: A });
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(giant)] });
    // Bob's copy ("artifact or creature you don't control" from his side).
    expect(game.state.awaiting).toMatchObject({ kind: "choose-targets", player: B });
    game.dispatch({ type: "choose-targets", player: B, targets: [obj(mine)] });
    expect(onStack(game)).toEqual([
      { name: "Transforming Flourish", controller: A, copy: false, targets: [obj(bears)] },
      { name: "Transforming Flourish", controller: A, copy: true, targets: [obj(giant)] },
      { name: "Transforming Flourish", controller: B, copy: true, targets: [obj(mine)] },
    ]);
  });

  it("at a bigger table, asks which opponent copies it", () => {
    const game = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears", B);
    cast(game, "Transforming Flourish", [obj(bears)]);
    demonstrate(game, true);
    // Alice's copy has no other target to move to, so on to the opponent.
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    if (awaiting?.kind !== "choose-modes") return;
    expect(awaiting.player).toBe(A);
    expect(awaiting.modes).toHaveLength(2);
    // The second opponent offered is carol.
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    game.advanceUntil((s) => s.awaiting !== null || s.priority.holder !== null);
    expect(onStack(game).map((e) => e.controller)).toEqual([A, A, C]);
  });

  it("still copies a spell countered in response, as it last was on the stack", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const card = cast(game, "Transforming Flourish", [obj(bears)]);
    // Gone from the stack before the trigger resolves.
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game["moveObject"](card, "graveyard");
    demonstrate(game, true);
    game.advanceUntil((s) => s.awaiting !== null || s.zones.shared.stack.length === 0 || s.priority.holder !== null);
    expect(onStack(game).filter((e) => e.copy)).toHaveLength(2);
  });
});

describe("Transforming Flourish", () => {
  it("destroys the target, and its controller exiles to a nonland card they may cast free", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const [land, giant] = stackLibrary(game, B, ["Forest", "Hill Giant"]);
    cast(game, "Transforming Flourish", [obj(bears)]);
    demonstrate(game, false);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[land].zone).toBe("exile");
    // Bob is offered the Giant, for nothing.
    expect(game.state.awaiting).toMatchObject({ kind: "cast-now", player: B, cards: [giant] });
    game.dispatch({
      type: "cast-now",
      player: B,
      cast: { type: "cast-spell", player: B, card: giant, targets: [], via: "effect", free: true },
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.objects[giant].controller).toBe(B);
    // Exiled cards stay exiled.
    expect(game.state.objects[land].zone).toBe("exile");
  });

  it("does nothing more when the permanent isn't destroyed", () => {
    const game = setUp();
    const wall = spawn(game, "Darksteel Myr", B);
    const [land] = stackLibrary(game, B, ["Forest", "Hill Giant"]);
    cast(game, "Transforming Flourish", [obj(wall)]);
    demonstrate(game, false);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.objects[wall].zone).toBe("battlefield");
    expect(game.state.objects[land].zone).toBe("library");
    expect(game.state.awaiting).toBeNull();
  });
});

describe("Creative Technique", () => {
  it("reveals to a nonland card, exiles only it, bottoms the rest, and offers it free", () => {
    const game = setUp();
    // Shuffled first — so stack after the shuffle by making the library
    // nothing but these.
    game.state.zones.perPlayer[A].library = [];
    const [l1, l2, bolt] = stackLibrary(game, A, ["Forest", "Swamp", "Lightning Bolt"]);
    cast(game, "Creative Technique");
    demonstrate(game, false);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    expect(game.state.objects[bolt].zone).toBe("exile");
    // Revealed, not exiled: back in the library.
    expect(game.state.objects[l1].zone).toBe("library");
    expect(game.state.objects[l2].zone).toBe("library");
    expect(game.state.awaiting).toMatchObject({ kind: "cast-now", player: A, cards: [bolt] });
  });
});

describe("Incarnation Technique", () => {
  it("mills five, then returns a creature card from the graveyard", () => {
    const game = setUp();
    stackLibrary(game, A, ["Hill Giant", "Island", "Island", "Island", "Island"]);
    cast(game, "Incarnation Technique");
    demonstrate(game, false);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    const giant = game.state.zones.shared.battlefield.find((id) => game.state.objects[id].cardName === "Hill Giant");
    expect(giant).toBeDefined();
    expect(game.state.objects[giant!].controller).toBe(A);
  });
});

describe("Replication Technique", () => {
  it("creates a token copy of a permanent you control", () => {
    const game = setUp();
    const giant = spawn(game, "Hill Giant", A);
    cast(game, "Replication Technique", [obj(giant)]);
    demonstrate(game, false);
    game.advanceUntil((s) => s.awaiting !== null || quiet(s));
    const giants = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Hill Giant");
    expect(giants).toHaveLength(2);
    expect(giants.some((id) => game.state.objects[id].isToken)).toBe(true);
  });
});
