/**
 * Ninjutsu (rule 702.49): an ability of a card in the hand, whose cost
 * returns an unblocked attacker — the ninja enters tapped and attacking what
 * that creature attacked (702.49c), unblocked (508.4d). Commander ninjutsu
 * (702.49d) works from the command zone too. Written on the shared table in
 * `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { ScriptedController } from "../controller.js";
import type { Game } from "../game.js";
import type { ObjectId, PlayerId } from "../primitives.js";

import type { TargetRef } from "../target.js";

import {
  A,
  B,
  C,
  graveyard,
  hand,
  lands,
  life,
  pickModes,
  pickTargets,
  pt,
  settle,
  spawn,
  subtypes,
  table,
  toGraveyard,
  toHand,
  tokensNamed,
  toLibrary,
  toStep,
  zone,
} from "./harness.js";

/** `attackers` attack (Bob by default), unblocked unless `block` says who
 * blocks whom; the game stops in the declare blockers step with Alice's
 * priority. */
function toBlocks(
  game: Game,
  seat: ScriptedController,
  attackers: readonly ObjectId[],
  defender: PlayerId | ObjectId = B,
): void {
  seat.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender }));
  toStep(game, "declare-blockers");
}

const ninjutsuIndex = (game: Game, card: ObjectId, zone: "hand" | "command" = "hand"): number =>
  game.registry.get(game.state.objects[card].cardName).activated.findIndex((a) => a.ninjutsu === true && a.zone === zone);

describe("ninjutsu", () => {
  it("returns an unblocked attacker and puts the ninja onto the battlefield tapped and attacking, unblocked", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 2);
    const ninja = toHand(game, "Ninja of the Deep Hours");
    toBlocks(game, a, [bears]);
    game.dispatch({ type: "activate-ability", player: A, source: ninja, abilityIndex: ninjutsuIndex(game, ninja), targets: [] });
    // Paid at once: the Bears are back in hand, the ninja revealed and still there.
    expect(zone(game, bears)).toBe("hand");
    expect(zone(game, ninja)).toBe("hand");
    expect(game.state.eventLog.some((e) => e.type === "cards-revealed" && e.objects.includes(ninja))).toBe(true);
    pickModes(a, 0);
    const before = hand(game).length;
    toStep(game, "postcombat-main");
    settle(game);
    const object = game.state.objects[ninja];
    expect(object.zone).toBe("battlefield");
    expect(object.tapped).toBe(true);
    // It attacked Bob unblocked, and its combat damage drew a card.
    expect(life(game, B)).toBe(18);
    expect(hand(game).length).toBe(before + 1 - 1);
  });

  it("can't be activated before blockers are declared, or with only a blocked attacker", () => {
    const { game, a, b } = table();
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 2);
    const ninja = toHand(game, "Ninja of the Deep Hours");
    const wall = spawn(game, "Drift of Phantasms", B);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(
      (s) => s.turn.step === "declare-attackers" && s.objects[bears].attacking !== null && s.priority.holder === A,
    );
    const activate = () =>
      game.dispatch({ type: "activate-ability", player: A, source: ninja, abilityIndex: ninjutsuIndex(game, ninja), targets: [] });
    // Attacking, but neither blocked nor unblocked yet.
    expect(game.state.objects[bears].attacking).toBe(B);
    expect(activate).toThrow(/return/i);
    b.declareBlockersFn = () => [{ blocker: wall, attacker: bears }];
    toStep(game, "declare-blockers");
    expect(game.state.objects[bears].blocked).toBe(true);
    expect(activate).toThrow(/return/i);
    expect(zone(game, ninja)).toBe("hand");
  });

  it("attacks the same planeswalker the returned creature was attacking", () => {
    const { game, a } = table({ players: 3 });
    const walker = spawn(game, "Jace Beleren", C);
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 2);
    const ninja = toHand(game, "Ninja of the Deep Hours");
    toBlocks(game, a, [bears], walker);
    game.dispatch({ type: "activate-ability", player: A, source: ninja, abilityIndex: ninjutsuIndex(game, ninja), targets: [] });
    settle(game);
    expect(game.state.objects[ninja].attacking).toBe(walker);
  });

  it("puts nothing onto the battlefield when the card has left the hand in response", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 2);
    const ninja = toHand(game, "Ninja of the Deep Hours");
    toBlocks(game, a, [bears]);
    game.dispatch({ type: "activate-ability", player: A, source: ninja, abilityIndex: ninjutsuIndex(game, ninja), targets: [] });
    // A discard in response, say: the card is a new object in the graveyard.
    game.debugMove(ninja, "graveyard");
    settle(game);
    expect(zone(game, ninja)).toBe("graveyard");
    expect(zone(game, bears)).toBe("hand");
  });
});

/** Ninjutsu `ninja` in for `attacker`, once it's unblocked, and resolve it. */
function sneak(game: Game, ninja: ObjectId, zone: "hand" | "command" = "hand"): void {
  game.dispatch({ type: "activate-ability", player: A, source: ninja, abilityIndex: ninjutsuIndex(game, ninja, zone), targets: [] });
  settle(game);
}

const legalCast = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((a) => (a.kind === "cast-spell" || a.kind === "play-land") && a.card === card);

describe("the ninjas", () => {
  it("Yuriko's commander ninjutsu works from the command zone, and her trigger drains by the revealed card", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 1);
    lands(game, "Swamp", 1);
    const yuriko = game.debugSpawn("Yuriko, the Tiger's Shadow", A, "command");
    const giant = toLibrary(game, "Hill Giant");
    toBlocks(game, a, [bears]);
    sneak(game, yuriko, "command");
    expect(zone(game, yuriko)).toBe("battlefield");
    expect(game.state.objects[yuriko].attacking).toBe(B);
    toStep(game, "postcombat-main");
    settle(game);
    // 1 combat damage, then 4 for Hill Giant's mana value.
    expect(life(game, B)).toBe(15);
    expect(zone(game, giant)).toBe("hand");
  });

  it("Silver-Fur Master makes your ninjutsu cost {1} less, and pumps your other Ninjas and Rogues", () => {
    const { game, a } = table();
    spawn(game, "Silver-Fur Master");
    const bears = spawn(game, "Grizzly Bears");
    // Ninja of the Deep Hours' {1}{U} for {U} alone.
    lands(game, "Island", 1);
    const ninja = toHand(game, "Ninja of the Deep Hours");
    toBlocks(game, a, [bears]);
    sneak(game, ninja);
    expect(zone(game, ninja)).toBe("battlefield");
    expect(pt(game, ninja)).toEqual({ power: 3, toughness: 3 });
  });

  it("Sakashima's Student may enter as a copy, a Ninja too, and still enters attacking", () => {
    const { game, a } = table();
    spawn(game, "Hill Giant", B);
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 2);
    const student = toHand(game, "Sakashima's Student");
    a.chooseCopyFn = (_view, _source, options) => options.find((o) => game.state.objects[o].cardName === "Hill Giant") ?? null;
    toBlocks(game, a, [bears]);
    sneak(game, student);
    expect(zone(game, student)).toBe("battlefield");
    expect(pt(game, student)).toEqual({ power: 3, toughness: 3 });
    expect(subtypes(game, student)).toEqual(expect.arrayContaining(["Giant", "Ninja"]));
    expect(game.state.objects[student].attacking).toBe(B);
  });

  it("Fallen Shinobi lets you play the top two of their library free this turn", () => {
    const { game, a } = table();
    const shinobi = spawn(game, "Fallen Shinobi");
    const giant = toLibrary(game, "Hill Giant", B);
    const forest = toLibrary(game, "Forest", B);
    toBlocks(game, a, [shinobi]);
    toStep(game, "postcombat-main");
    settle(game);
    expect(zone(game, giant)).toBe("exile");
    expect(zone(game, forest)).toBe("exile");
    // No lands on Alice's side: the Giant only free.
    expect(legalCast(game, giant)).toBe(true);
    expect(legalCast(game, forest)).toBe(true);
  });

  it("Skullsnatcher exiles up to two cards from the damaged player's graveyard only", () => {
    const { game, a } = table();
    const snatcher = spawn(game, "Skullsnatcher");
    const theirs = [toGraveyard(game, "Grizzly Bears", B), toGraveyard(game, "Hill Giant", B)];
    const mine = toGraveyard(game, "Llanowar Elves");
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, legal) => {
      offered = legal[0] ?? [];
      return [...theirs.map((t) => ({ kind: "object", object: t }) as const)];
    };
    toBlocks(game, a, [snatcher]);
    toStep(game, "postcombat-main");
    settle(game);
    expect(offered.map((t) => (t.kind === "object" ? t.object : null))).not.toContain(mine);
    expect(theirs.map((t) => zone(game, t))).toEqual(["exile", "exile"]);
  });

  it("Throat Slitter destroys a nonblack creature the damaged player controls", () => {
    const { game, a } = table();
    const slitter = spawn(game, "Throat Slitter");
    const giant = spawn(game, "Hill Giant", B);
    spawn(game, "Vampire Nighthawk", B, { tapped: true });
    pickTargets(a, giant);
    toBlocks(game, a, [slitter]);
    toStep(game, "postcombat-main");
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
  });

  it("Prosperous Thief makes one Treasure per player for a batch of Ninjas and Rogues", () => {
    const { game, a } = table();
    const thief = spawn(game, "Prosperous Thief");
    const other = spawn(game, "Ninja of the Deep Hours");
    pickModes(a);
    toBlocks(game, a, [thief, other]);
    toStep(game, "postcombat-main");
    settle(game);
    expect(tokensNamed(game, "Treasure Token", A)).toBe(1);
  });

  it("Moon-Circuit Hacker discards after its draw unless it entered this turn", () => {
    const { game, a } = table();
    const bears = spawn(game, "Grizzly Bears");
    lands(game, "Island", 1);
    const hacker = toHand(game, "Moon-Circuit Hacker");
    toBlocks(game, a, [bears]);
    sneak(game, hacker);
    pickModes(a, 0);
    const before = hand(game).length;
    toStep(game, "postcombat-main");
    settle(game);
    // Entered this turn by ninjutsu: the draw, and no discard.
    expect(hand(game).length).toBe(before + 1);
    expect(graveyard(game)).toHaveLength(0);
  });
});
