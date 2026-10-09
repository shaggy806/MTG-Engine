/**
 * Reign of Dragons precon (FDC), batch 1 — the cards the existing vocabulary
 * runs: Breath Weapon, Shivan Devastator, Count on Luck, Firespitter Whelp,
 * Skyline Despot, Dragonstorm Globe, Outpost Siege, Bitter Reunion, Orb of
 * Dragonkind, Hellkite Charger and Hit the Mother Lode (discover 10 as a
 * `reveal-until` + `cast-now`).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => game.advanceUntil(quiet);
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const toHand = (game: Game, name: string, player: PlayerId = A): ObjectId => game.debugSpawn(name, player, "hand");
const cast = (game: Game, card: ObjectId, more: { xValue?: number } = {}): void => {
  game.dispatch({ type: "cast-spell", player: A, card, targets: [], ...more });
  settle(game);
};
/** Put `names` on top of `player`'s library, the first one on top. */
const stackLibrary = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  [...names].reverse().map((name) => game.debugSpawn(name, player, "library")).reverse();
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const named = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player);
const tokenCount = (game: Game, name: string, player: PlayerId = A): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const power = (game: Game, id: ObjectId): number => computeCharacteristics(game.state, game.registry, id).power;
const counters = (game: Game, id: ObjectId): number => game.state.objects[id].counters?.["+1/+1"] ?? 0;

describe("Breath Weapon", () => {
  it("deals 2 damage to each non-Dragon creature, sparing Dragons", () => {
    const { game } = setUp();
    lands(game, "Mountain", 3);
    const bears = spawn(game, "Grizzly Bears", B);
    const whelp = spawn(game, "Firespitter Whelp", B);
    cast(game, toHand(game, "Breath Weapon"));
    expect(zone(game, bears)).toBe("graveyard");
    // A 2/2 Dragon would have died to 2 damage.
    expect(zone(game, whelp)).toBe("battlefield");
  });
});

describe("Shivan Devastator", () => {
  it("enters with X +1/+1 counters and can attack at once", () => {
    const { game } = setUp();
    lands(game, "Mountain", 4);
    const devastator = toHand(game, "Shivan Devastator");
    cast(game, devastator, { xValue: 3 });
    expect(zone(game, devastator)).toBe("battlefield");
    expect(counters(game, devastator)).toBe(3);
    expect(power(game, devastator)).toBe(3);
  });
});

describe("Firespitter Whelp", () => {
  it("pings each opponent for a noncreature spell or a Dragon spell, not a non-Dragon creature", () => {
    const { game } = setUp();
    lands(game, "Mountain", 10);
    spawn(game, "Firespitter Whelp");
    cast(game, toHand(game, "Hill Giant"));
    expect(life(game, B)).toBe(20);
    cast(game, toHand(game, "Bitter Reunion"));
    expect(life(game, B)).toBe(19);
    cast(game, toHand(game, "Firespitter Whelp"));
    expect(life(game, B)).toBe(18);
  });
});

describe("Skyline Despot", () => {
  it("makes you the monarch, then a Dragon each upkeep only while you still are", () => {
    const { game } = setUp();
    enter(game, "Skyline Despot");
    settle(game);
    expect(game.state.monarch).toBe(A);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(tokenCount(game, "Dragon Token")).toBe(1);
    game.state.monarch = B;
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "draw");
    expect(tokenCount(game, "Dragon Token")).toBe(1);
  });
});

describe("Dragonstorm Globe", () => {
  it("gives each Dragon you control an additional +1/+1 counter as it enters, only yours and only Dragons", () => {
    const { game } = setUp();
    spawn(game, "Dragonstorm Globe");
    const mine = enter(game, "Firespitter Whelp");
    const bears = enter(game, "Grizzly Bears");
    const theirs = enter(game, "Firespitter Whelp", B);
    settle(game);
    expect(counters(game, mine)).toBe(1);
    expect(counters(game, bears)).toBe(0);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("Outpost Siege", () => {
  it("Dragons: 1 damage to any target when a creature you control leaves", () => {
    const { game, a } = setUp();
    a.chooseCreatureTypeFn = () => "Dragons";
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    lands(game, "Mountain", 7);
    cast(game, toHand(game, "Outpost Siege"));
    const bears = spawn(game, "Grizzly Bears");
    cast(game, toHand(game, "Breath Weapon"));
    expect(zone(game, bears)).toBe("graveyard");
    expect(life(game, B)).toBe(19);
    // Not the Khans ability: nothing exiled in the upkeep.
    const exiled = game.state.zones.shared.exile.length;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.zones.shared.exile.length).toBe(exiled);
  });

  it("Khans: exiles the top card each upkeep, playable that turn only; no damage trigger", () => {
    const { game, a } = setUp();
    a.chooseCreatureTypeFn = () => "Khans";
    lands(game, "Mountain", 7);
    cast(game, toHand(game, "Outpost Siege"));
    spawn(game, "Grizzly Bears");
    cast(game, toHand(game, "Breath Weapon"));
    expect(life(game, B)).toBe(20);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].impulse !== undefined);
    expect(exiled).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 4);
    expect(game.state.zones.shared.exile.filter((id) => game.state.objects[id].impulse !== undefined)).toHaveLength(0);
  });

  it("Dragons: leaving along with the creatures, it looks back at its chosen side (603.10a)", () => {
    const { game, a } = setUp();
    a.chooseCreatureTypeFn = () => "Dragons";
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    lands(game, "Mountain", 4);
    lands(game, "Plains", 6);
    const siege = toHand(game, "Outpost Siege");
    cast(game, siege);
    const bears = [spawn(game, "Grizzly Bears"), spawn(game, "Grizzly Bears")];
    // Akroma's Vengeance destroys the Siege and both Bears at once: each
    // Bears' leaving triggers it as it last existed, "Dragons" and all.
    cast(game, toHand(game, "Akroma's Vengeance"));
    expect(zone(game, siege)).toBe("graveyard");
    for (const id of bears) expect(zone(game, id)).toBe("graveyard");
    expect(life(game, B)).toBe(18);
  });
});

describe("Count on Luck", () => {
  it("exiles the top card each upkeep and lets you play it this turn", () => {
    const { game } = setUp();
    spawn(game, "Count on Luck");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].impulse !== undefined);
    expect(exiled).toHaveLength(1);
    expect(game.legalActions(A).some((x) => x.kind === "play-land" && x.card === exiled[0])).toBe(true);
  });
});

describe("Bitter Reunion", () => {
  it("discarding a card draws two", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [0];
    lands(game, "Mountain", 2);
    const reunion = toHand(game, "Bitter Reunion");
    const before = game.handOf(A).length;
    cast(game, reunion);
    // Reunion left the hand, one card was discarded, two drawn.
    expect(game.handOf(A).length).toBe(before - 1 - 1 + 2);
  });

  it("with no card to discard, draws nothing", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [0];
    lands(game, "Mountain", 2);
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" });
    const reunion = toHand(game, "Bitter Reunion");
    cast(game, reunion);
    expect(game.handOf(A)).toHaveLength(0);
  });

  it("{1}, sacrifice: creatures you control gain haste", () => {
    const { game } = setUp();
    lands(game, "Mountain", 1);
    const reunion = spawn(game, "Bitter Reunion");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.dispatch({ type: "activate-ability", player: A, source: reunion, abilityIndex: 0, targets: [] });
    settle(game);
    expect(zone(game, reunion)).toBe("graveyard");
    expect(computeCharacteristics(game.state, game.registry, bears).keywords).toContain("haste");
  });
});

describe("Orb of Dragonkind", () => {
  it("its mana pays for a Dragon spell but not a non-Dragon one", () => {
    const { game } = setUp();
    spawn(game, "Orb of Dragonkind");
    lands(game, "Mountain", 2);
    const whelp = toHand(game, "Firespitter Whelp");
    const treason = toHand(game, "Act of Treason");
    spawn(game, "Grizzly Bears", B);
    const castable = (card: ObjectId): boolean =>
      game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);
    // Two Mountains alone can't make three; the Orb's two can't go on Act of Treason.
    expect(castable(treason)).toBe(false);
    expect(castable(whelp)).toBe(true);
    cast(game, whelp);
    expect(zone(game, whelp)).toBe("battlefield");
  });

  it("sacrificed, finds a Dragon card among the top seven and bottoms the rest", () => {
    const { game, a } = setUp();
    stackLibrary(game, ["Wastes", "Grizzly Bears", "Shivan Dragon", "Wastes"]);
    const orb = spawn(game, "Orb of Dragonkind");
    lands(game, "Mountain", 1);
    let eligibleNames: string[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      eligibleNames = eligible.map((id) => game.state.objects[id].cardName);
      return eligible.slice(0, 1);
    };
    const library = game.state.zones.perPlayer[A].library;
    const topSeven = library.slice(0, 7);
    game.dispatch({ type: "activate-ability", player: A, source: orb, abilityIndex: 1, targets: [] });
    settle(game);
    expect(eligibleNames).toEqual(["Shivan Dragon"]);
    expect(zone(game, orb)).toBe("graveyard");
    const dragon = topSeven.find((id) => game.state.objects[id].cardName === "Shivan Dragon")!;
    expect(zone(game, dragon)).toBe("hand");
    const rest = game.state.zones.perPlayer[A].library;
    expect(rest.slice(-6).sort()).toEqual(topSeven.filter((id) => id !== dragon).sort());
  });
});

describe("Hellkite Charger", () => {
  const attack = (game: Game, attackers: readonly ObjectId[]): void => {
    game.advanceUntil((s) => s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: attackers.map((attacker) => ({ attacker, defender: B })),
    });
    settle(game);
  };

  it("paying {5}{R}{R} untaps all attackers and adds a combat phase straight after this one", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [0];
    lands(game, "Mountain", 7);
    const charger = spawn(game, "Hellkite Charger");
    const bears = spawn(game, "Grizzly Bears");
    // The second combat: both attack again (no Mountains are left to pay a
    // second time). No main phase comes between the two (the third ruling).
    const stepsBetween: string[] = [];
    a.declareAttackersFn = (view) => {
      stepsBetween.push(view.state.turn.step);
      return [charger, bears].map((attacker) => ({ attacker, defender: B }));
    };
    attack(game, [charger, bears]);
    expect(game.state.objects[charger].tapped).toBe(false);
    expect(game.state.objects[bears].tapped).toBe(false);
    const seen: string[] = [];
    game.advanceUntil((s) => {
      seen.push(s.turn.step);
      return s.turn.step === "postcombat-main";
    });
    expect(stepsBetween).toEqual(["declare-attackers"]);
    // Straight from the first combat's end into the second, no main phase between.
    const second = seen.indexOf("declare-attackers");
    expect(second).toBeGreaterThan(-1);
    expect(seen.slice(0, second)).not.toContain("postcombat-main");
    // 7 the first combat, 7 the second.
    expect(life(game, B)).toBe(6);
  });

  it("declined, nothing untaps and there's no extra combat", () => {
    const { game, a } = setUp();
    a.chooseModesFn = () => [];
    lands(game, "Mountain", 7);
    const charger = spawn(game, "Hellkite Charger");
    attack(game, [charger]);
    expect(game.state.objects[charger].tapped).toBe(true);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.turn.step === "postcombat-main");
    expect(game.state.turn.step).toBe("postcombat-main");
  });
});

describe("Hit the Mother Lode", () => {
  it("discovers 10: casts the card free, then makes tapped Treasures for the difference; the rest go to the bottom", () => {
    const { game, a } = setUp();
    stackLibrary(game, ["Wastes", "Wastes", "Divination"]);
    lands(game, "Mountain", 7);
    a.chooseCastNowFn = (_view, offer) => ({
      type: "cast-spell",
      player: A,
      card: offer.cards[0],
      targets: [],
      via: "effect",
      free: true,
    });
    const library = game.state.zones.perPlayer[A].library;
    const [w1, w2, divination] = library.slice(0, 3);
    const hand = game.handOf(A).length;
    cast(game, toHand(game, "Hit the Mother Lode"));
    expect(zone(game, divination)).toBe("graveyard");
    // Divination drew two; the sorcery itself left the hand.
    expect(game.handOf(A).length).toBe(hand + 2);
    const treasures = named(game, "Treasure Token");
    expect(tokenCount(game, "Treasure Token")).toBe(7);
    expect(treasures.every((id) => game.state.objects[id].tapped)).toBe(true);
    const rest = game.state.zones.perPlayer[A].library;
    expect(rest.slice(-2).sort()).toEqual([w1, w2].sort());
  });

  it("not cast, the card goes to your hand and the Treasures still come", () => {
    const { game } = setUp();
    stackLibrary(game, ["Wastes", "Shivan Dragon"]);
    lands(game, "Mountain", 7);
    const dragon = game.state.zones.perPlayer[A].library[1];
    cast(game, toHand(game, "Hit the Mother Lode"));
    expect(zone(game, dragon)).toBe("hand");
    expect(tokenCount(game, "Treasure Token")).toBe(4);
  });
});
