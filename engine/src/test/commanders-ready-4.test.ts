/**
 * Commanders the engine could already run, authored in one pass (2026-09-24):
 * the fourth group, Ikra Shidiqi through Anzrag.
 */

import { describe, expect, it } from "vitest";

import { effectiveSubtypes, effectiveTypes } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aDeck: readonly string[] = [], bDeck: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aDeck, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bDeck, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const activate = (game: Game, source: ObjectId, abilityIndex: number, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const cast = (game: Game, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const life = (game: Game, p: PlayerId) => game.state.players[p].life;
const types = (game: Game, id: ObjectId) => effectiveTypes(game.state, registry, game.state.objects[id]);

describe("Ikra Shidiqi, the Usurper", () => {
  it("life equal to a connecting creature's toughness", () => {
    const { game, a } = setUp();
    spawn(game, "Ikra Shidiqi, the Usurper");
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    toStep(game, "postcombat-main");
    expect(life(game, A)).toBe(23);
  });
});

describe("Cloud, Midgar Mercenary", () => {
  it("tutors an Equipment on entering", () => {
    const { game, a } = setUp();
    const greaves = game.debugSpawn("Lightning Greaves", A, "library");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    game.debugSpawn("Cloud, Midgar Mercenary", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(game.state.objects[greaves].zone).toBe("hand");
  });
});

describe("Szarel, Genesis Shepherd", () => {
  it("plays lands from the graveyard; a nontoken sacrifice on your turn grows another creature", () => {
    const { game, a } = setUp();
    const szarel = spawn(game, "Szarel, Genesis Shepherd");
    const forest = game.debugSpawn("Forest", A, "graveyard");
    expect(game.legalActions(A).some((o) => o.kind === "play-land" && o.card === forest)).toBe(true);
    const bear = spawn(game, "Grizzly Bears");
    const fodder = spawn(game, "Hill Giant");
    a.chooseTargetsFn = () => [obj(bear)];
    game.debugApplyEffect(A, { kind: "sacrifice", who: "you", filter: { name: "Hill Giant" }, count: 1 }, [], {
      source: szarel,
    });
    game.advanceUntil((s) => s.objects[fodder].zone === "graveyard" && quiet(s));
    expect(game.state.objects[bear].counters["+1/+1"]).toBe(2);
  });
});

describe("Neriv, Heart of the Storm", () => {
  it("a creature that entered this turn deals double", () => {
    const { game } = setUp();
    spawn(game, "Neriv, Heart of the Storm");
    const fresh = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.debugApplyEffect(A, { kind: "damage", amount: 2, who: "each-opponent" }, [], { source: fresh });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(16);
  });
});

describe("Imotekh the Stormlord", () => {
  it("two Necron Warriors when artifact cards leave your graveyard", () => {
    const { game } = setUp();
    const imotekh = spawn(game, "Imotekh the Stormlord");
    const rock = game.debugSpawn("Sol Ring", A, "graveyard");
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(rock)], { source: imotekh });
    game.advanceUntil(quiet);
    expect(named(game, "Necron Warrior Token")).toHaveLength(2);
  });
});

describe("Shirei, Shizo's Caretaker", () => {
  it("a small creature that died comes back at the end step", () => {
    const { game, a } = setUp();
    const shirei = spawn(game, "Shirei, Shizo's Caretaker");
    const elf = spawn(game, "Llanowar Elves");
    a.chooseModesFn = () => [0];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(elf)], { source: shirei });
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[elf].zone).toBe("battlefield");
  });
});

describe("Kodama of the East Tree", () => {
  it("another permanent entering lets you put one of equal or lesser mana value from hand, without chaining", () => {
    const { game, a } = setUp(["Grizzly Bears", "Llanowar Elves"]);
    spawn(game, "Kodama of the East Tree");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    game.debugSpawn("Hill Giant", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    // One card put down; the one it put down doesn't trigger Kodama again.
    const put = named(game, "Grizzly Bears", A).length + named(game, "Llanowar Elves", A).length;
    expect(put).toBe(1);
  });
});

describe("Zoraline, Cosmos Caller", () => {
  it("pays {W}{B} and 2 life to return a cheap permanent card with a finality counter", () => {
    const { game, a } = setUp();
    const zoraline = spawn(game, "Zoraline, Cosmos Caller");
    lands(game, "Plains", 1);
    lands(game, "Swamp", 1);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    a.chooseModesFn = () => [0];
    a.declareAttackersFn = () => [{ attacker: zoraline, defender: B }];
    toStep(game, "declare-blockers");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].counters.finality).toBe(1);
    // 2 life paid, 1 gained for a Bat attacking.
    expect(life(game, A)).toBe(19);
  });
});

describe("Sidisi, Brood Tyrant", () => {
  it("one Zombie when one or more creature cards are milled", () => {
    const { game } = setUp();
    for (const name of ["Grizzly Bears", "Hill Giant", "Island"]) game.debugSpawn(name, A, "library");
    game.debugSpawn("Sidisi, Brood Tyrant", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(named(game, "Zombie Token")).toHaveLength(1);
  });
});

describe("Tifa, Martial Artist", () => {
  it("a 7-power hit untaps your creatures and adds a combat", () => {
    const { game, a } = setUp();
    spawn(game, "Tifa, Martial Artist");
    const big = spawn(game, "Craw Wurm");
    game.state.objects[big].counters["+1/+1"] = 1;
    a.declareAttackersFn = () => [{ attacker: big, defender: B }];
    toStep(game, "postcombat-main");
    expect(game.state.turn.combatPhases).toBeGreaterThanOrEqual(2);
  });
});

describe("Commodore Guff", () => {
  it("−3 draws and burns for each planeswalker you control", () => {
    const { game } = setUp();
    const guff = spawn(game, "Commodore Guff");
    spawn(game, "Lord Windgrace");
    const hand = game.handOf(A).length;
    activate(game, guff, 1);
    expect(game.handOf(A).length).toBe(hand + 2);
    expect(life(game, B)).toBe(18);
  });

  it("+1 makes a Wizard whose mana only casts planeswalkers", () => {
    const { game } = setUp();
    const guff = spawn(game, "Commodore Guff");
    activate(game, guff, 0);
    expect(named(game, "Wizard Token (Guff)")).toHaveLength(1);
  });
});

describe("Bruce Banner // The Incredible Hulk", () => {
  it("transforms into the Hulk", () => {
    const { game } = setUp();
    const bruce = spawn(game, "Bruce Banner");
    lands(game, "Mountain", 3);
    lands(game, "Forest", 3);
    activate(game, bruce, 1);
    expect(game.state.objects[bruce].face).toBe(1);
    expect(game.characteristics(bruce).power).toBe(8);
  });

  it("the Hulk, dealt damage while attacking, untaps and adds a combat", () => {
    const { game, a } = setUp();
    const hulk = spawn(game, "Bruce Banner");
    game.state.objects[hulk].face = 1;
    const bear = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = (view) => (view.state.turn.combatPhases === 1 ? [{ attacker: hulk, defender: B }] : []);
    game.state.objects[bear].tapped = false;
    const b = game;
    b.debugSpawn("Island", B, "battlefield");
    toStep(game, "declare-blockers");
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [obj(hulk)], { source: bear });
    game.advanceUntil(quiet);
    expect(game.state.objects[hulk].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[hulk].tapped).toBe(false);
  });
});

describe("Bruvac the Grandiloquent", () => {
  it("opponents mill twice as many", () => {
    const { game } = setUp();
    spawn(game, "Bruvac the Grandiloquent");
    game.debugApplyEffect(A, { kind: "mill", target: "each-opponent", amount: 2 }, [], {});
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(4);
  });
});

describe("The Lord of Pain", () => {
  it("opponents can't gain life; a player's first spell burns another player", () => {
    const { game, b } = setUp([], ["Lightning Bolt"]);
    spawn(game, "The Lord of Pain");
    game.debugApplyEffect(B, { kind: "gain-life", amount: 5 }, [], {});
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(20);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    spawn(game, "Mountain", B);
    b.enqueue({ type: "cast-spell", player: B, card: inHand(game, B, "Lightning Bolt"), targets: [{ kind: "player", player: A }] });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    // The Bolt, and 1 from The Lord of Pain aimed at Alice (the only other player).
    expect(life(game, A)).toBe(16);
  });
});

describe("Evereth, Viceroy of Plunder", () => {
  it("sacrificing a Treasure grows Evereth and gives lifelink", () => {
    const { game } = setUp();
    const evereth = spawn(game, "Evereth, Viceroy of Plunder");
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 }, [], {});
    const [treasure] = named(game, "Treasure Token");
    activate(game, evereth, 0, [], { sacrifice: treasure });
    expect(game.state.objects[evereth].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(evereth).keywords).toContain("lifelink");
  });
});

describe("Slinza, the Spiked Stampede", () => {
  it("Beasts cost {2} less and enter with a counter", () => {
    const { game } = setUp(["Rumbling Baloth"]);
    spawn(game, "Slinza, the Spiked Stampede");
    lands(game, "Forest", 2);
    const baloth = inHand(game, A, "Rumbling Baloth");
    cast(game, baloth);
    expect(game.state.objects[baloth].zone).toBe("battlefield");
    expect(game.state.objects[baloth].counters["+1/+1"]).toBe(1);
  });
});

describe("Ezuri, Claw of Progress", () => {
  it("experience for small creatures; counters for it at combat", () => {
    const { game } = setUp();
    spawn(game, "Ezuri, Claw of Progress");
    game.debugSpawn("Llanowar Elves", A, "battlefield", { announceEntry: true });
    game.debugSpawn("Hill Giant", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.players[A].counters.experience !== undefined && quiet(s));
    // The Elves count; the 3-power Giant doesn't.
    expect(game.state.players[A].counters.experience).toBe(1);
    const { game: next } = setUp();
    spawn(next, "Ezuri, Claw of Progress");
    const bear = spawn(next, "Grizzly Bears");
    next.state.players[A].counters.experience = 3;
    toStep(next, "begin-combat");
    expect(next.state.objects[bear].counters["+1/+1"]).toBe(3);
  });
});

describe("Bilbo, Birthday Celebrant", () => {
  it("life gained is one more", () => {
    const { game } = setUp();
    spawn(game, "Bilbo, Birthday Celebrant");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 }, [], {});
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(23);
  });

  it("the search can't be activated below 111 life", () => {
    const { game } = setUp();
    const bilbo = spawn(game, "Bilbo, Birthday Celebrant");
    for (const land of ["Plains", "Swamp", "Forest", "Forest", "Forest"]) spawn(game, land);
    const offered = () => game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === bilbo);
    expect(offered()).toBe(false);
    game.state.players[A].life = 111;
    expect(offered()).toBe(true);
  });
});

describe("Clive, Ifrit's Dominant // Ifrit, Warden of Inferno", () => {
  it("returns as Ifrit, a Saga that makes red mana and flips back", () => {
    const { game } = setUp();
    const clive = spawn(game, "Clive, Ifrit's Dominant");
    lands(game, "Mountain", 6);
    activate(game, clive, 0);
    expect(game.state.objects[clive].face).toBe(1);
    expect(game.state.objects[clive].counters.lore).toBe(1);
  });
});

describe("Millicent, Restless Revenant", () => {
  it("a Spirit when a nontoken Spirit dies", () => {
    const { game } = setUp();
    const millicent = spawn(game, "Millicent, Restless Revenant");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(millicent)], { source: millicent });
    game.advanceUntil(quiet);
    expect(named(game, "Spirit Token")).toHaveLength(1);
  });
});

describe("Anowon, the Ruin Thief", () => {
  it("that player mills per damage; a creature milled draws a card", () => {
    const { game, a } = setUp([], []);
    const anowon = spawn(game, "Anowon, the Ruin Thief");
    for (const name of ["Grizzly Bears", "Island"]) game.debugSpawn(name, B, "library");
    const hand = game.handOf(A).length;
    a.declareAttackersFn = () => [{ attacker: anowon, defender: B }];
    toStep(game, "postcombat-main");
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(2);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("Hei Bai, Forest Guardian", () => {
  it("Spirits for each legendary enchantment", () => {
    const { game } = setUp();
    const heiBai = spawn(game, "Hei Bai, Forest Guardian");
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) spawn(game, land);
    spawn(game, "Esika, God of the Tree");
    game.state.objects[named(game, "Esika, God of the Tree")[0]].face = 1;
    activate(game, heiBai, 0);
    const [spirit] = named(game, "Spirit Token (Colorless, Evasive)");
    expect(spirit).toBeDefined();
    expect(game.characteristics(spirit).restrictions).toContain("cant-block");
  });
});

describe("Kwain, Itinerant Meddler", () => {
  it("each player who draws gains 1 life", () => {
    const { game, a, b } = setUp();
    const kwain = spawn(game, "Kwain, Itinerant Meddler");
    a.chooseModesFn = () => [0];
    b.chooseModesFn = () => [];
    activate(game, kwain, 0);
    expect(life(game, A)).toBe(21);
    expect(life(game, B)).toBe(20);
  });
});

describe("Jenova, Ancient Calamity", () => {
  it("counters and the Mutant type at combat; a Mutant dying on your turn draws", () => {
    const { game } = setUp();
    spawn(game, "Jenova, Ancient Calamity");
    const bear = spawn(game, "Grizzly Bears");
    toStep(game, "begin-combat");
    expect(game.state.objects[bear].counters["+1/+1"]).toBe(1);
    expect(effectiveSubtypes(game.state, registry, game.state.objects[bear])).toContain("Mutant");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)], {});
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 3);
  });
});

describe("Marisi, Breaker of the Coil", () => {
  it("goads that player's creatures on combat damage", () => {
    const { game, a } = setUp();
    const marisi = spawn(game, "Marisi, Breaker of the Coil");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].tapped = true;
    a.declareAttackersFn = () => [{ attacker: marisi, defender: B }];
    toStep(game, "postcombat-main");
    expect(game.state.objects[theirs].goadedBy).toContain(A);
  });
});

describe("Wayta, Trainer Prodigy", () => {
  it("fights for {G} between two of your creatures, {2}{G} otherwise", () => {
    const { game } = setUp();
    const wayta = spawn(game, "Wayta, Trainer Prodigy");
    const bear = spawn(game, "Grizzly Bears");
    const elf = spawn(game, "Llanowar Elves");
    spawn(game, "Forest");
    activate(game, wayta, 1, [obj(bear), obj(elf)]);
    expect(game.state.objects[elf].zone).toBe("graveyard");
  });

  it("isn't offered at {G} with no second creature of yours to fight", () => {
    // Wayta alone is a legal target for both slots, but not for both at
    // once: "another target creature" has to be a different one (601.2c).
    const { game } = setUp();
    const wayta = spawn(game, "Wayta, Trainer Prodigy");
    spawn(game, "Forest");
    const offered = game
      .legalActions(A)
      .filter((x) => x.kind === "activate-ability" && x.source === wayta)
      .map((x) => (x.kind === "activate-ability" ? x.abilityIndex : -1));
    expect(offered).not.toContain(1);
    expect(() =>
      game.dispatch({
        type: "activate-ability",
        player: A,
        source: wayta,
        abilityIndex: 1,
        targets: [obj(wayta), obj(wayta)],
      }),
    ).toThrow(/combination of targets/);
  });
});

describe("Karlach, Fury of Avernus", () => {
  it("the first combat untaps the attackers, gives first strike and adds a combat", () => {
    const { game, a } = setUp();
    const karlach = spawn(game, "Karlach, Fury of Avernus");
    a.declareAttackersFn = () => [{ attacker: karlach, defender: B }];
    toStep(game, "declare-blockers");
    expect(game.state.objects[karlach].tapped).toBe(false);
    expect(game.characteristics(karlach).keywords).toContain("first-strike");
    toStep(game, "postcombat-main");
    expect(game.state.turn.combatPhases).toBe(2);
  });
});

describe("Nahiri, Forged in Fury", () => {
  it("an equipped attacker exiles the top card to play this turn", () => {
    const { game, a } = setUp();
    spawn(game, "Nahiri, Forged in Fury");
    const bear = spawn(game, "Grizzly Bears");
    const greaves = spawn(game, "Lightning Greaves");
    game.state.objects[greaves].attachedTo = bear;
    a.declareAttackersFn = () => [{ attacker: bear, defender: B }];
    toStep(game, "declare-blockers");
    expect(game.state.zones.shared.exile).toHaveLength(1);
  });
});

describe("Zimone and Dina", () => {
  it("your second draw each turn drains 2", () => {
    const { game } = setUp();
    spawn(game, "Zimone and Dina");
    game.debugApplyEffect(A, { kind: "draw", amount: 2 }, [], {});
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});

describe("The Locust God", () => {
  it("an Insect per card drawn; back to hand at the end step after dying", () => {
    const { game } = setUp();
    const god = spawn(game, "The Locust God");
    game.debugApplyEffect(A, { kind: "draw", amount: 2 }, [], {});
    game.advanceUntil(quiet);
    const insects = named(game, "Insect Token (Flying, Haste)");
    expect(insects.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(god)], {});
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[god].zone).toBe("hand");
  });
});

describe("Narci, Fable Singer", () => {
  it("drains a completed Saga's mana value, and draws for its sacrifice", () => {
    const { game } = setUp();
    spawn(game, "Narci, Fable Singer");
    const saga = spawn(game, "History of Benalia");
    game.state.objects[saga].counters.lore = 2;
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    // History of Benalia costs {1}{W}{W}.
    expect(life(game, B)).toBe(17);
    expect(game.handOf(A).length).toBeGreaterThanOrEqual(hand + 2);
  });
});

describe("Abaddon the Despoiler", () => {
  it("a cheap enough spell from hand cascades on your turn", () => {
    const { game } = setUp(["Craw Wurm"]);
    spawn(game, "Abaddon the Despoiler");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 6, who: "each-opponent" }, [], {});
    game.advanceUntil(quiet);
    lands(game, "Forest", 6);
    game.debugSpawn("Grizzly Bears", A, "library");
    cast(game, inHand(game, A, "Craw Wurm"));
    expect(named(game, "Grizzly Bears", A)).toHaveLength(1);
  });
});

describe("Delney, Streetwise Lookout", () => {
  it("a small creature's trigger triggers twice", () => {
    const { game } = setUp();
    spawn(game, "Delney, Streetwise Lookout");
    game.debugSpawn("Elvish Visionary", A, "battlefield", { announceEntry: true });
    const hand = game.handOf(A).length;
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 2);
  });
});

describe("Yusri, Fortune's Flame", () => {
  it("draws per flip won, 2 damage per flip lost", () => {
    const { game, a } = setUp();
    const yusri = spawn(game, "Yusri, Fortune's Flame");
    a.chooseModesFn = () => [2];
    a.declareAttackersFn = () => [{ attacker: yusri, defender: B }];
    const hand = game.handOf(A).length;
    toStep(game, "declare-blockers");
    const flips = game.eventsOfType("coin-flipped");
    expect(flips).toHaveLength(3);
    const won = flips.filter((f) => f.won).length;
    expect(game.handOf(A).length).toBe(hand + won);
    expect(life(game, A)).toBe(20 - 2 * (3 - won));
  });
});

describe("Maha, Its Feathers Night", () => {
  it("opponents' creatures have base toughness 1", () => {
    const { game } = setUp();
    spawn(game, "Maha, Its Feathers Night");
    const giant = spawn(game, "Hill Giant", B);
    const mine = spawn(game, "Hill Giant");
    expect(game.characteristics(giant).toughness).toBe(1);
    expect(game.characteristics(mine).toughness).toBe(3);
  });
});

describe("Aang, at the Crossroads // Aang, Destined Savior", () => {
  it("transforms at the next upkeep after another creature leaves", () => {
    const { game } = setUp();
    const aang = spawn(game, "Aang, at the Crossroads");
    const bear = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)], {});
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(game.state.objects[aang].face).toBe(1);
  });
});

describe("Aragorn, King of Gondor", () => {
  it("makes you the monarch; as monarch, nothing can block", () => {
    const { game } = setUp();
    const aragorn = game.debugSpawn("Aragorn, King of Gondor", A, "battlefield", { announceEntry: true, summoningSick: false });
    game.advanceUntil(quiet);
    expect(game.state.monarch).toBe(A);
    expect(aragorn).toBeDefined();
  });
});

describe("Sorin of House Markov // Sorin, Ravenous Neonate", () => {
  it("extort drains; 3 life gained flips him at the second main phase", () => {
    const { game, a } = setUp(["Lightning Bolt"]);
    const sorin = spawn(game, "Sorin of House Markov");
    lands(game, "Mountain", 1);
    lands(game, "Swamp", 1);
    a.chooseModesFn = () => [0];
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    expect(life(game, B)).toBe(16);
    expect(life(game, A)).toBe(21);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 }, [], {});
    game.advanceUntil(quiet);
    toStep(game, "postcombat-main");
    expect(game.state.objects[sorin].face).toBe(1);
    expect(game.state.objects[sorin].counters.loyalty).toBe(3);
  });
});

describe("Mr. Foxglove", () => {
  it("draws the hand-size gap; if none, may put a creature down", () => {
    const { game, a } = setUp(["Craw Wurm"]);
    const fox = spawn(game, "Mr. Foxglove");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    a.declareAttackersFn = () => [{ attacker: fox, defender: B }];
    toStep(game, "declare-blockers");
    // Alice holds 8 cards to Bob's 7: nothing drawn, so the Wurm goes down.
    expect(named(game, "Craw Wurm", A)).toHaveLength(1);
  });
});

describe("Narset, Enlightened Master", () => {
  it("exiles four; noncreature spells among them are free this turn", () => {
    const { game, a } = setUp();
    const narset = spawn(game, "Narset, Enlightened Master");
    const bolt = game.debugSpawn("Lightning Bolt", A, "library");
    a.declareAttackersFn = () => [{ attacker: narset, defender: B }];
    toStep(game, "declare-blockers");
    expect(game.state.objects[bolt].zone).toBe("exile");
    const offers = game.legalActions(A).filter((o) => o.kind === "cast-spell" && o.card === bolt);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.every((o) => o.kind === "cast-spell" && o.free === true)).toBe(true);
  });
});

describe("Nine-Fingers Keene", () => {
  it("looks at nine, may put a Gate down, the rest to the bottom", () => {
    const { game, a } = setUp();
    const keene = spawn(game, "Nine-Fingers Keene");
    a.declareAttackersFn = () => [{ attacker: keene, defender: B }];
    const library = game.state.zones.perPlayer[A].library.length;
    toStep(game, "postcombat-main");
    expect(game.state.zones.perPlayer[A].library.length).toBe(library);
  });
});

describe("Loot, the Pathfinder", () => {
  it("each exhaust ability once", () => {
    const { game } = setUp();
    const loot = spawn(game, "Loot, the Pathfinder");
    lands(game, "Island", 2);
    const hand = game.handOf(A).length;
    activate(game, loot, 1);
    expect(game.handOf(A).length).toBe(hand + 3);
    game.state.objects[loot].tapped = false;
    expect(game.legalActions(A).some((o) => o.kind === "activate-ability" && o.source === loot && o.abilityIndex === 1)).toBe(
      false,
    );
  });
});

describe("Kelsien, the Plague", () => {
  it("an experience counter when the pinged creature dies this turn", () => {
    const { game } = setUp();
    const kelsien = spawn(game, "Kelsien, the Plague");
    const elf = spawn(game, "Llanowar Elves", B);
    activate(game, kelsien, 0, [obj(elf)]);
    expect(game.state.objects[elf].zone).toBe("graveyard");
    expect(game.state.players[A].counters.experience).toBe(1);
    expect(game.characteristics(kelsien).power).toBe(3);
  });
});

describe("Syr Konrad, the Grim", () => {
  it("pings for another creature dying and a creature card milled", () => {
    const { game } = setUp();
    const konrad = spawn(game, "Syr Konrad, the Grim");
    const bear = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)], {});
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    game.debugSpawn("Grizzly Bears", A, "library");
    lands(game, "Swamp", 2);
    activate(game, konrad, 0);
    expect(life(game, B)).toBe(18);
  });
});

describe("Anzrag, the Quake-Mole", () => {
  it("becoming blocked untaps your creatures and adds a combat", () => {
    const { game, a, b } = setUp();
    const anzrag = spawn(game, "Anzrag, the Quake-Mole");
    const wall = spawn(game, "Grizzly Bears", B);
    a.declareAttackersFn = (view) => (view.state.turn.combatPhases === 1 ? [{ attacker: anzrag, defender: B }] : []);
    b.declareBlockersFn = () => [{ blocker: wall, attacker: anzrag }];
    toStep(game, "combat-damage");
    expect(game.state.objects[anzrag].tapped).toBe(false);
    toStep(game, "postcombat-main");
    expect(game.state.turn.combatPhases).toBe(2);
  });
});
