/**
 * Host triggers, second batch: Winged Boots, Bloodforged Battle-Axe, Super
 * State, Sword of Truth and Justice, Kaya's Ghostform, Keen Sense,
 * Overgrowth, Wolfwillow Haven, Rogue's Gloves, Zephyr Boots, Sword of Body
 * and Mind, Sword of Sinew and Steel, Sword of War and Peace, Quietus Spike,
 * Ultima Weapon, Staff of Titania, Wand of Orcus, Adaptive Omnitool, Bilbo's
 * Ring, The Spear of Leonidas, Fiendlash, Sigil of Sleep, Resurrection Orb
 * and Mage Slayer — and an attack trigger's recipient, "the player or
 * planeswalker it's attacking".
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const c = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])) as Record<
    PlayerId,
    ScriptedController
  >;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxHandSize: 99, maxLandsPerTurn: 99 },
    controllers: c,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a: c[A], b: c[B], c };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
const hand = (game: Game, player: PlayerId = A): number => game.state.zones.perPlayer[player].hand.length;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const named = (game: Game, name: string, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === player,
  );
const tokenCount = (game: Game, name: string, player: PlayerId = A): number =>
  named(game, name, player).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const lands = (game: Game, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].controller === player && game.characteristics(id).types.includes("land"),
  );

/** Equip `equipment` to `creature` for real, paid from fresh Wastes. */
const equip = (game: Game, equipment: ObjectId, creature: ObjectId, cost: number, abilityIndex = 0): void => {
  for (let i = 0; i < cost; i++) spawn(game, "Wastes");
  game.dispatch({ type: "activate-ability", player: A, source: equipment, abilityIndex, targets: [obj(creature)] });
  game.advanceUntil(quiet);
  expect(game.state.objects[equipment].attachedTo).toBe(creature);
};
/** Cast the Aura `name` from A's hand onto `host`, paying with `land`s. */
const enchant = (game: Game, name: string, host: ObjectId, land: string, count = 1): ObjectId => {
  for (let i = 0; i < count; i++) spawn(game, land);
  const aura = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card: aura, targets: [obj(host)] });
  game.advanceUntil(quiet);
  expect(game.state.objects[aura].attachedTo).toBe(host);
  return aura;
};
/** A attacks `defender` with `attacker` and the combat plays out. */
const attack = (game: Game, a: ScriptedController, attacker: ObjectId, defender: PlayerId | ObjectId = B): void => {
  a.declareAttackersFn = () => [{ attacker, defender }];
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
};

describe("Winged Boots", () => {
  it("gives flying and ward {4}: an opponent's Bolt that can't pay is countered", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const boots = spawn(game, "Winged Boots", B);
    game.state.objects[boots].attachedTo = bears;
    expect(game.characteristics(bears).keywords).toContain("flying");
    spawn(game, "Mountain");
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].damageMarked).toBe(0);
    expect(zoneOf(game, bolt)).toBe("graveyard");
  });
});

describe("Bloodforged Battle-Axe", () => {
  it("combat damage copies the Equipment, and the copy enters unattached", () => {
    const { game, a } = setUp();
    const axe = spawn(game, "Bloodforged Battle-Axe");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, axe, bears, 2);
    expect(game.characteristics(bears).power).toBe(4);
    attack(game, a, bears);
    const axes = named(game, "Bloodforged Battle-Axe");
    expect(axes.length).toBe(2);
    const copy = axes.find((id) => id !== axe) as ObjectId;
    expect(game.state.objects[copy].isToken).toBe(true);
    expect(game.state.objects[copy].attachedTo).toBeNull();
    expect(game.state.objects[axe].attachedTo).toBe(bears);
  });
});

describe("Super State", () => {
  it("a 9/9 flier; its combat damage to one opponent is dealt to each other opponent too", () => {
    const { game, a } = setUp([A, B, C]);
    const bears = spawn(game, "Grizzly Bears");
    enchant(game, "Super State", bears, "Wastes", 7);
    const c = game.characteristics(bears);
    expect([c.power, c.toughness]).toEqual([9, 9]);
    expect([...c.keywords]).toEqual(expect.arrayContaining(["flying", "first-strike", "trample", "haste"]));
    attack(game, a, bears);
    expect(life(game, B)).toBe(11);
    expect(life(game, C)).toBe(11);
    expect(life(game, A)).toBe(20);
    // The creature dealt the second hit, not the Aura.
    const toC = game.state.eventLog.find(
      (e) => e.type === "damage-dealt" && e.target.kind === "player" && e.target.player === C,
    );
    expect(toC !== undefined && toC.type === "damage-dealt" ? toC.source : null).toBe(bears);
  });
});

describe("Sword of Truth and Justice", () => {
  it("combat damage: a +1/+1 counter on a creature you choose, then proliferate", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Truth and Justice");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    equip(game, sword, bears, 2);
    expect([...game.characteristics(bears).protectionFrom.colors].sort()).toEqual(["U", "W"]);
    let offered: readonly ObjectId[] = [];
    a.choosePermanentsFn = (_view, eligible) => {
      offered = eligible;
      return [elves];
    };
    attack(game, a, bears);
    expect(offered).toEqual(expect.arrayContaining([bears, elves]));
    // One from the Sword, one more from proliferating it.
    expect(game.state.objects[elves].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[bears].counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Kaya's Ghostform", () => {
  it("returns the enchanted creature when it dies, under your control", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const ghost = enchant(game, "Kaya's Ghostform", bears, "Swamp");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(zoneOf(game, bears)).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
    expect(zoneOf(game, ghost)).toBe("graveyard");
  });

  it("returns it when it's exiled, and when both are destroyed at once", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    enchant(game, "Kaya's Ghostform", bears, "Swamp");
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(bears)]);
    settle(game);
    expect(zoneOf(game, bears)).toBe("battlefield");
    const other = spawn(game, "Llanowar Elves");
    enchant(game, "Kaya's Ghostform", other, "Swamp");
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { notTypes: ["land"] } }, []);
    settle(game);
    expect(zoneOf(game, other)).toBe("battlefield");
  });

  it("a card that left its graveyard before the ability resolved stays where it went (rule 400.7)", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    enchant(game, "Kaya's Ghostform", bears, "Swamp");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
    expect(game.state.zones.shared.stack.length).toBe(1);
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("exile");
  });

  it("only enchants a creature or planeswalker you control", () => {
    const { game } = setUp();
    const theirs = spawn(game, "Grizzly Bears", B);
    spawn(game, "Swamp");
    const ghost = game.debugSpawn("Kaya's Ghostform", A, "hand");
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: ghost, targets: [obj(theirs)] }),
    ).toThrow();
  });
});

describe("Keen Sense", () => {
  it("damage to an opponent: you may draw", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    enchant(game, "Keen Sense", bears, "Forest");
    a.chooseModesFn = () => [0];
    const before = hand(game);
    attack(game, a, bears);
    expect(hand(game)).toBe(before + 1);
  });
});

describe("Overgrowth and Wolfwillow Haven", () => {
  it("Overgrowth: the enchanted land adds an additional {G}{G}", () => {
    const { game } = setUp();
    const forest = spawn(game, "Forest");
    enchant(game, "Overgrowth", forest, "Forest", 3);
    game.state.objects[forest].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: forest, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G", "G", "G"]);
  });

  it("Wolfwillow Haven: an extra {G}, and a Wolf for {4}{G} and the Aura — only during your turn", () => {
    const { game } = setUp();
    const forest = spawn(game, "Forest");
    const haven = enchant(game, "Wolfwillow Haven", forest, "Forest", 2);
    game.state.objects[forest].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: forest, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G", "G"]);
    game.state.players[A].manaPool.length = 0;
    for (let i = 0; i < 5; i++) spawn(game, "Forest");
    const wolfAbility = (player: PlayerId) =>
      game.legalActions(player).some((x) => x.kind === "activate-ability" && x.source === haven);
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    expect(wolfAbility(A)).toBe(false);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(wolfAbility(A)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: haven, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(zoneOf(game, haven)).toBe("graveyard");
    expect(tokenCount(game, "Wolf Token")).toBe(1);
  });
});

describe("combat damage card draw", () => {
  it("Rogue's Gloves: may draw", () => {
    const { game, a } = setUp();
    const gloves = spawn(game, "Rogue's Gloves");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, gloves, bears, 2);
    a.chooseModesFn = () => [0];
    const before = hand(game);
    attack(game, a, bears);
    expect(hand(game)).toBe(before + 1);
  });

  it("Zephyr Boots: flying, and draw then discard", () => {
    const { game, a } = setUp();
    const boots = spawn(game, "Zephyr Boots");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, boots, bears, 2);
    expect(game.characteristics(bears).keywords).toContain("flying");
    const before = hand(game);
    const yard = game.state.zones.perPlayer[A].graveyard.length;
    attack(game, a, bears);
    expect(hand(game)).toBe(before);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(yard + 1);
  });
});

describe("Sword of Body and Mind", () => {
  it("combat damage: you create a Wolf and that player mills ten", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Body and Mind");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, sword, bears, 2);
    expect([...game.characteristics(bears).protectionFrom.colors].sort()).toEqual(["G", "U"]);
    const library = game.state.zones.perPlayer[B].library.length;
    attack(game, a, bears);
    expect(tokenCount(game, "Wolf Token")).toBe(1);
    expect(game.state.zones.perPlayer[B].library.length).toBe(library - 10);
  });
});

describe("Sword of Sinew and Steel", () => {
  it("destroys up to one planeswalker and up to one artifact", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Sinew and Steel");
    const bears = spawn(game, "Grizzly Bears");
    const walker = spawn(game, "Ajani, Caller of the Pride", B);
    const ring = spawn(game, "Sol Ring", B);
    equip(game, sword, bears, 2);
    a.chooseTargetsFn = () => [obj(walker), obj(ring)];
    attack(game, a, bears);
    expect(zoneOf(game, walker)).toBe("graveyard");
    expect(zoneOf(game, ring)).toBe("graveyard");
  });

  it("with only an artifact to point at, destroys just that", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of Sinew and Steel");
    const bears = spawn(game, "Grizzly Bears");
    const ring = spawn(game, "Sol Ring", B);
    equip(game, sword, bears, 2);
    // The Sword is an artifact too, so it could name itself.
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0];
      return [obj(ring)];
    };
    attack(game, a, bears);
    expect(offered).toEqual(expect.arrayContaining([obj(ring), obj(sword)]));
    expect(zoneOf(game, ring)).toBe("graveyard");
    expect(zoneOf(game, sword)).toBe("battlefield");
  });
});

describe("Sword of War and Peace", () => {
  it("damage equal to their hand from the Sword, life equal to yours", () => {
    const { game, a } = setUp();
    const sword = spawn(game, "Sword of War and Peace");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, sword, bears, 2);
    const theirs = hand(game, B);
    const mine = hand(game);
    attack(game, a, bears);
    expect(life(game, B)).toBe(20 - 4 - theirs);
    expect(life(game, A)).toBe(20 + mine);
    const hit = game.state.eventLog.find(
      (e) => e.type === "damage-dealt" && e.source === sword && e.target.kind === "player",
    );
    expect(hit !== undefined && hit.type === "damage-dealt" ? hit.amount : 0).toBe(theirs);
  });
});

describe("Quietus Spike", () => {
  it("that player loses half their life, rounded up, after the combat damage", () => {
    const { game, a } = setUp();
    const spike = spawn(game, "Quietus Spike");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, spike, bears, 3);
    expect(game.characteristics(bears).keywords).toContain("deathtouch");
    game.state.players[B].life = 11;
    attack(game, a, bears);
    // 11 - 2 = 9, then half of 9 rounded up is 5.
    expect(life(game, B)).toBe(4);
  });
});

describe("Ultima Weapon", () => {
  it("+7/+7, and attacking destroys target creature an opponent controls", () => {
    const { game, a } = setUp();
    const weapon = spawn(game, "Ultima Weapon");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Llanowar Elves", B);
    equip(game, weapon, bears, 7);
    expect(game.characteristics(bears).power).toBe(9);
    attack(game, a, bears);
    expect(zoneOf(game, theirs)).toBe("graveyard");
    expect(life(game, B)).toBe(11);
  });
});

describe("Staff of Titania", () => {
  it("+X/+X for Forests, and each attack makes a Forest Dryad that counts", () => {
    const { game, a } = setUp();
    const staff = spawn(game, "Staff of Titania");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Forest");
    spawn(game, "Forest");
    equip(game, staff, bears, 3);
    expect(game.characteristics(bears).power).toBe(4);
    attack(game, a, bears);
    const dryads = named(game, "Forest Dryad Token");
    expect(dryads.length).toBe(1);
    const dryad = game.characteristics(dryads[0]);
    expect(dryad.types).toEqual(expect.arrayContaining(["land", "creature"]));
    expect(game.state.objects[dryads[0]].summoningSick).toBe(true);
    expect(game.characteristics(bears).power).toBe(5);
  });
});

describe("Wand of Orcus", () => {
  it("attacking: it and your Zombies gain deathtouch; combat damage makes that many Zombies", () => {
    const { game, a } = setUp();
    const wand = spawn(game, "Wand of Orcus");
    const bears = spawn(game, "Grizzly Bears");
    const zombie = spawn(game, "Zombie Token");
    const theirs = spawn(game, "Zombie Token", B);
    equip(game, wand, bears, 3);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && quiet(s));
    expect(game.characteristics(bears).keywords).toContain("deathtouch");
    expect(game.characteristics(zombie).keywords).toContain("deathtouch");
    expect(game.characteristics(theirs).keywords).not.toContain("deathtouch");
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(tokenCount(game, "Zombie Token")).toBe(1 + 2);
  });

  it("blocking gives deathtouch too", () => {
    const { game, a, b } = setUp();
    const wand = spawn(game, "Wand of Orcus");
    const bears = spawn(game, "Grizzly Bears");
    const attacker = spawn(game, "Grizzly Bears", B);
    equip(game, wand, bears, 3);
    b.declareAttackersFn = () => [{ attacker, defender: A }];
    a.declareBlockersFn = () => [{ blocker: bears, attacker }];
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-blockers" && quiet(s));
    expect(game.characteristics(bears).keywords).toContain("deathtouch");
  });
});

describe("Adaptive Omnitool", () => {
  it("+1/+1 per artifact; attacking may take an artifact from the top six", () => {
    const { game, a } = setUp();
    const tool = spawn(game, "Adaptive Omnitool");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Sol Ring");
    equip(game, tool, bears, 3);
    expect(game.characteristics(bears).power).toBe(4);
    const ring = game.debugSpawn("Sol Ring", A, "library");
    game.state.zones.perPlayer[A].library.splice(game.state.zones.perPlayer[A].library.indexOf(ring), 1);
    game.state.zones.perPlayer[A].library.splice(3, 0, ring);
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return options.slice(0, 1);
    };
    attack(game, a, bears);
    expect(eligible).toEqual([ring]);
    expect(zoneOf(game, ring)).toBe("hand");
    expect(game.state.revealedThisTurn ?? []).toContain(ring);
  });
});

describe("Bilbo's Ring", () => {
  it("hexproof and unblockable during your turn only; attacking alone draws and costs 1 life", () => {
    const { game, a } = setUp();
    const ring = spawn(game, "Bilbo's Ring");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, ring, bears, 4, 1);
    expect([...game.characteristics(bears).keywords]).toEqual(expect.arrayContaining(["hexproof", "unblockable"]));
    const before = hand(game);
    attack(game, a, bears);
    expect(hand(game)).toBe(before + 1);
    expect(life(game, A)).toBe(19);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(game.characteristics(bears).keywords).not.toContain("hexproof");
  });

  it("attacking beside another creature isn't alone", () => {
    const { game, a } = setUp();
    const ring = spawn(game, "Bilbo's Ring");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    equip(game, ring, bears, 4, 1);
    const before = hand(game);
    a.declareAttackersFn = () => [
      { attacker: bears, defender: B },
      { attacker: elves, defender: B },
    ];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(hand(game)).toBe(before);
  });

  it("Equip Halfling {1} only reaches a Halfling", () => {
    const { game } = setUp();
    const ring = spawn(game, "Bilbo's Ring");
    const bears = spawn(game, "Grizzly Bears");
    const bilbo = spawn(game, "Bilbo Baggins, Burglar");
    spawn(game, "Wastes");
    const cheap = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === ring && x.abilityIndex === 0);
    expect(cheap !== undefined && cheap.kind === "activate-ability" ? cheap.targetOptions?.[0] : []).toEqual([
      obj(bilbo),
    ]);
    void bears;
    equip(game, ring, bilbo, 0, 0);
  });
});

describe("The Spear of Leonidas", () => {
  it("Bull Rush: the attacker gains double strike", () => {
    const { game, a } = setUp();
    const spear = spawn(game, "The Spear of Leonidas");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, spear, bears, 2);
    a.chooseModesFn = () => [0];
    attack(game, a, bears);
    expect(life(game, B)).toBe(16);
  });

  it("Summon: Phobos, a legendary 3/2 Horse", () => {
    const { game, a } = setUp();
    const spear = spawn(game, "The Spear of Leonidas");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, spear, bears, 2);
    a.chooseModesFn = () => [1];
    attack(game, a, bears);
    const phobos = named(game, "Phobos");
    expect(phobos.length).toBe(1);
    const c = game.characteristics(phobos[0]);
    expect([c.power, c.toughness]).toEqual([3, 2]);
  });

  it("Revelation: discard two, then draw two", () => {
    const { game, a } = setUp();
    const spear = spawn(game, "The Spear of Leonidas");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, spear, bears, 2);
    a.chooseModesFn = () => [2];
    const before = hand(game);
    const yard = game.state.zones.perPlayer[A].graveyard.length;
    attack(game, a, bears);
    expect(hand(game)).toBe(before);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(yard + 2);
  });
});

describe("Fiendlash", () => {
  it("dealt damage: it deals damage equal to its power to target player", () => {
    const { game, a } = setUp();
    const lash = spawn(game, "Fiendlash");
    const bears = spawn(game, "Grizzly Bears");
    const pinger = spawn(game, "Prodigal Pyromancer", B);
    spawn(game, "Mountain");
    equip(game, lash, bears, 2);
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [obj(bears)], { source: pinger });
    settle(game);
    expect(life(game, B)).toBe(16);
  });

  it("uses its power as it last existed when the damage killed it", () => {
    const { game, a } = setUp();
    const lash = spawn(game, "Fiendlash");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Mountain");
    equip(game, lash, bears, 2);
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    game.debugApplyEffect(B, { kind: "damage", amount: 5, target: 0 }, [obj(bears)]);
    settle(game);
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(life(game, B)).toBe(16);
  });
});

describe("Sigil of Sleep", () => {
  it("damage to a player bounces a creature that player controls", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Llanowar Elves", B);
    const other = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Llanowar Elves");
    enchant(game, "Sigil of Sleep", bears, "Island");
    let offered: readonly TargetRef[] = [];
    a.chooseTargetsFn = (_view, _source, _specs, options) => {
      offered = options[0];
      return [obj(theirs)];
    };
    attack(game, a, bears);
    expect([...offered].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))).toEqual(
      [obj(theirs), obj(other)].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y))),
    );
    expect(zoneOf(game, theirs)).toBe("hand");
    expect(zoneOf(game, mine)).toBe("battlefield");
  });
});

describe("Resurrection Orb", () => {
  it("lifelink; a creature that dies comes back at the next end step, even with the Orb gone", () => {
    const { game } = setUp();
    const orb = spawn(game, "Resurrection Orb");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, orb, bears, 4);
    expect(game.characteristics(bears).keywords).toContain("lifelink");
    game.debugApplyEffect(A, { kind: "destroy-all", filter: { notTypes: ["land"] } }, []);
    settle(game);
    expect(zoneOf(game, bears)).toBe("graveyard");
    expect(zoneOf(game, orb)).toBe("graveyard");
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(zoneOf(game, bears)).toBe("battlefield");
  });
});

describe("Mage Slayer", () => {
  it("attacking a player: the creature deals its power to that player", () => {
    const { game, a } = setUp();
    const slayer = spawn(game, "Mage Slayer");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, slayer, bears, 3);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && quiet(s));
    expect(life(game, B)).toBe(18);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(16);
  });

  it("a creature removed from combat before it resolves isn't attacking anything", () => {
    const { game, a } = setUp();
    const slayer = spawn(game, "Mage Slayer");
    const bears = spawn(game, "Grizzly Bears");
    equip(game, slayer, bears, 3);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.zones.shared.stack.length > 0);
    // What "remove it from combat" does (rule 506.4) — no card here does it.
    game.state.objects[bears].attacking = null;
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && quiet(s));
    expect(life(game, B)).toBe(20);
  });

  it("attacking a planeswalker: the damage goes to the planeswalker", () => {
    const { game, a } = setUp();
    const slayer = spawn(game, "Mage Slayer");
    const bears = spawn(game, "Grizzly Bears");
    const walker = spawn(game, "Ajani, Caller of the Pride", B);
    equip(game, slayer, bears, 3);
    a.declareAttackersFn = () => [{ attacker: bears, defender: walker }];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && quiet(s));
    expect(game.state.objects[walker].counters.loyalty).toBe(2);
    expect(life(game, B)).toBe(20);
  });
});
