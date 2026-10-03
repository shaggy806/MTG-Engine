/**
 * The Mardu Surge stand-ins that make and shape tokens: Legion Warboss (a
 * token that attacks this combat if able — "until end of combat", rule
 * 500.5a — and mentor), Ainok Strike Leader ("whenever you attack with this
 * creature and/or your commander"), Redoubled Stormsinger (a copy of each
 * creature token that entered this turn) and Divine Visitation (creature
 * tokens made as Angels instead — rule 614.1a).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { POOL_CARDS } from "../cards/generated.js";
import { restrictionsOf } from "../characteristics.js";
import { supertypesOf } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf, printedCardName } from "../state.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

type AttackOffer = Extract<LegalAction, { kind: "declare-attackers" }>;

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = (players: readonly PlayerId[] = [A, B]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: players.map((p) => ({ player: p, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};
const ready = (game: Game, name: string, who: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, who, "battlefield");
  game.state.objects[id].summoningSick = false;
  return id;
};
const named = (game: Game, name: string, who: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].controller === who,
  );
const tokensOf = (game: Game, who: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].isToken && game.state.objects[id].controller === who,
  );
const count = (game: Game, ids: readonly ObjectId[]): number =>
  ids.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const attackOffer = (game: Game, p: PlayerId = A): AttackOffer => {
  const offer = game.legalActions(p).find((o): o is AttackOffer => o.kind === "declare-attackers");
  if (offer === undefined) throw new Error("no attack offer");
  return offer;
};
const toAttackers = (game: Game) => game.advanceUntil((s) => s.awaiting?.kind === "attackers");

describe("Legion Warboss", () => {
  it("makes a hasty Goblin at the beginning of combat that must attack this combat, and only this combat", () => {
    const game = setUp();
    ready(game, "Legion Warboss");
    toAttackers(game);
    const [goblin] = named(game, "Goblin Token");
    expect(goblin).toBeDefined();
    expect(game.characteristics(goblin).keywords.has("haste")).toBe(true);
    expect(attackOffer(game).mustAttack).toContain(goblin);
    expect(() => game.dispatch({ type: "declare-attackers", player: A, attackers: [] })).toThrow(/must attack/);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: goblin, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    // The combat is over: the requirement went with it; the haste lasts the turn.
    expect(restrictionsOf(game.state, game.registry, goblin).has("must-attack")).toBe(false);
    expect(game.characteristics(goblin).keywords.has("haste")).toBe(true);
  });

  it("doesn't make a Goblin at the beginning of an opponent's combat", () => {
    const game = setUp();
    ready(game, "Legion Warboss");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    expect(named(game, "Goblin Token")).toHaveLength(1);
  });

  it("mentors an attacking creature with lesser power, never one as big", () => {
    const game = setUp();
    const warboss = ready(game, "Legion Warboss");
    const bears = ready(game, "Grizzly Bears");
    const raging = ready(game, "Raging Goblin");
    toAttackers(game);
    const [goblin] = named(game, "Goblin Token");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: warboss, defender: B },
        { attacker: goblin, defender: B },
        { attacker: bears, defender: B },
        { attacker: raging, defender: B },
      ],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    // Grizzly Bears' 2 power isn't less than Legion Warboss's 2.
    expect(() => game.dispatch({ type: "choose-targets", player: A, targets: [obj(bears)] })).toThrow();
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(raging)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[raging].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[bears].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[goblin].counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Ainok Strike Leader", () => {
  it("attacking with it makes a tapped Goblin attacking each opponent", () => {
    const game = setUp([A, B, C]);
    const ainok = ready(game, "Ainok Strike Leader");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ainok, defender: B }] });
    game.advanceUntil(quiet);
    const goblins = named(game, "Goblin Token");
    expect(goblins).toHaveLength(2);
    expect(goblins.map((id) => game.state.objects[id].attacking).sort()).toEqual([B, C].sort());
    for (const id of goblins) expect(game.state.objects[id].tapped).toBe(true);
  });

  it("triggers on your commander attacking without it, and not on another creature", () => {
    const game = setUp();
    ready(game, "Ainok Strike Leader");
    const commander = ready(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const other = ready(game, "Grizzly Bears");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: other, defender: B }] });
    game.advanceUntil(quiet);
    expect(named(game, "Goblin Token")).toHaveLength(0);

    game.advanceUntil((s) => s.turn.number === 3 && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: commander, defender: B }] });
    game.advanceUntil(quiet);
    expect(named(game, "Goblin Token")).toHaveLength(1);
  });

  it("isn't triggered by an opponent's commander you attack with", () => {
    const game = setUp();
    ready(game, "Ainok Strike Leader");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.state.objects[theirs].isCommander = true;
    game.debugApplyEffect(A, { kind: "gain-control", target: 0 }, [obj(theirs)]);
    game.state.objects[theirs].summoningSick = false;
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: theirs, defender: B }] });
    game.advanceUntil(quiet);
    expect(named(game, "Goblin Token")).toHaveLength(0);
  });

  it("sacrifices itself to make creature tokens you control indestructible", () => {
    const game = setUp();
    const ainok = ready(game, "Ainok Strike Leader");
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1 });
    const [goblin] = named(game, "Goblin Token");
    const bears = ready(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: ainok, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[ainok].zone).toBe("graveyard");
    expect(game.characteristics(goblin).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(false);
  });
});

describe("Redoubled Stormsinger", () => {
  it("copies each creature token that entered this turn, tapped and attacking, and sacrifices them at end step", () => {
    const game = setUp();
    const singer = ready(game, "Redoubled Stormsinger");
    const old = ready(game, "Goblin Token");
    game.state.objects[old].enteredBattlefieldOnTurn = 0;
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 2 });
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: singer, defender: B }] });
    game.advanceUntil(quiet);
    const copies = named(game, "Goblin Token").filter((id) => game.state.objects[id].attacking === B);
    expect(copies).toHaveLength(2);
    for (const id of copies) expect(game.state.objects[id].tapped).toBe(true);
    expect(count(game, named(game, "Goblin Token"))).toBe(5);
    game.advanceUntil((s) => s.turn.step === "cleanup" || s.turn.number > 1);
    expect(count(game, named(game, "Goblin Token"))).toBe(3);
  });

  it("copies a stack of tokens made today once per token, and none made on an earlier turn", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 10 });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    // Still summoning-sick, both batches — but made on different turns, so
    // the second doesn't fold into the first's stack.
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 8 });
    expect(named(game, "Goblin Token")).toHaveLength(2);
    game.advanceUntil((s) => s.turn.number === 3 && s.priority.holder === A && s.turn.step === "precombat-main");
    const singer = ready(game, "Redoubled Stormsinger");
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 9 });
    expect(named(game, "Goblin Token")).toHaveLength(3);
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: singer, defender: B }] });
    game.advanceUntil(quiet);
    expect(count(game, named(game, "Goblin Token"))).toBe(10 + 8 + 9 + 9);
  });
});

describe("returning permanents you control as a cost (Quirion Ranger, Mina and Denn, Multani)", () => {
  const land = (game: Game, name: string, who: PlayerId = A): ObjectId => {
    const id = game.debugSpawn(name, who, "battlefield");
    game.state.objects[id].tapped = false;
    return id;
  };

  it("Quirion Ranger returns its one Forest without asking, untaps the target, and only once each turn", () => {
    const game = setUp();
    const ranger = ready(game, "Quirion Ranger");
    const forest = land(game, "Forest");
    land(game, "Mountain");
    const bears = ready(game, "Grizzly Bears");
    game.state.objects[bears].tapped = true;
    game.dispatch({ type: "activate-ability", player: A, source: ranger, abilityIndex: 0, targets: [obj(bears)] });
    // Paid as it was activated, before anything could answer.
    expect(game.state.objects[forest].zone).toBe("hand");
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].tapped).toBe(false);
    land(game, "Forest");
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: ranger, abilityIndex: 0, targets: [obj(bears)] }),
    ).toThrow();
  });

  it("can't be activated without a Forest", () => {
    const game = setUp();
    const ranger = ready(game, "Quirion Ranger");
    land(game, "Mountain");
    const offers = game.legalActions(A).filter((o) => o.kind === "activate-ability" && o.source === ranger);
    expect(offers).toHaveLength(0);
  });

  it("asks which Forest when there's a choice, then hands priority back to whoever activated it", () => {
    const game = setUp();
    const ranger = ready(game, "Quirion Ranger", B);
    const [f1, f2] = [land(game, "Forest", B), land(game, "Forest", B)];
    const bears = ready(game, "Grizzly Bears", B);
    game.state.objects[bears].tapped = true;
    // Alice passes; Bob activates on her turn.
    game.dispatch({ type: "pass-priority", player: A });
    expect(game.state.priority.holder).toBe(B);
    game.dispatch({ type: "activate-ability", player: B, source: ranger, abilityIndex: 0, targets: [obj(bears)] });
    expect(game.state.awaiting?.kind).toBe("choose-permanents");
    game.dispatch({ type: "choose-permanents", player: B, permanents: [f2] });
    expect(game.state.objects[f2].zone).toBe("hand");
    expect(game.state.objects[f1].zone).toBe("battlefield");
    expect(game.state.priority.holder).toBe(B);
    expect(game.state.zones.shared.stack).toHaveLength(1);
  });

  it("Mina and Denn may return a land tapped for its own mana, and grants trample", () => {
    const game = setUp();
    const mina = ready(game, "Mina and Denn, Wildborn");
    const mountain = land(game, "Mountain");
    const forest = land(game, "Forest");
    const bears = ready(game, "Grizzly Bears");
    game.dispatch({ type: "activate-ability", player: A, source: mina, abilityIndex: 0, targets: [obj(bears)] });
    expect(game.state.awaiting?.kind).toBe("choose-permanents");
    game.dispatch({ type: "choose-permanents", player: A, permanents: [mountain] });
    expect(game.state.objects[mountain].zone).toBe("hand");
    expect(game.state.objects[forest].tapped).toBe(true);
    game.advanceUntil(quiet);
    expect(game.characteristics(bears).keywords.has("trample")).toBe(true);
  });

  it("Multani counts lands you control and land cards in your graveyard, and returns itself to hand for two lands", () => {
    const game = setUp();
    const lands = [land(game, "Forest"), land(game, "Forest"), land(game, "Island")];
    game.debugSpawn("Mountain", A, "graveyard");
    game.debugSpawn("Mountain", B, "graveyard");
    const multani = ready(game, "Multani, Yavimaya's Avatar");
    expect([game.characteristics(multani).power, game.characteristics(multani).toughness]).toEqual([4, 4]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(multani)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[multani].zone).toBe("graveyard");
    game.dispatch({ type: "activate-ability", player: A, source: multani, abilityIndex: 0, targets: [] });
    expect(game.state.awaiting?.kind).toBe("choose-permanents");
    game.dispatch({ type: "choose-permanents", player: A, permanents: [lands[0], lands[2]] });
    expect(game.state.objects[lands[0]].zone).toBe("hand");
    expect(game.state.objects[lands[2]].zone).toBe("hand");
    game.advanceUntil(quiet);
    expect(game.state.objects[multani].zone).toBe("hand");
  });

  it("Multani can't come back with fewer than two lands to return", () => {
    const game = setUp();
    land(game, "Forest");
    land(game, "Forest");
    const multani = game.debugSpawn("Multani, Yavimaya's Avatar", A, "graveyard");
    // {1}{G} taps both Forests, and both may still be returned.
    expect(game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === multani)).toBe(true);
    const other = setUp();
    land(other, "Forest");
    const lone = other.debugSpawn("Multani, Yavimaya's Avatar", A, "graveyard");
    expect(other.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === lone)).toBe(false);
  });
});

describe("Consuming Aberration", () => {
  it("has each opponent reveal until a land and put all of it into their graveyard, and grows by it", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [
        { player: A, cards: Array<string>(40).fill("Island") },
        // The first seven are the opening hand.
        {
          player: B,
          cards: [...Array<string>(7).fill("Island"), "Grizzly Bears", "Grizzly Bears", "Swamp", ...Array<string>(40).fill("Island")],
        },
        { player: C, cards: Array<string>(10).fill("Grizzly Bears") },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    // A card in an opponent's graveyard to start with — and one in Alice's,
    // which doesn't count — so it isn't a 0/0.
    game.debugSpawn("Island", B, "graveyard");
    game.debugSpawn("Island", A, "graveyard");
    const aberration = ready(game, "Consuming Aberration");
    expect(game.characteristics(aberration).power).toBe(1);
    const graveyard = (p: PlayerId) => game.state.zones.perPlayer[p].graveyard.length;
    const cLibrary = game.state.zones.perPlayer[C].library.length;
    const thopter = game.debugSpawn("Ornithopter", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: thopter, targets: [] });
    game.advanceUntil(quiet);
    // Bob: Bears, Bears, then the Swamp. Carol has no land: her whole library.
    expect(graveyard(B)).toBe(1 + 3);
    expect(graveyard(C)).toBe(cLibrary);
    expect(game.state.zones.perPlayer[B].graveyard.map((id) => game.state.objects[id].cardName)).toContain("Swamp");
    expect(graveyard(A)).toBe(1);
    const c = game.characteristics(aberration);
    expect([c.power, c.toughness]).toEqual([4 + cLibrary, 4 + cLibrary]);
  });
});

describe("Myr Battlesphere", () => {
  it("makes four Myr, then taps X of them as it attacks for +X/+0 and X damage to the player it's attacking", () => {
    const game = setUp();
    const sphere = game.debugSpawn("Myr Battlesphere", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const myr = named(game, "Myr Token");
    expect(count(game, myr)).toBe(4);
    game.state.objects[sphere].summoningSick = false;
    for (const id of myr) game.state.objects[id].summoningSick = false;
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: sphere, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-permanents");
    game.dispatch({ type: "choose-permanents", player: A, permanents: myr.slice(0, 3) });
    game.advanceUntil(quiet);
    expect(myr.filter((id) => game.state.objects[id].tapped)).toHaveLength(3);
    expect(game.characteristics(sphere).power).toBe(7);
    expect(game.state.players[B].life).toBe(17);
  });

  it("tapping none does nothing", () => {
    const game = setUp();
    const sphere = ready(game, "Myr Battlesphere");
    ready(game, "Myr Token");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: sphere, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-permanents");
    game.dispatch({ type: "choose-permanents", player: A, permanents: [] });
    game.advanceUntil(quiet);
    expect(game.characteristics(sphere).power).toBe(4);
    expect(game.state.players[B].life).toBe(20);
  });
});

describe("Sarkhan, Soul Aflame", () => {
  const answer = (game: Game, yes: boolean) => {
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes" || quiet(s));
    expect(game.state.awaiting?.kind).toBe("choose-modes");
    game.dispatch({ type: "choose-modes", player: A, modes: yes ? [0] : [] });
    game.advanceUntil(quiet);
  };

  it("becomes a copy of an entering Dragon until end of turn, keeping its name, legendary, and its counters", () => {
    const game = setUp();
    const sarkhan = ready(game, "Sarkhan, Soul Aflame");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(sarkhan)]);
    const dragon = game.debugSpawn("Shivan Dragon", A, "battlefield", { announceEntry: true });
    expect(dragon).toBeDefined();
    answer(game, true);
    const s = game.state.objects[sarkhan];
    const c = game.characteristics(sarkhan);
    expect([c.power, c.toughness]).toEqual([6, 6]);
    expect(c.keywords.has("flying")).toBe(true);
    expect(c.subtypes).toEqual(["Dragon"]);
    expect(nameOf(s)).toBe("Sarkhan, Soul Aflame");
    expect(supertypesOf(game.registry, s)).toContain("legendary");
    // A Shivan Dragon: its firebreathing, not Sarkhan's own abilities.
    expect(game.registry.get(printedCardName(s)).name).toBe("Shivan Dragon");
    game.advanceUntil((s2) => s2.turn.number === 2);
    const after = game.characteristics(sarkhan);
    expect([after.power, after.toughness]).toEqual([3, 5]);
    expect(after.subtypes).toEqual(["Human", "Shaman"]);
    expect(game.state.objects[sarkhan].copyOf).toBeNull();
  });

  it("copies a legendary Dragon without either going to the legend rule", () => {
    const game = setUp();
    const sarkhan = ready(game, "Sarkhan, Soul Aflame");
    const lathliss = game.debugSpawn("Lathliss, Dragon Queen", A, "battlefield", { announceEntry: true });
    answer(game, true);
    expect(game.state.objects[sarkhan].zone).toBe("battlefield");
    expect(game.state.objects[lathliss].zone).toBe("battlefield");
    expect(game.characteristics(sarkhan).power).toBe(6);
  });

  it("may decline, and doesn't trigger on an opponent's Dragon", () => {
    const game = setUp();
    const sarkhan = ready(game, "Sarkhan, Soul Aflame");
    game.debugSpawn("Shivan Dragon", A, "battlefield", { announceEntry: true });
    answer(game, false);
    expect(game.state.objects[sarkhan].copyOf).toBeNull();
    game.debugSpawn("Shivan Dragon", B, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[sarkhan].copyOf).toBeNull();
  });

  it("copies the Dragon as it last existed if it left before the ability resolved", () => {
    const game = setUp();
    const sarkhan = ready(game, "Sarkhan, Soul Aflame");
    const dragon = game.debugSpawn("Skyship Stalker", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(dragon)]);
    answer(game, true);
    expect(game.state.objects[dragon].zone).toBe("graveyard");
    expect(game.characteristics(sarkhan).power).toBe(3);
    expect(game.characteristics(sarkhan).subtypes).toEqual(["Cat", "Dragon"]);
  });

  it("makes Dragon spells cost {1} less", () => {
    const game = setUp();
    ready(game, "Sarkhan, Soul Aflame");
    for (let i = 0; i < 5; i += 1) game.state.objects[game.debugSpawn("Mountain", A, "battlefield")].tapped = false;
    const dragon = game.debugSpawn("Shivan Dragon", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: dragon, targets: [] });
    expect(game.state.objects[dragon].zone).toBe("stack");
  });
});

describe("Scourge of the Throne", () => {
  const counters = (game: Game, id: ObjectId) => game.state.objects[id].counters["+1/+1"] ?? 0;

  it("attacking the player with the most life untaps the attackers and adds a combat, only the first time each turn", () => {
    const game = setUp();
    const scourge = ready(game, "Scourge of the Throne");
    const bears = ready(game, "Grizzly Bears");
    toAttackers(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: scourge, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    game.advanceUntil(quiet);
    // Tied for the most life: dethrone's counter, and the attackers untapped.
    expect(counters(game, scourge)).toBe(1);
    expect(game.state.objects[scourge].tapped).toBe(false);
    expect(game.state.objects[bears].tapped).toBe(false);
    // The additional combat, in the same turn: Scourge attacks again.
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.turn.number > 1);
    expect(game.state.turn.number).toBe(1);
    // Bob still has the most life, so only "the first time each turn" stops it.
    game.state.players[B].life = 40;
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: scourge, defender: B }] });
    game.advanceUntil(quiet);
    // Dethrone again; but not a third combat — this wasn't its first attack.
    expect(counters(game, scourge)).toBe(2);
    expect(game.state.objects[scourge].tapped).toBe(true);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.turn.number > 1);
    expect(game.state.turn.number).toBe(2);
  });

  it("does nothing attacking a player without the most life", () => {
    const game = setUp();
    const scourge = ready(game, "Scourge of the Throne");
    game.state.players[A].life = 25;
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: scourge, defender: B }] });
    game.advanceUntil(quiet);
    expect(counters(game, scourge)).toBe(0);
    expect(game.state.objects[scourge].tapped).toBe(true);
  });

  it("asks again as it resolves: no extra combat once the defender no longer has the most life — but dethrone's counter stays", () => {
    const game = setUp();
    const scourge = ready(game, "Scourge of the Throne");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: scourge, defender: B }] });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 && s.pendingTriggers.length === 0 && s.awaiting === null);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    game.advanceUntil(quiet);
    expect(counters(game, scourge)).toBe(1);
    expect(game.state.objects[scourge].tapped).toBe(true);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.turn.number > 1);
    expect(game.state.turn.number).toBe(2);
  });

  it("gone before it resolves, it's read as it left: removed from combat first, it was attacking nobody", () => {
    const game = setUp();
    const scourge = ready(game, "Scourge of the Throne");
    // Held back, to attack in an additional combat if there were one.
    ready(game, "Grizzly Bears");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: scourge, defender: B }] });
    game.advanceUntil((s) => s.zones.shared.stack.length > 0 && s.pendingTriggers.length === 0 && s.awaiting === null);
    // A change of control removes it from combat (rule 506.4); then it dies.
    game.debugApplyEffect(B, { kind: "gain-control", target: 0 }, [obj(scourge)]);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(scourge)]);
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.turn.number > 1);
    expect(game.state.turn.number).toBe(2);
  });
});

describe("Territorial Hellkite", () => {
  const chosenFor = (game: Game, id: ObjectId) => game.state.objects[id].mustAttackPlayer;

  it("picks an opponent at random that it must attack this combat, and not the one it attacked last combat", () => {
    const game = setUp([A, B, C]);
    const hellkite = ready(game, "Territorial Hellkite");
    toAttackers(game);
    const first = chosenFor(game, hellkite);
    expect([B, C]).toContain(first);
    expect(attackOffer(game).mustAttack).toContain(hellkite);
    const other = first === B ? C : B;
    // Not the other opponent: only the chosen one obeys the requirement.
    expect(() =>
      game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: hellkite, defender: other! }] }),
    ).toThrow();
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: hellkite, defender: first! }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main");
    // This combat only.
    expect(chosenFor(game, hellkite)).toBeUndefined();
    // Alice's next combat: the one it didn't attack.
    game.advanceUntil((s) => s.turn.number === 4 && s.awaiting?.kind === "attackers");
    expect(chosenFor(game, hellkite)).toBe(other);
  });

  it("with only the opponent it attacked last combat to pick, taps itself", () => {
    const game = setUp();
    const hellkite = ready(game, "Territorial Hellkite");
    toAttackers(game);
    expect(chosenFor(game, hellkite)).toBe(B);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: hellkite, defender: B }] });
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "begin-combat" && quiet(s));
    expect(chosenFor(game, hellkite)).toBeUndefined();
    expect(game.state.objects[hellkite].tapped).toBe(true);
    // And the turn after, it didn't attack last combat: any opponent again.
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "begin-combat" && quiet(s));
    expect(chosenFor(game, hellkite)).toBe(B);
  });

  it("only triggers on its controller's turn", () => {
    const game = setUp();
    const hellkite = ready(game, "Territorial Hellkite", B);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main");
    expect(chosenFor(game, hellkite)).toBeUndefined();
    expect(game.state.objects[hellkite].tapped).toBe(false);
  });
});

describe("Living Death", () => {
  const castLivingDeath = (game: Game) => {
    for (let i = 0; i < 5; i += 1) game.state.objects[game.debugSpawn("Swamp", A, "battlefield")].tapped = false;
    const spell = game.debugSpawn("Living Death", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [] });
    game.advanceUntil(quiet);
  };

  it("swaps every player's creatures on the battlefield for the creature cards in their graveyard", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = ready(game, "Hill Giant");
    const wurm = game.debugSpawn("Craw Wurm", B, "graveyard");
    const angel = ready(game, "Serra Angel", B);
    const island = game.debugSpawn("Island", B, "graveyard");
    castLivingDeath(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].controller).toBe(A);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(game.state.objects[wurm].controller).toBe(B);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(game.state.objects[angel].zone).toBe("graveyard");
    // Not a creature card: stays.
    expect(game.state.objects[island].zone).toBe("graveyard");
  });

  it("brings back only what it exiled from graveyards, not a creature a replacement exiled as it was sacrificed", () => {
    const game = setUp();
    // In the graveyard before Rest in Peace, which would exile it on the way.
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    ready(game, "Rest in Peace", B);
    const giant = ready(game, "Hill Giant");
    castLivingDeath(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[giant].zone).toBe("exile");
  });
});

describe("Lethal Scheme", () => {
  const prepare = (game: Game) => {
    for (let i = 0; i < 2; i += 1) game.state.objects[game.debugSpawn("Swamp", A, "battlefield")].tapped = false;
    const one = ready(game, "Grizzly Bears");
    const two = ready(game, "Grizzly Bears");
    const angel = ready(game, "Serra Angel", B);
    const nonland = game.debugSpawn("Hill Giant", A, "hand");
    const spell = game.debugSpawn("Lethal Scheme", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: spell,
      targets: [obj(angel)],
      convoke: [{ creature: one }, { creature: two }],
    });
    return { one, two, angel, nonland };
  };
  const discard = (game: Game, card: ObjectId) => {
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    game.dispatch({ type: "discard", player: A, cards: [card] });
  };
  const anIsland = (game: Game): ObjectId =>
    game.state.zones.perPlayer[A].hand.find((id) => game.state.objects[id].cardName === "Island")!;

  it("destroys, then each creature that convoked it connives, in the order its controller chooses", () => {
    const game = setUp();
    const { one, two, angel, nonland } = prepare(game);
    expect(game.state.objects[one].tapped && game.state.objects[two].tapped).toBe(true);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.objects[angel].zone).toBe("graveyard");
    // The second to convoke goes first.
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    discard(game, nonland);
    discard(game, anIsland(game));
    game.advanceUntil(quiet);
    expect(game.state.objects[two].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[one].counters["+1/+1"] ?? 0).toBe(0);
  });

  it("a convoker that has died since still connives, but gets no counter", () => {
    const game = setUp();
    const { one, two, nonland } = prepare(game);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(one)]);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    const handBefore = game.state.zones.perPlayer[A].hand.length;
    // The dead one first: it draws and discards (a nonland card), nothing gets a counter.
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    discard(game, nonland);
    discard(game, anIsland(game));
    game.advanceUntil(quiet);
    // Two draws, two discards.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(handBefore);
    expect(game.state.objects[nonland].zone).toBe("graveyard");
    expect(game.state.objects[one].zone).toBe("graveyard");
    expect(game.state.objects[two].counters["+1/+1"] ?? 0).toBe(0);
  });

  it("a copy makes the creatures that convoked the original connive too (rule 707.10)", () => {
    const game = setUp();
    for (let i = 0; i < 2; i += 1) game.state.objects[game.debugSpawn("Island", A, "battlefield")].tapped = false;
    const { one, two } = prepare(game);
    const other = ready(game, "Serra Angel", B);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Hill Giant", A, "hand");
    const twincast = game.debugSpawn("Twincast", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: twincast, targets: [obj(game.state.zones.shared.stack[0])] });
    let discards = 0;
    for (let guard = 0; guard < 50 && !quiet(game.state); guard += 1) {
      game.advanceUntil((s) => s.awaiting !== null || quiet(s));
      const awaiting = game.state.awaiting;
      if (awaiting === null) break;
      if (awaiting.kind === "choose-targets") {
        game.dispatch({ type: "choose-targets", player: A, targets: [obj(other)] });
      } else if (awaiting.kind === "choose-modes") {
        game.dispatch({ type: "choose-modes", player: A, modes: [0] });
      } else if (awaiting.kind === "discard") {
        // A nonland card each time: every connive puts a counter on.
        const giant = game.state.zones.perPlayer[A].hand.find((id) => game.state.objects[id].cardName === "Hill Giant")!;
        game.dispatch({ type: "discard", player: A, cards: [giant] });
        discards += 1;
      } else {
        throw new Error(`unexpected ${awaiting.kind}`);
      }
    }
    expect(game.state.objects[other].zone).toBe("graveyard");
    // Four connives: the copy's two, then the original's two.
    expect(discards).toBe(4);
    expect(game.state.objects[one].counters["+1/+1"]).toBe(2);
    expect(game.state.objects[two].counters["+1/+1"]).toBe(2);
  });
});

describe("Dauthi Voidwalker", () => {
  it("has shadow: it blocks and is blocked only by creatures with shadow", () => {
    const game = setUp();
    const dauthi = ready(game, "Dauthi Voidwalker");
    const bears = ready(game, "Grizzly Bears");
    const theirDauthi = ready(game, "Dauthi Voidwalker", B);
    const theirBears = ready(game, "Grizzly Bears", B);
    toAttackers(game);
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: dauthi, defender: B },
        { attacker: bears, defender: B },
      ],
    });
    game.advanceUntil((s) => s.awaiting?.kind === "blockers");
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker: theirBears, attacker: dauthi }] }),
    ).toThrow(/shadow/);
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker: theirDauthi, attacker: bears }] }),
    ).toThrow(/shadow/);
    game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker: theirDauthi, attacker: dauthi }] });
    expect(game.state.objects[theirDauthi].blocking).toBe(dauthi);
  });

  it("exiles an opponent's card bound for their graveyard with a void counter — not your own, nor a token", () => {
    const game = setUp();
    ready(game, "Dauthi Voidwalker");
    const theirs = ready(game, "Grizzly Bears", B);
    const mine = ready(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1 }, []);
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 1 }, []);
    const goblin = named(game, "Goblin Token", B)[0];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(mine)]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(goblin)]);
    expect(game.state.objects[theirs].zone).toBe("exile");
    expect(game.state.objects[theirs].counters["void"]).toBe(1);
    expect(game.state.objects[mine].zone).toBe("graveyard");
    // The token died (it's gone either way, but it did go to the graveyard).
    expect(game.state.eventLog.some((e) => e.type === "permanent-left-battlefield" && e.object === goblin && e.toZone === "graveyard")).toBe(true);
  });

  it("sacrifices itself to let you play an opponent's void card this turn, free", () => {
    const game = setUp();
    const dauthi = ready(game, "Dauthi Voidwalker");
    const theirs = ready(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)]);
    // An exiled card without a void counter isn't one to choose.
    const plain = game.debugSpawn("Hill Giant", B, "exile");
    game.dispatch({ type: "activate-ability", player: A, source: dauthi, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[dauthi].zone).toBe("graveyard");
    expect(game.state.objects[theirs].impulse?.player).toBe(A);
    expect(game.state.objects[plain].impulse).toBeUndefined();
    // No mana: only free.
    game.dispatch({ type: "cast-spell", player: A, card: theirs, targets: [], via: "impulse", free: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].controller).toBe(A);
  });

  // Rule 616.1: the affected object's controller (its owner, off the
  // battlefield and the stack) picks which replacement applies — and only
  // the void counter's controller has any use for it.
  it("leaves an opponent's flashback spell to flashback's exile, with no void counter", () => {
    const game = setUp();
    for (let i = 0; i < 3; i += 1) game.state.objects[game.debugSpawn("Island", B, "battlefield")].tapped = false;
    const thinkTwice = game.debugSpawn("Think Twice", B, "graveyard");
    ready(game, "Dauthi Voidwalker");
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "cast-spell", player: B, card: thinkTwice, targets: [], via: "flashback" });
    game.advanceUntil(quiet);
    expect(game.state.objects[thinkTwice].zone).toBe("exile");
    expect(game.state.objects[thinkTwice].counters["void"] ?? 0).toBe(0);
  });

  it("beside Rest in Peace, puts the void counter on only for a chooser who controls Dauthi", () => {
    const game = setUp();
    ready(game, "Dauthi Voidwalker");
    ready(game, "Rest in Peace", B);
    // Bob's creature, Bob's to choose: Rest in Peace's exile.
    const his = ready(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(his)]);
    expect(game.state.objects[his].zone).toBe("exile");
    expect(game.state.objects[his].counters["void"] ?? 0).toBe(0);
    // Bob's creature under Alice's control: hers to choose, and the counter is hers.
    const taken = ready(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "gain-control", target: 0 }, [obj(taken)]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(taken)]);
    expect(game.state.objects[taken].zone).toBe("exile");
    expect(game.state.objects[taken].counters["void"]).toBe(1);
    // Alone, Dauthi's replacement puts it on.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(named(game, "Rest in Peace", B)[0])]);
    const next = ready(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(next)]);
    expect(game.state.objects[next].counters["void"]).toBe(1);
  });
});

describe("Tasigur, the Golden Fang", () => {
  const activateTasigur = (game: Game) => {
    for (const land of ["Forest", "Forest", "Island", "Island"]) {
      game.state.objects[game.debugSpawn(land, A, "battlefield")].tapped = false;
    }
    const tasigur = ready(game, "Tasigur, the Golden Fang");
    game.dispatch({ type: "activate-ability", player: A, source: tasigur, abilityIndex: 0, targets: [] });
    return tasigur;
  };

  it("mills two, then the opponent picks the nonland card from your graveyard that goes to your hand", () => {
    const game = setUp();
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const library = game.state.zones.perPlayer[A].library.length;
    activateTasigur(game);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 2);
    const awaiting = game.state.awaiting;
    expect(awaiting?.player).toBe(B);
    // The milled Islands are lands: only the two creature cards are offered.
    expect(awaiting?.kind === "choose-from-zone" ? [...awaiting.eligible].sort() : []).toEqual([giant, bears].sort());
    // Bob is told whose hand the card goes to.
    const offer = game.legalActions(B).find((o) => o.kind === "choose-from-zone");
    expect(offer?.kind === "choose-from-zone" ? offer.forPlayer : undefined).toBe(A);
    game.dispatch({ type: "choose-from-zone", player: B, chosen: [bears] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(game.state.objects[bears].owner).toBe(A);
    expect(game.state.zones.perPlayer[A].hand).toContain(bears);
    expect(game.state.objects[giant].zone).toBe("graveyard");
  });

  it("with several opponents, you choose which one chooses", () => {
    const game = setUp([A, B, C]);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    activateTasigur(game);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.player).toBe(A);
    // The second mode: Carol.
    game.dispatch({ type: "choose-modes", player: A, modes: [1] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    expect(game.state.awaiting?.player).toBe(C);
    game.dispatch({ type: "choose-from-zone", player: C, chosen: [bears] });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].hand).toContain(bears);
  });
});

describe("Colossal Grave-Reaver", () => {
  const withLibrary = (top: readonly string[]) => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [
        // The first seven are the opening hand.
        { player: A, cards: [...Array<string>(7).fill("Island"), ...top, ...Array<string>(30).fill("Island")] },
        { player: B, cards: Array<string>(40).fill("Island") },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    return game;
  };

  it("mills three as it enters, and puts one of the creature cards milled onto the battlefield, your choice", () => {
    // The first is the turn's draw.
    const game = withLibrary(["Island", "Grizzly Bears", "Island", "Hill Giant"]);
    game.debugSpawn("Colossal Grave-Reaver", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone" || quiet(s));
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    const names = awaiting?.kind === "choose-from-zone" ? awaiting.eligible.map((id) => game.state.objects[id].cardName).sort() : [];
    expect(names).toEqual(["Grizzly Bears", "Hill Giant"]);
    const giant = awaiting?.kind === "choose-from-zone" ? awaiting.eligible.find((id) => game.state.objects[id].cardName === "Hill Giant")! : "";
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [giant] });
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].zone).toBe("battlefield");
    expect(game.state.objects[giant].controller).toBe(A);
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
  });

  it("with one creature card among them, just puts it there; with none, nothing", () => {
    const game = withLibrary(["Island", "Grizzly Bears", "Island", "Island", "Island", "Island"]);
    const reaver = game.debugSpawn("Colossal Grave-Reaver", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    // A mill of only lands doesn't trigger it.
    game.state.objects[reaver].summoningSick = false;
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: reaver, defender: B }] });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(5);
  });
});

describe("Neriv, Crackling Vanguard", () => {
  const exiledByNeriv = (game: Game): ObjectId[] =>
    game.state.zones.shared.exile.filter((id) => game.state.objects[id].impulse?.player === A);
  const playable = (game: Game, id: ObjectId): boolean =>
    game.legalActions(A).some((o) => (o.kind === "play-land" || o.kind === "cast-spell") && o.card === id);

  it("makes two Goblins, and exiles one card per differently named token you control as it attacks", () => {
    const game = setUp();
    const neriv = game.debugSpawn("Neriv, Crackling Vanguard", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(count(game, named(game, "Goblin Token"))).toBe(2);
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    // Two Angel Tokens, by their names, though defined apart.
    game.debugApplyEffect(A, { kind: "create-token", token: "4/4 Vigilant Angel Token", count: 1 });
    game.debugApplyEffect(A, { kind: "create-token", token: "4/4 Angel Token", count: 1 });
    // Not yours.
    game.debugApplyEffect(B, { kind: "create-token", token: "Food Token", count: 1 });
    game.state.objects[neriv].summoningSick = false;
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: neriv, defender: B }] });
    game.advanceUntil(quiet);
    // Goblin, Treasure and Angel Tokens: three.
    expect(exiledByNeriv(game)).toHaveLength(3);
    // Not a turn Alice attacked with a commander: none playable.
    for (const id of exiledByNeriv(game)) expect(playable(game, id)).toBe(false);
  });

  it("counts a named token by its own name, not its subtypes", () => {
    const game = setUp();
    const neriv = ready(game, "Neriv, Crackling Vanguard");
    // "Karox Bladewing" and a "Dragon Token": two names, both Dragons.
    game.debugApplyEffect(A, { kind: "create-token", token: "Karox Bladewing", count: 1 });
    game.debugApplyEffect(A, { kind: "create-token", token: "Dragon Token (Firebreathing)", count: 1 });
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: neriv, defender: B }] });
    game.advanceUntil(quiet);
    expect(exiledByNeriv(game)).toHaveLength(2);
  });

  it("counts a copy of a token by that token's name (rule 707.2), not its key", () => {
    const game = setUp();
    const neriv = ready(game, "Neriv, Crackling Vanguard");
    // An Angel Token, and a copy of a differently keyed Angel Token: one name.
    game.debugApplyEffect(A, { kind: "create-token", token: "4/4 Angel Token", count: 1 });
    game.debugApplyEffect(A, { kind: "create-token", token: "4/4 Vigilant Angel Token", count: 1 });
    const [vigilant] = named(game, "4/4 Vigilant Angel Token");
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1 }, [obj(vigilant)]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(vigilant)]);
    expect(tokensOf(game).filter((id) => game.state.objects[id].copyOf === "4/4 Vigilant Angel Token")).toHaveLength(1);
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: neriv, defender: B }] });
    game.advanceUntil(quiet);
    expect(exiledByNeriv(game)).toHaveLength(1);
  });

  it("can tell a generic token by its key: one says \"Token\", and no card's name does", () => {
    for (const card of POOL_CARDS) expect(card.name).not.toMatch(/\bToken\b/);
  });

  it("lets you play them during a turn you attacked with a commander, and for as long as they stay exiled", () => {
    const game = setUp();
    const neriv = ready(game, "Neriv, Crackling Vanguard");
    game.state.objects[neriv].isCommander = true;
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1 });
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: neriv, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    const [card] = exiledByNeriv(game);
    expect(card).toBeDefined();
    expect(playable(game, card)).toBe(true);
    // Next turn of Alice's, without attacking: not now…
    game.advanceUntil((s) => s.turn.number === 3 && s.priority.holder === A && s.turn.step === "precombat-main");
    expect(playable(game, card)).toBe(false);
    // …but after she attacks with her commander again, yes.
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: neriv, defender: B }] });
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(playable(game, card)).toBe(true);
  });
});

describe("Necropolis Fiend", () => {
  const swamps = (game: Game, n: number) => {
    for (let i = 0; i < n; i += 1) game.state.objects[game.debugSpawn("Swamp", A, "battlefield")].tapped = false;
  };

  it("exiles X chosen cards from your graveyard as it's activated, and gives -X/-X", () => {
    const game = setUp();
    const fiend = ready(game, "Necropolis Fiend");
    swamps(game, 2);
    const cards = ["Grizzly Bears", "Hill Giant", "Island"].map((n) => game.debugSpawn(n, A, "graveyard"));
    const angel = ready(game, "Serra Angel", B);
    // X can't be more than the cards to exile.
    const offer = game.legalActions(A).find((o) => o.kind === "activate-ability" && o.source === fiend);
    expect(offer?.kind === "activate-ability" ? offer.xCost?.maxX : undefined).toBe(2);
    game.dispatch({ type: "activate-ability", player: A, source: fiend, abilityIndex: 0, targets: [obj(angel)], xValue: 2 });
    expect(game.state.awaiting?.kind).toBe("choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [cards[0], cards[2]] });
    expect(game.state.objects[cards[0]].zone).toBe("exile");
    expect(game.state.objects[cards[2]].zone).toBe("exile");
    expect(game.state.objects[cards[1]].zone).toBe("graveyard");
    expect(game.state.priority.holder).toBe(A);
    game.advanceUntil(quiet);
    const c = game.characteristics(angel);
    expect([c.power, c.toughness]).toEqual([2, 2]);
  });

  it("can't be activated for more X than there are cards in your graveyard", () => {
    const game = setUp();
    const fiend = ready(game, "Necropolis Fiend");
    swamps(game, 3);
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    const angel = ready(game, "Serra Angel", B);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: fiend, abilityIndex: 0, targets: [obj(angel)], xValue: 2 }),
    ).toThrow(/graveyard/);
  });
});

describe("Shigeki, Jukai Visionary", () => {
  const forests = (game: Game, n: number) => {
    for (let i = 0; i < n; i += 1) game.state.objects[game.debugSpawn("Forest", A, "battlefield")].tapped = false;
  };

  it("returns itself to hand as a cost, and reveals four, a land onto the battlefield tapped, the rest to the graveyard", () => {
    const game = setUp();
    const shigeki = ready(game, "Shigeki, Jukai Visionary");
    forests(game, 2);
    const library = game.state.zones.perPlayer[A].library.length;
    game.dispatch({ type: "activate-ability", player: A, source: shigeki, abilityIndex: 0, targets: [] });
    expect(game.state.objects[shigeki].zone).toBe("hand");
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    const awaiting = game.state.awaiting;
    const [land] = awaiting?.kind === "choose-from-zone" ? awaiting.eligible : [];
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [land] });
    game.advanceUntil(quiet);
    expect(game.state.objects[land].zone).toBe("battlefield");
    expect(game.state.objects[land].tapped).toBe(true);
    expect(game.state.zones.perPlayer[A].library.length).toBe(library - 4);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(3);
  });

  it("channels for X: exactly X target nonlegendary cards from your graveyard back to hand", () => {
    const game = setUp();
    // Mana enough for X = 4; only two cards it could take.
    forests(game, 10);
    const shigeki = game.debugSpawn("Shigeki, Jukai Visionary", A, "hand");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const giant = game.debugSpawn("Hill Giant", A, "graveyard");
    const legend = game.debugSpawn("Baldin, Century Herdmaster", A, "graveyard");
    // Offered once per X, with the group that big.
    const offers = game.legalActions(A).filter(
      (o): o is Extract<LegalAction, { kind: "activate-ability" }> => o.kind === "activate-ability" && o.source === shigeki,
    );
    expect(offers.map((o) => o.xCost?.maxX).sort()).toEqual([0, 1, 2]);
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: shigeki, abilityIndex: 1, targets: [obj(bears)], xValue: 2 }),
    ).toThrow();
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: shigeki, abilityIndex: 1, targets: [obj(bears), obj(legend)], xValue: 2 }),
    ).toThrow();
    game.dispatch({ type: "activate-ability", player: A, source: shigeki, abilityIndex: 1, targets: [obj(bears), obj(giant)], xValue: 2 });
    expect(game.state.objects[shigeki].zone).toBe("graveyard");
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(game.state.objects[giant].zone).toBe("hand");
    expect(game.state.objects[legend].zone).toBe("graveyard");
  });
});

describe("Gix, Yawgmoth Praetor", () => {
  it("lets a creature's controller pay 1 life to draw when it deals combat damage to one of Gix's controller's opponents", () => {
    const game = setUp([A, B, C]);
    ready(game, "Gix, Yawgmoth Praetor");
    const bears = ready(game, "Grizzly Bears");
    const hand = game.state.zones.perPlayer[A].hand.length;
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.player).toBe(A);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(19);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand + 1);
  });

  it("asks an opponent's creature's controller when it hits another opponent, but not when it hits you", () => {
    const game = setUp([A, B, C]);
    ready(game, "Gix, Yawgmoth Praetor");
    const theirs = ready(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: theirs, defender: C }] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.player).toBe(B);
    game.dispatch({ type: "choose-modes", player: B, modes: [] });
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.turn.number === 5 && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: theirs, defender: A }] });
    game.advanceUntil((s) => s.turn.step === "end" || s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.kind).not.toBe("choose-modes");
  });

  it("discards X to exile X of an opponent's library, and plays any of them free as it resolves", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 1, maxHandSize: 99 },
      decks: [
        { player: A, cards: Array<string>(40).fill("Island") },
        {
          player: B,
          cards: [...Array<string>(7).fill("Island"), "Grizzly Bears", "Forest", "Hill Giant", ...Array<string>(30).fill("Island")],
        },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 7; i += 1) game.state.objects[game.debugSpawn("Swamp", A, "battlefield")].tapped = false;
    const gix = ready(game, "Gix, Yawgmoth Praetor");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: gix,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
      xValue: 3,
    });
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    const discards = game.state.zones.perPlayer[A].hand.slice(0, 3);
    game.dispatch({ type: "discard", player: A, cards: discards });
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand - 3);
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    const exiled = game.state.zones.shared.exile.filter((id) => game.state.objects[id].owner === B);
    expect(exiled.map((id) => game.state.objects[id].cardName).sort()).toEqual(["Forest", "Grizzly Bears", "Hill Giant"]);
    const offerOf = () => game.legalActions(A).find((o) => o.kind === "cast-now");
    const castOf = (name: string) => {
      const offer = offerOf();
      return offer?.kind === "cast-now" ? offer.casts.find((c) => c.cardName === name) : undefined;
    };
    const bears = castOf("Grizzly Bears");
    expect(bears?.free).toBe(true);
    game.dispatch({ type: "cast-now", player: A, cast: { type: "cast-spell", player: A, card: bears!.card, targets: [], via: "effect", free: true } });
    // Offered again: the land too, as Alice's land play.
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    const offer = offerOf();
    const forest = offer?.kind === "cast-now" ? offer.lands?.find((l) => l.cardName === "Forest") : undefined;
    expect(forest).toBeDefined();
    game.dispatch({ type: "cast-now", player: A, cast: { type: "play-land", player: A, card: forest!.card } });
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    // Declining ends it: the Hill Giant stays in exile.
    game.dispatch({ type: "cast-now", player: A, cast: null });
    game.advanceUntil(quiet);
    const byName = (name: string) => exiled.find((id) => game.state.objects[id].cardName === name)!;
    expect(game.state.objects[byName("Grizzly Bears")].zone).toBe("battlefield");
    expect(game.state.objects[byName("Grizzly Bears")].controller).toBe(A);
    expect(game.state.objects[byName("Forest")].zone).toBe("battlefield");
    expect(game.state.objects[byName("Hill Giant")].zone).toBe("exile");
  });

  it("offers again only the cards it exiled — not one a replacement exiled as a cost of casting one", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 1, maxHandSize: 99 },
      decks: [
        { player: A, cards: Array<string>(40).fill("Island") },
        {
          player: B,
          cards: [...Array<string>(7).fill("Island"), "Thrill of Possibility", "Hill Giant", ...Array<string>(30).fill("Island")],
        },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 7; i += 1) game.state.objects[game.debugSpawn("Swamp", A, "battlefield")].tapped = false;
    ready(game, "Rest in Peace");
    const gix = ready(game, "Gix, Yawgmoth Praetor");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: gix,
      abilityIndex: 0,
      targets: [{ kind: "player", player: B }],
      xValue: 2,
    });
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    game.dispatch({ type: "discard", player: A, cards: game.state.zones.perPlayer[A].hand.filter((id) => id !== bears).slice(0, 2) });
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now");
    const offer = game.legalActions(A).find((o) => o.kind === "cast-now");
    const thrill = offer?.kind === "cast-now" ? offer.casts.find((c) => c.cardName === "Thrill of Possibility") : undefined;
    game.dispatch({
      type: "cast-now",
      player: A,
      cast: { type: "cast-spell", player: A, card: thrill!.card, targets: [], via: "effect", free: true },
    });
    // Thrill's discard, exiled by Rest in Peace as it's paid.
    game.advanceUntil((s) => s.awaiting?.kind === "discard");
    game.dispatch({ type: "discard", player: A, cards: [bears] });
    expect(game.state.objects[bears].zone).toBe("exile");
    game.advanceUntil((s) => s.awaiting?.kind === "cast-now" || quiet(s));
    const again = game.legalActions(A).find((o) => o.kind === "cast-now");
    expect(again?.kind === "cast-now" ? again.casts.map((c) => c.cardName) : []).toEqual(["Hill Giant"]);
  });
});

describe("Selvala's Stampede (a vote)", () => {
  const vote = (game: Game, player: PlayerId, option: number) => {
    game.advanceUntil((s) => s.awaiting?.kind === "choose-modes");
    expect(game.state.awaiting?.player).toBe(player);
    game.dispatch({ type: "choose-modes", player, modes: [option] });
  };

  it("each player votes, starting with its caster; a creature card for each wild vote, a permanent from hand for each free one", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      decks: [
        {
          player: A,
          // The first seven are the opening hand; the next the turn's draw.
          cards: [...Array<string>(8).fill("Island"), "Island", "Grizzly Bears", "Island", "Hill Giant", "Craw Wurm", ...Array<string>(30).fill("Island")],
        },
        { player: B, cards: Array<string>(40).fill("Island") },
        { player: C, cards: Array<string>(40).fill("Island") },
      ],
    });
    game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
    for (let i = 0; i < 6; i += 1) game.state.objects[game.debugSpawn("Forest", A, "battlefield")].tapped = false;
    const inHand = game.debugSpawn("Serra Angel", A, "hand");
    const spell = game.debugSpawn("Selvala's Stampede", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: spell, targets: [] });
    vote(game, A, 0);
    vote(game, B, 1);
    vote(game, C, 0);
    // Two wild votes: the Bears and the Hill Giant; one free: the Angel.
    game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [inHand] });
    game.advanceUntil(quiet);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    expect(named(game, "Hill Giant")).toHaveLength(1);
    expect(named(game, "Craw Wurm")).toHaveLength(0);
    expect(game.state.objects[inHand].zone).toBe("battlefield");
  });

  it("starts with the effect's controller, not the active player", () => {
    const game = setUp([A, B, C]);
    game.debugApplyEffect(B, {
      kind: "each-player-may",
      who: "each-player",
      startingWithYou: true,
      choices: [
        { text: "Vote for wild", effect: { kind: "sequence", effects: [] } },
        { text: "Vote for free", effect: { kind: "sequence", effects: [] } },
      ],
    });
    vote(game, B, 0);
    vote(game, C, 0);
    vote(game, A, 1);
  });
});

describe("Steward of the Harvest", () => {
  const offersOf = (game: Game, source: ObjectId) =>
    game.legalActions(A).filter(
      (o): o is Extract<LegalAction, { kind: "activate-ability" }> => o.kind === "activate-ability" && o.source === source,
    );

  it("gives your creatures the activated abilities of the land cards exiled with it, while it stays", () => {
    const game = setUp();
    const forest = game.debugSpawn("Forest", A, "graveyard");
    const wilds = game.debugSpawn("Evolving Wilds", A, "graveyard");
    game.debugSpawn("Island", A, "graveyard");
    const bears = ready(game, "Grizzly Bears");
    const sick = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const steward = game.debugSpawn("Steward of the Harvest", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(forest), obj(wilds)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[forest].zone).toBe("exile");
    expect(game.state.objects[wilds].zone).toBe("exile");
    // The Forest's "{T}: Add {G}" and Evolving Wilds' search.
    const texts = offersOf(game, bears).map((o) => o.text);
    expect(texts.some((t) => t.includes("Add {G}"))).toBe(true);
    expect(texts.some((t) => t.includes("Sacrifice"))).toBe(true);
    // Not opponents' creatures; and a summoning-sick one can't use {T}.
    expect(offersOf(game, sick)).toHaveLength(0);
    const tapForG = offersOf(game, bears).find((o) => o.text.includes("Add {G}"))!;
    game.dispatch({ type: "activate-ability", player: A, source: bears, abilityIndex: tapForG.abilityIndex, targets: [] });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["G"]);
    // Gone with Steward.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(steward)]);
    game.advanceUntil(quiet);
    game.state.objects[bears].tapped = false;
    expect(offersOf(game, bears)).toHaveLength(0);
  });

  it("an ability naming its land means the creature: Evolving Wilds' sacrifices the creature", () => {
    const game = setUp();
    const wilds = game.debugSpawn("Evolving Wilds", A, "graveyard");
    const bears = ready(game, "Grizzly Bears");
    game.debugSpawn("Steward of the Harvest", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(wilds)] });
    }
    game.advanceUntil(quiet);
    const search = offersOf(game, bears).find((o) => o.text.includes("Sacrifice"))!;
    game.dispatch({ type: "activate-ability", player: A, source: bears, abilityIndex: search.abilityIndex, targets: [] });
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });
});

describe("Opportunistic Dragon (for as long as it remains on the battlefield)", () => {
  const enter = (game: Game, target: ObjectId): ObjectId => {
    const dragon = game.debugSpawn("Opportunistic Dragon", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(target)] });
    }
    return dragon;
  };

  it("takes a Human or artifact, without its abilities and unable to attack or block, until it leaves", () => {
    const game = setUp();
    // Syr Konrad (a Human) pings each opponent whenever another creature
    // dies, whoever controls him — so only his missing ability keeps him
    // from seeing the Dragon's death below.
    const konrad = ready(game, "Syr Konrad, the Grim", B);
    const dragon = enter(game, konrad);
    game.advanceUntil(quiet);
    expect(game.state.objects[konrad].controller).toBe(A);
    expect(game.state.objects[konrad].modifiers.some((m) => m.loseAbilities === true)).toBe(true);
    expect(restrictionsOf(game.state, game.registry, konrad).has("cant-attack")).toBe(true);
    // Still so next turn: it lasts as long as the Dragon does.
    game.advanceUntil((s) => s.turn.number === 3 && s.priority.holder === A && s.turn.step === "precombat-main");
    expect(game.state.objects[konrad].controller).toBe(A);
    expect(restrictionsOf(game.state, game.registry, konrad).has("cant-block")).toBe(true);
    // The Dragon dies: it all ends — and Konrad, ability-less as the Dragon
    // died, doesn't see that death (rule 603.10a).
    const lives = [game.state.players[A].life, game.state.players[B].life];
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(dragon)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[konrad].controller).toBe(B);
    expect(game.state.objects[konrad].modifiers.some((m) => m.loseAbilities === true)).toBe(false);
    expect(restrictionsOf(game.state, game.registry, konrad).has("cant-attack")).toBe(false);
    expect([game.state.players[A].life, game.state.players[B].life]).toEqual(lives);
    // His ability is back: the next death pings.
    const bears = ready(game, "Grizzly Bears");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(lives[0] - 1);
  });

  it("does nothing if it has left before the ability resolves", () => {
    const game = setUp();
    const ring = ready(game, "Sol Ring", B);
    const dragon = game.debugSpawn("Opportunistic Dragon", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || s.zones.shared.stack.length > 0);
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(ring)] });
    }
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(dragon)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].controller).toBe(B);
    expect(game.state.whileSourceIds ?? []).toEqual([]);
  });

  it("ends as it leaves even when it's back before the event is over — a new object (rule 400.7)", () => {
    const game = setUp();
    const konrad = ready(game, "Syr Konrad, the Grim", B);
    const dragon = enter(game, konrad);
    game.advanceUntil(quiet);
    expect(game.state.objects[konrad].controller).toBe(A);
    const ring = ready(game, "Sol Ring", B);
    // Exiled and returned within one simultaneous instruction.
    game.debugApplyEffect(A, { kind: "sequence", simultaneous: true, effects: [{ kind: "flicker", target: 0 }] }, [obj(dragon)]);
    expect(game.state.objects[dragon].zone).toBe("battlefield");
    expect(game.state.objects[konrad].controller).toBe(B);
    expect(game.state.objects[konrad].modifiers.some((m) => m.loseAbilities === true)).toBe(false);
    // Its new enters trigger takes something else, for its new stint.
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: A, targets: [obj(ring)] });
    }
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].controller).toBe(A);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [obj(dragon)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].controller).toBe(B);
  });
});

describe("Divine Visitation", () => {
  const angel = "4/4 Vigilant Angel Token";

  it("makes creature tokens as 4/4 flying, vigilant Angels — and only creature tokens, and only yours", () => {
    const game = setUp();
    ready(game, "Divine Visitation");
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 2 });
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 1 });
    expect(count(game, named(game, angel))).toBe(2);
    expect(named(game, "Goblin Token")).toHaveLength(0);
    expect(named(game, "Treasure Token")).toHaveLength(1);
    expect(named(game, "Goblin Token", B)).toHaveLength(1);
    const [one] = named(game, angel);
    const c = game.characteristics(one);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect(c.keywords.has("flying") && c.keywords.has("vigilance")).toBe(true);
  });

  it("keeps the rest of what the effect does: tapped and attacking, haste, counters, a doubler", () => {
    const game = setUp();
    ready(game, "Divine Visitation");
    ready(game, "Anointed Procession");
    const ainok = ready(game, "Ainok Strike Leader");
    toAttackers(game);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ainok, defender: B }] });
    game.advanceUntil(quiet);
    const angels = named(game, angel);
    expect(count(game, angels)).toBe(2);
    for (const id of angels) {
      expect(game.state.objects[id].tapped).toBe(true);
      expect(game.state.objects[id].attacking).toBe(B);
    }
    game.debugApplyEffect(A, {
      kind: "create-token",
      token: "Goblin Token",
      count: 1,
      gainUntilEndOfTurn: ["haste"],
      thenCounters: { kind: "+1/+1", amount: 2 },
    });
    const hasty = named(game, angel).filter((id) => game.characteristics(id).keywords.has("haste"));
    expect(count(game, hasty)).toBe(2);
    for (const id of hasty) expect(game.characteristics(id).power).toBe(6);
  });

  it("replaces a token copy too, dropping its copy exceptions", () => {
    const game = setUp();
    ready(game, "Divine Visitation");
    const bears = ready(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1, gainsHaste: true }, [obj(bears)]);
    const [copy] = named(game, angel);
    expect(copy).toBeDefined();
    expect(game.characteristics(copy).keywords.has("haste")).toBe(false);
    expect(game.characteristics(copy).power).toBe(4);
    expect(named(game, "Grizzly Bears")).toEqual([bears]);
  });

  it("an encore copy made as an Angel still gains haste and must attack its opponent", () => {
    const game = setUp();
    ready(game, "Divine Visitation");
    const card = game.debugSpawn("Rakshasa Debaser", A, "exile");
    game.debugApplyEffect(A, { kind: "encore" }, [], { source: card });
    const [copy] = named(game, angel);
    expect(copy).toBeDefined();
    expect(game.characteristics(copy).keywords.has("haste")).toBe(true);
    expect(game.state.objects[copy].mustAttackPlayer).toBe(B);
    expect(game.state.objects[copy].sacrificeAtEndStep).toBe(true);
  });

  it("amass: the Angel made instead isn't an Army, so it gets no counters", () => {
    const game = setUp();
    ready(game, "Divine Visitation");
    game.debugApplyEffect(A, { kind: "amass", amount: 2, creatureType: "Zombie" });
    const [made] = named(game, angel);
    expect(made).toBeDefined();
    expect(game.state.objects[made].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.characteristics(made).subtypes).not.toContain("Zombie");
  });
});
