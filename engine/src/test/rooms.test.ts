/**
 * Rooms (rule 709.5): split enchantments whose halves are doors. The half
 * cast enters unlocked (709.5d), a locked door is unlocked by paying its mana
 * cost as a sorcery (a special action, 709.5e) or by an effect (709.5f), a
 * locked door's name, mana cost and text aren't the permanent's (709.5), and
 * "when you unlock this door" / "fully unlock" trigger as it happens
 * (709.5h, i). Written on the shared table in `harness.ts`.
 */
import { describe, expect, it } from "vitest";

import type { Game } from "../game.js";
import type { ObjectId } from "../primitives.js";
import { matchesFilter } from "../filter.js";
import { LOCKED_ROOM, nameOf } from "../state.js";

import type { TargetRef } from "../target.js";

import {
  A,
  B,
  activate,
  cast,
  enter,
  hand,
  lands,
  life,
  pickModes,
  pickTargets,
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

const ROOM = "Bottomless Pool // Locker Room";

const unlockOffers = (game: Game, room: ObjectId): readonly string[] =>
  game
    .legalActions(A)
    .flatMap((a) => (a.kind === "unlock-door" && a.permanent === room ? [`${a.door} ${a.doorName} ${a.cost}`] : []));

/** Whether `id`'s mana value is `n`, as a filter reads it. */
const manaValueIs = (game: Game, id: ObjectId, n: number): boolean =>
  matchesFilter(game.state, game.registry, id, { manaValue: { op: "eq", n } }, { you: A });

const unlock = (game: Game, room: ObjectId, door: "left" | "right"): void => {
  game.dispatch({ type: "unlock-door", player: A, permanent: room, door });
};

describe("Rooms", () => {
  it("enters with the door cast unlocked, which triggers 'when you unlock this door'", () => {
    const { game, a } = table();
    lands(game, "Island", 1);
    const bears = spawn(game, "Grizzly Bears", B);
    pickTargets(a, bears);
    const room = toHand(game, ROOM);
    game.dispatch({ type: "cast-spell", player: A, card: room, face: 1, targets: [] });
    settle(game);
    expect(zone(game, room)).toBe("battlefield");
    expect(game.state.objects[room].doors).toEqual({ left: true, right: false });
    expect(zone(game, bears)).toBe("hand");
    // It's Bottomless Pool alone: that name, that cost.
    expect(nameOf(game.state.objects[room])).toBe("Bottomless Pool");
    expect(manaValueIs(game, room, 1)).toBe(true);
  });

  it("unlocks the other door as a sorcery for its mana cost, gaining its text", () => {
    const { game, a } = table();
    lands(game, "Island", 6);
    pickTargets(a, null);
    const room = toHand(game, ROOM);
    game.dispatch({ type: "cast-spell", player: A, card: room, face: 1, targets: [] });
    settle(game);
    expect(unlockOffers(game, room)).toEqual(["right Locker Room {4}{U}"]);
    unlock(game, room, "right");
    expect(game.state.objects[room].doors).toEqual({ left: true, right: true });
    expect(nameOf(game.state.objects[room])).toBe(ROOM);
    // Fully unlocked: Locker Room's draw on combat damage.
    expect(game.state.eventLog.some((e) => e.type === "door-unlocked" && e.door === "right" && e.fully)).toBe(true);
    const bears = spawn(game, "Grizzly Bears");
    const before = hand(game).length;
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    toStep(game, "postcombat-main");
    settle(game);
    expect(hand(game).length).toBe(before + 1);
  });

  it("put onto the battlefield without being cast, it has both doors locked: no name, cost or text", () => {
    const { game } = table();
    lands(game, "Island", 6);
    const room = toGraveyard(game, ROOM);
    // In the graveyard it's the whole card (rule 709.4): mana value 6.
    expect(manaValueIs(game, room, 6)).toBe(true);
    game.debugMove(room, "battlefield");
    expect(game.state.objects[room].doors).toEqual({ left: false, right: false });
    expect(nameOf(game.state.objects[room])).toBe(LOCKED_ROOM);
    expect(manaValueIs(game, room, 0)).toBe(true);
    expect(unlockOffers(game, room)).toEqual(["left Bottomless Pool {U}", "right Locker Room {4}{U}"]);
  });

  it("a locked door's abilities don't function: Locker Room doesn't draw while locked", () => {
    const { game, a } = table();
    lands(game, "Island", 1);
    pickTargets(a, null);
    const room = toHand(game, ROOM);
    game.dispatch({ type: "cast-spell", player: A, card: room, face: 1, targets: [] });
    settle(game);
    const bears = spawn(game, "Grizzly Bears");
    const before = hand(game).length;
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    toStep(game, "postcombat-main");
    settle(game);
    expect(hand(game).length).toBe(before);
  });

  it("can't be unlocked outside your main phase with the stack empty", () => {
    const { game, a } = table();
    lands(game, "Island", 6);
    pickTargets(a, null);
    const room = toHand(game, ROOM);
    game.dispatch({ type: "cast-spell", player: A, card: room, face: 1, targets: [] });
    settle(game);
    toStep(game, "upkeep");
    expect(unlockOffers(game, room)).toEqual([]);
    expect(() => unlock(game, room, "right")).toThrow(/main phase/);
  });
});

/** Cast `room`'s `face` half from hand (lands assumed) and resolve it. */
function castDoor(game: Game, name: string, face: 1 | 2, targets: readonly TargetRef[] = []): ObjectId {
  const room = toHand(game, name);
  game.dispatch({ type: "cast-spell", player: A, card: room, face, targets });
  settle(game);
  return room;
}

describe("the Rooms", () => {
  it("Unholy Annex makes you lose 2 without a Demon; Ritual Chamber's Demon turns it into a drain", () => {
    const { game } = table();
    lands(game, "Swamp", 8);
    const annex = castDoor(game, "Unholy Annex // Ritual Chamber", 1);
    toStep(game, "end");
    settle(game);
    expect(life(game, A)).toBe(18);
    toStep(game, "precombat-main");
    unlock(game, annex, "right");
    settle(game);
    expect(tokensNamed(game, "Demon Token", A)).toBe(1);
    toStep(game, "end");
    settle(game);
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(18);
  });

  it("Restricted Office destroys every creature with power 3 or greater as it's cast", () => {
    const { game } = table();
    lands(game, "Plains", 4);
    const giant = spawn(game, "Hill Giant", B);
    const bears = spawn(game, "Grizzly Bears", B);
    castDoor(game, "Restricted Office // Lecture Hall", 1);
    expect(zone(game, giant)).toBe("graveyard");
    expect(zone(game, bears)).toBe("battlefield");
  });

  it("Mirror Room copies a creature you control as a Reflection too", () => {
    const { game, a } = table();
    lands(game, "Island", 3);
    const bears = spawn(game, "Grizzly Bears");
    pickTargets(a, bears);
    castDoor(game, "Mirror Room // Fractured Realm", 1);
    const copies = Object.values(game.state.objects).filter((o) => o.isToken && o.copyOf === "Grizzly Bears");
    expect(copies).toHaveLength(1);
    expect(subtypes(game, copies[0].id)).toEqual(expect.arrayContaining(["Bear", "Reflection"]));
  });

  it("Torture Pit adds 2 to noncombat damage to an opponent, not to their creatures", () => {
    const { game, a } = table();
    lands(game, "Mountain", 6);
    castDoor(game, "Spiked Corridor // Torture Pit", 2);
    const bears = spawn(game, "Hill Giant", B);
    cast(game, toHand(game, "Shock"), { targets: [{ kind: "player", player: B }] });
    expect(life(game, B)).toBe(16);
    pickTargets(a, bears);
    cast(game, toHand(game, "Shock"), { targets: [{ kind: "object", object: bears }] });
    expect(game.state.objects[bears].damageMarked).toBe(2);
  });

  it("Rickety Gazebo mills four and returns up to two permanent cards from among them", () => {
    const { game, a } = table();
    lands(game, "Forest", 4);
    const milled = [
      toLibrary(game, "Shock"),
      toLibrary(game, "Hill Giant"),
      toLibrary(game, "Forest"),
      toLibrary(game, "Grizzly Bears"),
    ];
    const old = toGraveyard(game, "Llanowar Elves");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [milled[1], milled[3]];
    };
    castDoor(game, "Greenhouse // Rickety Gazebo", 2);
    expect(offered).not.toContain(milled[0]);
    expect(offered).not.toContain(old);
    expect([zone(game, milled[1]), zone(game, milled[3])]).toEqual(["hand", "hand"]);
  });

  it("Inquisitive Glimmer takes {1} off an unlock cost", () => {
    const { game, a } = table();
    spawn(game, "Inquisitive Glimmer");
    lands(game, "Island", 1);
    pickTargets(a, null);
    const room = castDoor(game, ROOM, 1);
    expect(unlockOffers(game, room)).toEqual([]);
    lands(game, "Island", 4);
    expect(unlockOffers(game, room)).toEqual(["right Locker Room {3}{U}"]);
  });
});

describe("the cards around Rooms", () => {
  it("Entity Tracker draws for an enchantment entering and for a fully unlocked Room", () => {
    const { game, a } = table();
    spawn(game, "Entity Tracker");
    lands(game, "Island", 6);
    pickTargets(a, null);
    const before = hand(game).length;
    const room = castDoor(game, ROOM, 1);
    // The Room is an enchantment entering: one card. (Its door, not fully.)
    expect(hand(game).length).toBe(before + 1);
    unlock(game, room, "right");
    settle(game);
    expect(hand(game).length).toBe(before + 2);
  });

  it("Victor counts both of eerie's events as one ability's resolutions", () => {
    const { game, a } = table();
    spawn(game, "Victor, Valgavoth's Seneschal");
    lands(game, "Island", 6);
    pickTargets(a, null);
    const bobsHand = () => game.state.zones.perPlayer[B].hand.length;
    const room = castDoor(game, ROOM, 1);
    // First: surveil 2. Second (the unlock, fully): Bob discards.
    const before = bobsHand();
    unlock(game, room, "right");
    settle(game);
    expect(bobsHand()).toBe(before - 1);
  });

  it("Marina Vendrell locks or unlocks a door of target Room, asking which", () => {
    const { game, a } = table();
    const marina = spawn(game, "Marina Vendrell");
    lands(game, "Island", 1);
    pickTargets(a, null);
    const room = castDoor(game, ROOM, 1);
    // Lock Bottomless Pool (mode 0) or unlock Locker Room (mode 1).
    pickModes(a, 1);
    activate(game, marina, 0, { targets: [{ kind: "object", object: room }] });
    expect(game.state.objects[room].doors).toEqual({ left: true, right: true });
  });

  it("Ghostly Dancers can unlock a locked door instead", () => {
    const { game, a } = table();
    lands(game, "Plains", 5);
    const room = toGraveyard(game, ROOM);
    game.debugMove(room, "battlefield");
    pickModes(a, 1);
    a.chooseModesFn = (_view, _min, _max, texts) => [texts.length === 2 && texts[0].startsWith("Return") ? 1 : 0];
    pickTargets(a, null);
    enter(game, "Ghostly Dancers");
    const doors = game.state.objects[room].doors!;
    expect(doors.left || doors.right).toBe(true);
  });
});
