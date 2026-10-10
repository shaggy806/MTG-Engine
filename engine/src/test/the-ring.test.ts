/**
 * The Ring tempts you (rule 701.54): the emblem, the Ring-bearer and its four
 * levels, and the cards built on it. Written on the shared table in
 * `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import { isRingBearer, ringBearerOf } from "../ring.js";

import {
  A,
  B,
  attack,
  blockOffer,
  cast,
  hand,
  lands,
  life,
  pickModes,
  pickPermanents,
  settle,
  spawn,
  supertypes,
  table,
  toGraveyard,
  toHand,
  toLibrary,
  toStep,
  zone,
} from "./harness.js";
import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";

/** Cast Birthday Escape ("Draw a card. The Ring tempts you."), choosing `bearer`. */
function tempt(game: Game, seat: ReturnType<typeof table>["a"], bearer?: ObjectId): void {
  lands(game, "Island", 1);
  toLibrary(game, "Wastes");
  if (bearer !== undefined) pickPermanents(seat, bearer);
  cast(game, toHand(game, "Birthday Escape"));
}

describe("the Ring tempts you", () => {
  it("gives the emblem, makes the chosen creature the Ring-bearer, legendary, and counts", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    tempt(game, a, giant);
    expect(isRingBearer(game.state, A, giant)).toBe(true);
    expect(supertypes(game, giant)).toContain("legendary");
    expect(supertypes(game, bears)).not.toContain("legendary");
    expect(game.state.players[A].ringTemptations).toBe(1);
    const emblems = game.state.emblems.filter((e) => e.owner === A && e.ring === true);
    expect(emblems).toHaveLength(1);
    expect(emblems[0].text).toContain("can't be blocked by creatures with greater power");
    expect(emblems[0].text).not.toContain("draw a card, then discard");
    // A second temptation: one emblem still, a new Ring-bearer, two levels.
    tempt(game, a, bears);
    expect(ringBearerOf(game.state, A)).toBe(bears);
    expect(isRingBearer(game.state, A, giant)).toBe(false);
    expect(supertypes(game, giant)).not.toContain("legendary");
    expect(game.state.emblems.filter((e) => e.owner === A && e.ring === true)).toHaveLength(1);
    expect(game.state.emblems.find((e) => e.owner === A && e.ring === true)?.text).toContain("draw a card, then discard");
  });

  it("still tempts with no creature to choose", () => {
    const { game, a } = table();
    spawn(game, "Call of the Ring");
    tempt(game, a);
    expect(game.state.players[A].ringTemptations).toBe(1);
    // Call of the Ring's "whenever you choose a creature" had nothing to see.
    expect(game.state.awaiting).toBeNull();
  });

  it("ends when another player gains control of the Ring-bearer, for good", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    tempt(game, a, bears);
    game.debugApplyEffect(B, { kind: "gain-control", target: 0, untilEndOfTurn: true }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(isRingBearer(game.state, A, bears)).toBe(false);
    toStep(game, "upkeep", B);
    expect(game.state.objects[bears].controller).toBe(A);
    expect(isRingBearer(game.state, A, bears)).toBe(false);
  });

  it("level 1: the Ring-bearer can't be blocked by creatures with greater power", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    tempt(game, a, bears);
    const giant = spawn(game, "Hill Giant", B);
    const elves = spawn(game, "Llanowar Elves", B);
    const offer = blockOffer(game, a, [bears]);
    const can = (blocker: ObjectId) =>
      game.canDispatch({ type: "declare-blockers", player: B, blocks: [{ blocker, attacker: bears }] });
    expect(offer.kind).toBe("declare-blockers");
    expect(can(giant)).not.toBeNull();
    expect(can(elves)).toBeNull();
  });

  it("levels 2-4: loot on attack, a blocker sacrificed at end of combat, 3 life from each opponent", () => {
    const { game, a, b } = table();
    const giant = spawn(game, "Hill Giant");
    for (let i = 0; i < 4; i += 1) tempt(game, a, giant);
    expect(game.state.players[A].ringTemptations).toBe(4);
    // Blocked: the blocker goes at end of combat; the loot happened as it attacked.
    // A 0/5: it survives the fight, so only the Ring's sacrifice puts it in the graveyard.
    const wall = spawn(game, "Drift of Phantasms", B);
    toLibrary(game, "Wastes");
    const before = hand(game).length;
    const discarded = game.state.zones.perPlayer[A].graveyard.length;
    b.declareBlockersFn = () => [{ blocker: wall, attacker: giant }];
    attack(game, a, [giant]);
    settle(game);
    expect(hand(game).length).toBe(before);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(discarded + 1);
    expect(zone(game, wall)).toBe("graveyard");
    // Unblocked next turn: each opponent loses 3 more than the damage.
    toStep(game, "precombat-main");
    b.declareBlockersFn = () => [];
    toLibrary(game, "Wastes");
    const was = life(game, B);
    attack(game, a, [giant]);
    settle(game);
    expect(life(game, B)).toBe(was - 3 - 3);
  });
});

describe("Ring cards", () => {
  it("Call of the Ring: choosing a Ring-bearer offers 2 life for a card", () => {
    const { game, a } = table({ step: "upkeep" });
    spawn(game, "Call of the Ring");
    const bears = spawn(game, "Grizzly Bears");
    pickPermanents(a, bears);
    pickModes(a, 0);
    toLibrary(game, "Wastes");
    const before = hand(game).length;
    settle(game);
    // Turn 1's upkeep has passed: run to the next one of ours.
    toStep(game, "upkeep");
    settle(game);
    expect(isRingBearer(game.state, A, bears)).toBe(true);
    expect(life(game)).toBe(18);
    expect(hand(game).length).toBeGreaterThan(before);
  });

  it("Frodo draws only once he's the Ring-bearer and the Ring has tempted twice", () => {
    const { game, a } = table();
    const frodo = spawn(game, "Frodo, Adventurous Hobbit");
    game.state.players[A].ringTemptations = 1;
    game.state.players[A].lifeGainedThisTurn = 3;
    pickPermanents(a, frodo);
    toLibrary(game, "Wastes");
    const before = hand(game).length;
    attack(game, a, [frodo]);
    settle(game);
    expect(game.state.players[A].ringTemptations).toBe(2);
    expect(isRingBearer(game.state, A, frodo)).toBe(true);
    expect(hand(game).length).toBe(before + 1);
  });

  it("Gollum's graveyard ability returns him for a creature", () => {
    const { game } = table();
    lands(game, "Swamp", 1);
    const gollum = toGraveyard(game, "Gollum, Patient Plotter");
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: gollum, abilityIndex: 0, targets: [], sacrifice: bears });
    settle(game);
    expect(zone(game, gollum)).toBe("hand");
    expect(zone(game, bears)).toBe("graveyard");
  });
});
