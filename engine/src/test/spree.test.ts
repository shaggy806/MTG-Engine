/**
 * Spree (rule 702.172): "choose one or more modes. As an additional cost to
 * cast this spell, pay the costs associated with those modes." Each mode of
 * a `castModal` spell carries its `spreeCost`; the cast pays the mana cost
 * plus the chosen modes' costs, on top of an alternative cost or a free cast
 * too (rule 118.9d — the rulings). What the modes cost depends on *which*
 * they are, so the offer lists the sets of modes it can pay for
 * (`castModal.modeSets`), and every driver picks one of them.
 */

import { describe, expect, it } from "vitest";

import { fitModeSet } from "../actions.js";
import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(48).fill("Wastes") },
      { player: B, cards: Array<string>(48).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, who: PlayerId = A): ObjectId =>
  game.debugSpawn(name, who, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name));
const toHand = (game: Game, name: string): ObjectId => game.debugSpawn(name, A, "hand");
const castOffers = (game: Game, card: ObjectId): CastOffer[] =>
  game.legalActions(A).filter((a): a is CastOffer => a.kind === "cast-spell" && a.card === card);
const tapped = (game: Game, ids: readonly ObjectId[]): number => ids.filter((id) => game.state.objects[id].tapped).length;

describe("spree — what the offer can pay for", () => {
  it("lists only the sets of modes the mana pays for, each mode with a legal target", () => {
    const game = setUp();
    lands(game, "Island", 3);
    const steps = toHand(game, "Three Steps Ahead");
    spawn(game, "Grizzly Bears");
    const [offer] = castOffers(game, steps);
    // {U} + {2} (draw) is three; {U} + {3} (copy) is four; nothing to counter.
    expect(offer?.castModal?.modeSets).toEqual([[2]]);
    expect(offer?.castModal?.maxModes).toBe(1);
    expect(offer?.castModal?.modes.map((m) => m.cost)).toEqual(["{1}{U}", "{3}", "{2}"]);
  });

  it("more mana opens more sets, together", () => {
    const game = setUp();
    lands(game, "Island", 6);
    const steps = toHand(game, "Three Steps Ahead");
    spawn(game, "Grizzly Bears");
    const [offer] = castOffers(game, steps);
    // {U}+{3}+{2} = 6: the copy and the draw together; never the counter.
    expect(offer?.castModal?.modeSets).toEqual([[1], [2], [1, 2]]);
  });

  it("isn't offered at all when no mode can be paid for", () => {
    const game = setUp();
    lands(game, "Plains", 1);
    const raid = toHand(game, "Requisition Raid");
    spawn(game, "Sol Ring", B);
    expect(castOffers(game, raid)).toEqual([]);
  });
});

describe("spree — casting", () => {
  it("pays the mana cost plus each chosen mode's cost", () => {
    const game = setUp();
    const plains = lands(game, "Plains", 5);
    const raid = toHand(game, "Requisition Raid");
    const ring = spawn(game, "Sol Ring", B);
    const study = spawn(game, "Rhystic Study", B);
    game.dispatch({ type: "cast-spell", player: A, card: raid, modes: [0, 1], targets: [obj(ring), obj(study)] });
    expect(tapped(game, plains)).toBe(3);
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("graveyard");
    expect(game.state.objects[study].zone).toBe("graveyard");
  });

  it("refuses a set of modes the mana can't pay for", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const raid = toHand(game, "Requisition Raid");
    const ring = spawn(game, "Sol Ring", B);
    const study = spawn(game, "Rhystic Study", B);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: raid, modes: [0, 1], targets: [obj(ring), obj(study)] }),
    ).toThrow();
    expect(game.state.zones.perPlayer[A].hand).toContain(raid);
  });

  it("must choose at least one mode (rule 702.172a)", () => {
    const game = setUp();
    lands(game, "Plains", 4);
    const raid = toHand(game, "Requisition Raid");
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: raid, modes: [], targets: [] })).toThrow();
  });

  it("a free cast still pays the modes' costs (the ruling)", () => {
    const game = setUp();
    const islands = lands(game, "Island", 2);
    game.debugApplyEffect(A, { kind: "player-effect", duration: "end-of-turn", castFromHandFree: {} });
    const steps = toHand(game, "Three Steps Ahead");
    const free = castOffers(game, steps).find((o) => o.free === true);
    expect(free?.castModal?.modeSets).toEqual([[2]]);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: steps, modes: [2], targets: [], free: true });
    expect(tapped(game, islands)).toBe(2);
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || quiet(s));
    if (game.state.awaiting?.kind === "discard") {
      game.dispatch({ type: "discard", player: A, cards: [game.handOf(A)[0]] });
    }
    game.advanceUntil(quiet);
    // Cast from hand (−1), drew two, discarded one.
    expect(game.handOf(A).length).toBe(hand);
  });

  it("does the modes in printed order: the tutored card is on top for the draw", () => {
    const game = setUp();
    lands(game, "Swamp", 5);
    const avarice = toHand(game, "Insatiable Avarice");
    const seeker = game.debugSpawn("Grizzly Bears", A, "library");
    game.dispatch({ type: "cast-spell", player: A, card: avarice, modes: [0, 1], targets: [player(A)] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-from-zone");
    // "A card" is a quantity: the search has to find one (rule 701.23d).
    expect(game.state.awaiting?.kind === "choose-from-zone" ? game.state.awaiting.min : undefined).toBe(1);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [seeker] });
    game.advanceUntil(quiet);
    // Searched for, shuffled, put on top, then drawn — the same card.
    expect(game.handOf(A).map((id) => game.state.objects[id].cardName)).toContain("Grizzly Bears");
    expect(game.state.players[A].life).toBe(17);
  });

  it("a mode's player target scopes it: counters only on that player's creatures", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const raid = toHand(game, "Requisition Raid");
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: raid, modes: [2], targets: [player(B)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[mine].counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Final Showdown", () => {
  it("all three: abilities lost, then the chosen creature's indestructible survives the wrath", () => {
    const game = setUp();
    lands(game, "Plains", 8);
    const showdown = toHand(game, "Final Showdown");
    const keeper = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Grizzly Bears");
    const myr = spawn(game, "Darksteel Myr", B);
    game.dispatch({ type: "cast-spell", player: A, card: showdown, modes: [0, 1, 2], targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-permanents" || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-permanents");
    game.dispatch({ type: "choose-permanents", player: A, permanents: [keeper] });
    game.advanceUntil(quiet);
    // The Myr lost its indestructible to the first mode; the Bears' was
    // granted after, so it kept it (the ruling).
    expect(game.state.objects[keeper].zone).toBe("battlefield");
    expect(game.state.objects[other].zone).toBe("graveyard");
    expect(game.state.objects[myr].zone).toBe("graveyard");
  });

  it("the first mode alone: every creature loses its abilities until end of turn", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const showdown = toHand(game, "Final Showdown");
    const myr = spawn(game, "Darksteel Myr", B);
    game.dispatch({ type: "cast-spell", player: A, card: showdown, modes: [0], targets: [] });
    game.advanceUntil(quiet);
    expect(game.characteristics(myr).keywords.has("indestructible")).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.characteristics(myr).keywords.has("indestructible")).toBe(true);
  });
});

describe("Smuggler's Surprise", () => {
  it("mills four and takes up to two creature or land cards milled", () => {
    const game = setUp();
    lands(game, "Forest", 3);
    const surprise = toHand(game, "Smuggler's Surprise");
    for (const name of ["Grizzly Bears", "Forest", "Sol Ring", "Hill Giant"]) game.debugSpawn(name, A, "library");
    game.dispatch({ type: "cast-spell", player: A, card: surprise, modes: [0], targets: [] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") return;
    const names = awaiting.eligible.map((id) => game.state.objects[id].cardName).sort();
    // The Sol Ring is neither; the Wastes in the library weren't milled.
    expect(names).toEqual(["Forest", "Grizzly Bears", "Hill Giant"]);
  });

  it("the third mode reaches creatures with power 4 or greater", () => {
    const game = setUp();
    lands(game, "Forest", 2);
    const surprise = toHand(game, "Smuggler's Surprise");
    const giant = spawn(game, "Craw Wurm");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: surprise, modes: [2], targets: [] });
    game.advanceUntil(quiet);
    expect(game.characteristics(giant).keywords.has("hexproof")).toBe(true);
    expect(game.characteristics(giant).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(bears).keywords.has("hexproof")).toBe(false);
  });
});

describe("fitModeSet", () => {
  it("takes the largest payable set of wanted modes, earlier-wanted first", () => {
    const sets = [[0], [1], [2], [0, 1], [1, 2]];
    expect(fitModeSet(sets, [0, 1, 2])).toEqual([0, 1]);
    expect(fitModeSet(sets, [2, 1, 0])).toEqual([1, 2]);
    expect(fitModeSet(sets, [2])).toEqual([2]);
    expect(fitModeSet([[1]], [0, 2])).toBeNull();
  });
});
