/**
 * Gift (rule 702.174): "as an additional cost to cast this spell, you may
 * choose an opponent". Promising it is the cast variant the kicker machinery
 * offers under the keyword `gift` (702.174k); the opponent is chosen as the
 * cost is paid — with one opponent there's nothing to ask, with more the
 * caster is asked about each in turn (`GiftAsk`). An instant or sorcery gives
 * the gift before its other effects (702.174j); a permanent, when it enters
 * (702.174b). A spell countered gives nothing; a copy of one is promised to
 * the same opponent (the rulings).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const setUp = (players: readonly PlayerId[] = [A, B]): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((player) => ({ player, cards: Array<string>(48).fill("Wastes") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, who: PlayerId = A): ObjectId =>
  game.debugSpawn(name, who, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const toHand = (game: Game, name: string, who: PlayerId = A): ObjectId => game.debugSpawn(name, who, "hand");
const castOffers = (game: Game, card: ObjectId, who: PlayerId = A): CastOffer[] =>
  game.legalActions(who).filter((a): a is CastOffer => a.kind === "cast-spell" && a.card === card);
const handSize = (game: Game, who: PlayerId): number => game.handOf(who).length;
const named = (game: Game, name: string, who?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && (who === undefined || game.state.objects[id].controller === who),
  );

describe("gift — the cast", () => {
  it("is offered both ways: unpromised, and promised as the `gift` variant", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const truce = toHand(game, "Dawn's Truce");
    const offers = castOffers(game, truce);
    expect(offers.map((o) => o.kickerKeyword ?? null).sort()).toEqual(["gift", null].sort());
    const promised = offers.find((o) => o.kicked === true);
    // Gift costs no mana: the same cost either way.
    expect(promised?.kickerCost).toBe("");
  });

  it("two players: the one opponent is promised it without asking", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const truce = toHand(game, "Dawn's Truce");
    game.dispatch({ type: "cast-spell", player: A, card: truce, targets: [], kicked: true });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[truce].giftTo).toBe(B);
    expect(game.eventsOfType("gift-promised").map((e) => e.to)).toEqual([B]);
  });

  it("more opponents: asked about each in turn, the last one left taking it", () => {
    const game = setUp([A, B, C]);
    lands(game, "Plains", 4);
    const first = toHand(game, "Dawn's Truce");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [], kicked: true });
    const ask = game.state.awaiting;
    expect(ask?.kind === "choose-modes" ? ask.about : undefined).toBe(B);
    game.dispatch({ type: "choose-modes", player: A, modes: [] });
    // Declined Bob: Carol is the only one left, and gets it.
    expect(game.state.objects[first].giftTo).toBe(C);
    game.advanceUntil(quiet);

    const second = toHand(game, "Dawn's Truce");
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [], kicked: true });
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    expect(game.state.objects[second].giftTo).toBe(B);
  });

  it("unpromised, nobody is asked and nothing is given", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const truce = toHand(game, "Dawn's Truce");
    const theirs = handSize(game, B);
    game.dispatch({ type: "cast-spell", player: A, card: truce, targets: [] });
    expect(game.state.objects[truce].giftTo).toBeUndefined();
    game.advanceUntil(quiet);
    expect(handSize(game, B)).toBe(theirs);
  });
});

describe("gift — an instant or sorcery", () => {
  it("gives the gift first, then does what the promise adds (Dawn's Truce)", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears");
    const truce = toHand(game, "Dawn's Truce");
    const theirs = handSize(game, B);
    game.dispatch({ type: "cast-spell", player: A, card: truce, targets: [], kicked: true });
    game.advanceUntil(quiet);
    expect(handSize(game, B)).toBe(theirs + 1);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(bears).keywords.has("hexproof")).toBe(true);
    expect(game.state.hexproofPlayers).toContain(A);
  });

  it("unpromised, Dawn's Truce gives hexproof alone", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears");
    const truce = toHand(game, "Dawn's Truce");
    game.dispatch({ type: "cast-spell", player: A, card: truce, targets: [] });
    game.advanceUntil(quiet);
    expect(game.characteristics(bears).keywords.has("hexproof")).toBe(true);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(false);
  });

  it("countered, no gift is given (the ruling)", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const truce = toHand(game, "Dawn's Truce");
    const theirs = handSize(game, B);
    game.dispatch({ type: "cast-spell", player: A, card: truce, targets: [], kicked: true });
    game.debugApplyEffect(B, { kind: "counter", target: 0 }, [obj(truce)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[truce].zone).toBe("graveyard");
    expect(handSize(game, B)).toBe(theirs);
  });

  it("a copy is promised to the same opponent (the ruling)", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const truce = toHand(game, "Dawn's Truce");
    const theirs = handSize(game, B);
    game.dispatch({ type: "cast-spell", player: A, card: truce, targets: [], kicked: true });
    game.debugApplyEffect(A, { kind: "copy-spell", target: 0 }, [obj(truce)]);
    game.advanceUntil(quiet);
    expect(handSize(game, B)).toBe(theirs + 2);
  });

  it("the promise changes the target: Into the Flood Maw reaches a noncreature only promised", () => {
    const game = setUp();
    lands(game, "Island", 2);
    const ring = spawn(game, "Sol Ring", B);
    const maw = toHand(game, "Into the Flood Maw");
    const offers = castOffers(game, maw);
    const plain = offers.find((o) => o.kicked !== true);
    const promised = offers.find((o) => o.kicked === true);
    // No creature of theirs: unpromised, nothing to target, so not on offer.
    expect(plain).toBeUndefined();
    expect(promised?.targetOptions[0]).toContainEqual(obj(ring));
    game.dispatch({ type: "cast-spell", player: A, card: maw, targets: [obj(ring)], kicked: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("hand");
    const fish = named(game, "Fish Token", B);
    expect(fish).toHaveLength(1);
    expect(game.state.objects[fish[0]].tapped).toBe(true);
  });

  it("Parting Gust unpromised: back at the next end step with a +1/+1 counter", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    const gust = toHand(game, "Parting Gust");
    game.dispatch({ type: "cast-spell", player: A, card: gust, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("exile");
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    const back = named(game, "Grizzly Bears", B);
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].counters["+1/+1"]).toBe(1);
  });

  it("Parting Gust promised: exiled for good, and they get a tapped Fish", () => {
    const game = setUp();
    lands(game, "Plains", 2);
    const bears = spawn(game, "Grizzly Bears", B);
    const gust = toHand(game, "Parting Gust");
    game.dispatch({ type: "cast-spell", player: A, card: gust, targets: [obj(bears)], kicked: true });
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.turn.number > 1);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(named(game, "Grizzly Bears", B)).toHaveLength(0);
    expect(named(game, "Fish Token", B)).toHaveLength(1);
  });

  it("Starfall Invocation promised: a creature card it put into your graveyard comes back", () => {
    const game = setUp();
    lands(game, "Plains", 5);
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    const starfall = toHand(game, "Starfall Invocation");
    game.dispatch({ type: "cast-spell", player: A, card: starfall, targets: [], kicked: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const ask = game.state.awaiting;
    expect(ask?.kind).toBe("choose-from-zone");
    if (ask?.kind !== "choose-from-zone") return;
    // Only your own graveyard's: Bob's Bears went to his.
    expect(ask.eligible).toEqual([giant]);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [giant] });
    game.advanceUntil(quiet);
    expect(named(game, "Hill Giant", A)).toHaveLength(1);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
  });
});

describe("gift — a permanent (Scrapshooter)", () => {
  it("promised: as it enters, they draw, and an artifact of theirs is destroyed", () => {
    const game = setUp();
    lands(game, "Forest", 3);
    const ring = spawn(game, "Sol Ring", B);
    const shooter = toHand(game, "Scrapshooter");
    const theirs = handSize(game, B);
    game.dispatch({ type: "cast-spell", player: A, card: shooter, targets: [], kicked: true });
    game.advanceUntil((s) => quiet(s) && s.zones.shared.battlefield.includes(shooter));
    expect(handSize(game, B)).toBe(theirs + 1);
    expect(game.state.objects[ring].zone).toBe("graveyard");
  });

  it("unpromised: neither enters ability triggers", () => {
    const game = setUp();
    lands(game, "Forest", 3);
    const ring = spawn(game, "Sol Ring", B);
    const shooter = toHand(game, "Scrapshooter");
    const theirs = handSize(game, B);
    game.dispatch({ type: "cast-spell", player: A, card: shooter, targets: [] });
    game.advanceUntil((s) => quiet(s) && s.zones.shared.battlefield.includes(shooter));
    expect(handSize(game, B)).toBe(theirs);
    expect(game.state.objects[ring].zone).toBe("battlefield");
  });

  it("the gift is given even if it has left by then, to the opponent its spell promised", () => {
    const game = setUp();
    lands(game, "Forest", 3);
    const shooter = toHand(game, "Scrapshooter");
    const theirs = handSize(game, B);
    game.dispatch({ type: "cast-spell", player: A, card: shooter, targets: [], kicked: true });
    game.advanceUntil((s) => s.zones.shared.battlefield.includes(shooter));
    // The gift trigger waits; the Scrapshooter is destroyed before it resolves.
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(shooter)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[shooter].zone).toBe("graveyard");
    expect(handSize(game, B)).toBe(theirs + 1);
  });
});
