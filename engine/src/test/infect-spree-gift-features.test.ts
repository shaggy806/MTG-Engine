/**
 * The cards infect, wither, spree and gift unblocked, beyond what
 * `infect.test.ts`, `spree.test.ts` and `gift.test.ts` already walk through:
 * one focused check per card whose behaviour is more than a stat line.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(48).fill("Wastes") },
      { player: B, cards: Array<string>(48).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
/** State-based actions, then whatever they put on the stack resolved. */
const settle = (game: Game): void => {
  const holder = game.state.priority.holder as PlayerId;
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(holder);
  game.advanceUntil(quiet);
};
const spawn = (game: Game, name: string, who: PlayerId = A): ObjectId =>
  game.debugSpawn(name, who, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const toHand = (game: Game, name: string): ObjectId => game.debugSpawn(name, A, "hand");
const poisonOf = (game: Game, who: PlayerId): number => game.state.players[who].counters.poison ?? 0;
const named = (game: Game, name: string, who?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && (who === undefined || game.state.objects[id].controller === who),
  );
const attackWith = (game: Game, a: ScriptedController, attackers: readonly ObjectId[]): void => {
  a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
  game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
};

describe("infect cards", () => {
  it("Inkmoth Nexus becomes a 1/1 flying infect creature that gives poison", () => {
    const { game, a } = setUp();
    lands(game, "Wastes", 1);
    const nexus = spawn(game, "Inkmoth Nexus");
    game.state.objects[nexus].enteredBattlefieldOnTurn = 0;
    game.dispatch({ type: "activate-ability", player: A, source: nexus, abilityIndex: 1, targets: [] });
    game.advanceUntil(quiet);
    const c = game.characteristics(nexus);
    expect(c.types).toEqual(expect.arrayContaining(["land", "artifact", "creature"]));
    expect(c.keywords.has("infect")).toBe(true);
    expect(c.keywords.has("flying")).toBe(true);
    attackWith(game, a, [nexus]);
    expect(poisonOf(game, B)).toBe(1);
    expect(game.state.players[B].life).toBe(20);
  });

  it("Tainted Strike: +1/+0 and infect until end of turn", () => {
    const { game, a } = setUp();
    lands(game, "Swamp", 1);
    const bears = spawn(game, "Grizzly Bears");
    const strike = toHand(game, "Tainted Strike");
    game.dispatch({ type: "cast-spell", player: A, card: strike, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    attackWith(game, a, [bears]);
    expect(poisonOf(game, B)).toBe(3);
    expect(game.state.players[B].life).toBe(20);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.characteristics(bears).keywords.has("infect")).toBe(false);
  });

  it("Triumph of the Hordes: your creatures get +1/+1, trample and infect", () => {
    const { game } = setUp();
    lands(game, "Forest", 4);
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Triumph of the Hordes"), targets: [] });
    game.advanceUntil(quiet);
    const c = game.characteristics(bears);
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.keywords.has("trample") && c.keywords.has("infect")).toBe(true);
    expect(game.characteristics(theirs).keywords.has("infect")).toBe(false);
  });

  it("Phyresis gives the enchanted creature infect", () => {
    const { game } = setUp();
    lands(game, "Swamp", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Phyresis"), targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(game.characteristics(bears).keywords.has("infect")).toBe(true);
  });

  it("Skithiryx: {B} for haste, {B}{B} to regenerate", () => {
    const { game } = setUp();
    lands(game, "Swamp", 3);
    const dragon = game.debugSpawn("Skithiryx, the Blight Dragon", A, "battlefield");
    game.dispatch({ type: "activate-ability", player: A, source: dragon, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.characteristics(dragon).keywords.has("haste")).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: dragon, abilityIndex: 1, targets: [] });
    game.advanceUntil(quiet);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(dragon)]);
    settle(game);
    expect(game.state.objects[dragon].zone).toBe("battlefield");
  });

  it("Ichor Rats: each player gets a poison counter as it enters", () => {
    const { game } = setUp();
    lands(game, "Swamp", 3);
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Ichor Rats"), targets: [] });
    game.advanceUntil(quiet);
    expect([poisonOf(game, A), poisonOf(game, B)]).toEqual([1, 1]);
  });

  it("Phyrexian Swarmlord: an infect Insect per poison counter your opponents have", () => {
    const { game } = setUp();
    spawn(game, "Phyrexian Swarmlord");
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 3, who: "each-opponent" });
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 2, who: "you" });
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    const insects = named(game, "Phyrexian Insect Token", A);
    const count = insects.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(count).toBe(3);
    expect(game.characteristics(insects[0]).keywords.has("infect")).toBe(true);
  });
});

describe("wither cards", () => {
  it("Massacre Girl, Known Killer: your creatures have wither; a 0-toughness death draws", () => {
    const { game } = setUp();
    spawn(game, "Massacre Girl, Known Killer");
    const bears = spawn(game, "Grizzly Bears");
    expect(game.characteristics(bears).keywords.has("wither")).toBe(true);
    const theirs = spawn(game, "Grizzly Bears", B);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 2 }, [obj(theirs)], { source: bears });
    settle(game);
    // Two -1/-1 counters: a 0/0, dead of 0 toughness — "less than 1".
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("Massacre Girl, Known Killer: a creature dying of marked damage draws nothing", () => {
    const { game } = setUp();
    spawn(game, "Massacre Girl, Known Killer");
    const theirs = spawn(game, "Grizzly Bears", B);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)]);
    settle(game);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.handOf(A).length).toBe(hand);
  });

  it("Necroskitter: an opponent's creature with a -1/-1 counter that dies comes back as yours", () => {
    const { game, a } = setUp();
    const skitter = spawn(game, "Necroskitter");
    const theirs = spawn(game, "Grizzly Bears", B);
    a.chooseModesFn = () => [0];
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 1 }, [obj(theirs)], { source: skitter });
    settle(game);
    expect(game.state.objects[theirs].counters["-1/-1"]).toBe(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
    if (game.state.awaiting?.kind === "choose-modes") game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    const back = named(game, "Grizzly Bears", A);
    expect(back).toHaveLength(1);
    // A new object, without the counter (the ruling).
    expect(game.state.objects[back[0]].counters["-1/-1"] ?? 0).toBe(0);
  });

  it("Midnight Banshee: a -1/-1 counter on each nonblack creature in your upkeep", () => {
    const { game } = setUp();
    spawn(game, "Midnight Banshee");
    const bears = spawn(game, "Grizzly Bears", B);
    const zombie = spawn(game, "Necroskitter", B);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.objects[bears].counters["-1/-1"]).toBe(1);
    expect(game.state.objects[zombie].counters["-1/-1"] ?? 0).toBe(0);
  });
});

describe("gift cards", () => {
  it("Long River's Pull: a creature spell unpromised, any spell promised", () => {
    const { game } = setUp();
    lands(game, "Island", 4);
    const pull = toHand(game, "Long River's Pull");
    // A noncreature spell of Bob's on the stack: only the promised Pull,
    // which counters any spell, can target it.
    const ring = game.debugSpawn("Sol Ring", B, "stack");
    const offers = game.legalActions(A).filter((o) => o.kind === "cast-spell" && o.card === pull);
    const plain = offers.find((o) => o.kind === "cast-spell" && o.kicked !== true);
    const promised = offers.find((o) => o.kind === "cast-spell" && o.kicked === true);
    expect(plain).toBeUndefined();
    expect(promised?.kind === "cast-spell" ? promised.targetOptions[0] : []).toContainEqual(obj(ring));
  });

  it("Wear Down promised: two artifacts and/or enchantments", () => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    const ring = spawn(game, "Sol Ring", B);
    const study = spawn(game, "Rhystic Study", B);
    const wear = toHand(game, "Wear Down");
    game.dispatch({ type: "cast-spell", player: A, card: wear, targets: [obj(ring), obj(study)], kicked: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("graveyard");
    expect(game.state.objects[study].zone).toBe("graveyard");
  });

  it("Peerless Recycling promised: two permanent cards back to hand", () => {
    const { game } = setUp();
    lands(game, "Forest", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    const recycling = toHand(game, "Peerless Recycling");
    game.dispatch({ type: "cast-spell", player: A, card: recycling, targets: [obj(bears), obj(ring)], kicked: true });
    game.advanceUntil(quiet);
    expect(game.handOf(A)).toEqual(expect.arrayContaining([bears, ring]));
  });

  it("Sazacap's Brew promised: a creature of yours gets +2/+0 too", () => {
    const { game } = setUp();
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears");
    const brew = toHand(game, "Sazacap's Brew");
    const fodder = toHand(game, "Wastes");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: brew,
      targets: [player(A), obj(bears)],
      kicked: true,
    });
    game.advanceUntil((s) => s.awaiting?.kind === "discard" || quiet(s));
    if (game.state.awaiting?.kind === "discard") game.dispatch({ type: "discard", player: A, cards: [fodder] });
    game.advanceUntil(quiet);
    expect(game.characteristics(bears).power).toBe(4);
    expect(named(game, "Fish Token", B)).toHaveLength(1);
  });

  it("Coiling Rebirth promised: back, plus a 1/1 token copy of a nonlegendary creature", () => {
    const { game } = setUp();
    lands(game, "Swamp", 5);
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const rebirth = toHand(game, "Coiling Rebirth");
    const theirs = game.handOf(B).length;
    game.dispatch({ type: "cast-spell", player: A, card: rebirth, targets: [obj(giant)], kicked: true });
    game.advanceUntil(quiet);
    expect(game.handOf(B).length).toBe(theirs + 1);
    const giants = named(game, "Hill Giant", A);
    expect(giants).toHaveLength(2);
    const token = giants.find((id) => game.state.objects[id].isToken);
    expect(token).toBeDefined();
    expect([game.characteristics(token!).power, game.characteristics(token!).toughness]).toEqual([1, 1]);
  });

  it("Coiling Rebirth: no copy of a legendary creature, nor unpromised", () => {
    const { game } = setUp();
    lands(game, "Swamp", 10);
    const legend = game.debugSpawn("Skithiryx, the Blight Dragon", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Coiling Rebirth"), targets: [obj(legend)], kicked: true });
    game.advanceUntil(quiet);
    // No copy made at all — not one the legend rule then took.
    expect(game.eventsOfType("permanent-copied")).toHaveLength(0);
    expect(named(game, "Skithiryx, the Blight Dragon", A)).toHaveLength(1);
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    game.dispatch({ type: "cast-spell", player: A, card: toHand(game, "Coiling Rebirth"), targets: [obj(giant)] });
    game.advanceUntil(quiet);
    expect(named(game, "Hill Giant", A)).toHaveLength(1);
  });

  it("Octomancer promised: they get an 8/8 Octopus, and it copies a token that entered this turn", () => {
    const { game } = setUp();
    lands(game, "Forest", 3);
    lands(game, "Island", 2);
    const mancer = toHand(game, "Octomancer");
    game.dispatch({ type: "cast-spell", player: A, card: mancer, targets: [], kicked: true });
    game.advanceUntil((s) => quiet(s) && s.zones.shared.battlefield.includes(mancer));
    const octopus = named(game, "Octopus Token", B);
    expect(octopus).toHaveLength(1);
    expect([game.characteristics(octopus[0]).power, game.characteristics(octopus[0]).toughness]).toEqual([8, 8]);
    // At the end step it copies a creature token that entered this turn —
    // the only one is Bob's Octopus.
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    expect(named(game, "Octopus Token", A)).toHaveLength(1);
  });
});
