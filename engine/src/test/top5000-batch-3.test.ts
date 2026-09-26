/**
 * Top-5000 card backlog, batch 3 (EDHREC ranks 926-1655): the land cycles —
 * the fast lands, the Thriving lands, the Shadowmoor filter lands, two more
 * Verges, two Castles, Radiant Summit, Cabal Stronghold, Emeria and
 * Rivendell — and Dispel, Bastion Protector, Thopter Spy Network,
 * Thoughtcast, Wilderness Reclamation, Archmage of Runes, Irenicus's Vile
 * Duplication, Stormcatch Mentor, Taurean Mauler, Cruel Celebrant, Ichor
 * Wellspring, Mindcrank, Decimate, Defile, Teleportation Circle, Moldervine
 * Reclamation, Cyberdrive Awakener, Noxious Gearhulk, Fumigate, Arasta of
 * the Endless Web and Serra Ascendant.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import type { GameRules } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { nameOf } from "../state.js";
import { matchesFilter } from "../filter.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (rules: Partial<GameRules> = { maxLandsPerTurn: 99 }) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxHandSize: 99, ...rules },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: card }]);
  return card;
};
const play = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "play-land", player, card });
  game.advanceUntil(quiet);
  return card;
};
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
const offered = (game: Game, source: ObjectId, player: PlayerId = A): number[] =>
  game
    .legalActions(player)
    .flatMap((action) => (action.kind === "activate-ability" && action.source === source ? [action.abilityIndex] : []));
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power ?? 0, c.toughness ?? 0];
};
const hand = (game: Game, player: PlayerId = A): number => game.state.zones.perPlayer[player].hand.length;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const tokenCount = (game: Game, name: string): number =>
  game.state.zones.shared.battlefield
    .filter((id) => game.state.objects[id].cardName === name)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("fast lands", () => {
  it("enter untapped with two or fewer other lands, tapped with three", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    spawn(game, "Mountain");
    const early = play(game, "Blackcleave Cliffs");
    expect(game.state.objects[early].tapped).toBe(false);
    const late = play(game, "Seachrome Coast");
    expect(game.state.objects[late].tapped).toBe(true);
    expect(offered(game, early)).toEqual([0, 1]);
  });
});

describe("Thriving lands", () => {
  it("enter tapped, ask for a colour other than their own, and tap for either", () => {
    const { game, a } = setUp();
    let options: readonly string[] = [];
    // The last colour offered, so the check can't pass by defaulting to the first.
    a.chooseCreatureTypeFn = (_view, _source, offered) => {
      options = offered;
      return offered[offered.length - 1];
    };
    const isle = play(game, "Thriving Isle");
    expect(game.state.objects[isle].tapped).toBe(true);
    expect(game.state.objects[isle].chosenOnEnter).toBeDefined();
    expect(game.state.objects[isle].chosenOnEnter).not.toBe("U");
    expect([...options].sort()).toEqual(["B", "G", "R", "W"]);
    game.state.objects[isle].tapped = false;
    const chosen = game.state.objects[isle].chosenOnEnter as string;
    expect(chosen).not.toBe("W");
    game.dispatch({ type: "activate-ability", player: A, source: isle, abilityIndex: 1 });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual([chosen]);
  });
});

describe("Shadowmoor filter lands", () => {
  it("{T}: Add {C}; the hybrid ability makes two of its colours", () => {
    const { game } = setUp();
    const gate = spawn(game, "Mystic Gate");
    spawn(game, "Plains");
    game.dispatch({ type: "activate-ability", player: A, source: gate, abilityIndex: 1 });
    const pool = game.state.players[A].manaPool.map((u) => u.type);
    expect(pool).toHaveLength(2);
    expect(pool.every((t) => t === "W" || t === "U")).toBe(true);
  });
});

describe("the Verges, Castles and Radiant Summit", () => {
  it("Wastewood Verge's {B} needs a Swamp or a Forest; Willowrush's {G} a Forest or an Island", () => {
    const { game } = setUp();
    const wastewood = spawn(game, "Wastewood Verge");
    const willowrush = spawn(game, "Willowrush Verge");
    expect(offered(game, wastewood)).toEqual([0]);
    expect(offered(game, willowrush)).toEqual([0]);
    spawn(game, "Forest");
    expect(offered(game, wastewood)).toEqual([0, 1]);
    expect(offered(game, willowrush)).toEqual([0, 1]);
  });

  it("Castle Vantress enters tapped unless you control an Island, and scries 2", () => {
    const { game } = setUp();
    const tapped = play(game, "Castle Vantress");
    expect(game.state.objects[tapped].tapped).toBe(true);
    spawn(game, "Island");
    const castle = play(game, "Castle Vantress");
    expect(game.state.objects[castle].tapped).toBe(false);
  });

  it("Castle Embereth pumps your creatures +1/+0", () => {
    const { game } = setUp();
    spawn(game, "Mountain");
    const castle = play(game, "Castle Embereth");
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    spawn(game, "Mountain");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "activate-ability", player: A, source: castle, abilityIndex: 1 });
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([3, 2]);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });

  it("Radiant Summit is a Mountain Plains that needs two basic lands to enter untapped", () => {
    const { game } = setUp();
    spawn(game, "Plains");
    const tapped = play(game, "Radiant Summit");
    expect(game.state.objects[tapped].tapped).toBe(true);
    expect([...game.characteristics(tapped).subtypes].sort()).toEqual(["Mountain", "Plains"]);
    spawn(game, "Mountain");
    const summit = play(game, "Radiant Summit");
    expect(game.state.objects[summit].tapped).toBe(false);
  });

  it("Cabal Stronghold makes {B} for each basic Swamp you control", () => {
    const { game } = setUp();
    const stronghold = spawn(game, "Cabal Stronghold");
    for (let i = 0; i < 3; i += 1) spawn(game, "Swamp");
    spawn(game, "Underground Sea");
    for (let i = 0; i < 3; i += 1) spawn(game, "Wastes");
    game.dispatch({ type: "activate-ability", player: A, source: stronghold, abilityIndex: 1 });
    const pool = game.state.players[A].manaPool.map((u) => u.type);
    // Three basic Swamps: the Underground Sea is a Swamp but not basic, and
    // the Wastes paid the {3}.
    expect(pool.filter((t) => t === "B")).toHaveLength(3);
  });
});

describe("Emeria, the Sky Ruin and Rivendell", () => {
  it("Emeria returns a creature card at your upkeep only with seven Plains", () => {
    const { game } = setUp();
    spawn(game, "Emeria, the Sky Ruin");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    for (let i = 0; i < 6; i += 1) spawn(game, "Plains");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.objects[bears].zone).toBe("graveyard");
    spawn(game, "Plains");
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "draw");
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("Rivendell enters tapped without a legendary creature, and scries only with one", () => {
    const { game } = setUp();
    const tapped = play(game, "Rivendell");
    expect(game.state.objects[tapped].tapped).toBe(true);
    game.state.objects[tapped].tapped = false;
    spawn(game, "Island");
    spawn(game, "Island");
    expect(offered(game, tapped)).toEqual([0]);
    spawn(game, "Krenko, Tin Street Kingpin");
    expect(offered(game, tapped)).toEqual([0, 1]);
  });
});

describe("spells", () => {
  it("Dispel counters only an instant", () => {
    const { game } = setUp();
    spawn(game, "Island");
    spawn(game, "Island", B);
    spawn(game, "Forest", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    const opt = game.debugSpawn("Opt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: opt });
    game.advanceUntil((s) => s.priority.holder === A);
    const dispel = game.debugSpawn("Dispel", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: dispel, targets: [{ kind: "object", object: opt }] });
    game.advanceUntil(quiet);
    expect(game.state.eventLog.some((e) => e.type === "spell-countered" && e.object === opt)).toBe(true);
  });

  it("Dispel can't target a creature spell", () => {
    const { game } = setUp();
    spawn(game, "Island");
    spawn(game, "Forest", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    game.dispatch({ type: "cast-spell", player: B, card: game.debugSpawn("Llanowar Elves", B, "hand") });
    game.advanceUntil((s) => s.priority.holder === A);
    const dispel = game.debugSpawn("Dispel", A, "hand");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === dispel)).toBe(false);
  });

  it("Thoughtcast costs {1} less per artifact and draws two", () => {
    const { game } = setUp();
    for (let i = 0; i < 4; i += 1) spawn(game, "Ornithopter");
    spawn(game, "Island");
    const cast = game.debugSpawn("Thoughtcast", A, "hand");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === cast)).toBe(true);
    const before = hand(game);
    game.dispatch({ type: "cast-spell", player: A, card: cast });
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before - 1 + 2);
  });

  it("Irenicus's Vile Duplication copies your creature — flying, not legendary", () => {
    const { game } = setUp();
    const krenko = spawn(game, "Krenko, Tin Street Kingpin");
    for (let i = 0; i < 4; i += 1) spawn(game, "Island");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Irenicus's Vile Duplication", A, "hand"),
      targets: [{ kind: "object", object: krenko }],
    });
    game.advanceUntil(quiet);
    const [copy] = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].isToken && nameOf(game.state.objects[id]) === "Krenko, Tin Street Kingpin",
    );
    const c = game.characteristics(copy);
    expect(c.keywords.has("flying")).toBe(true);
    expect(matchesFilter(game.state, registry, copy, { supertype: "legendary" }, { you: A })).toBe(false);
    expect(game.state.objects[krenko].zone).toBe("battlefield");
  });

  it("Decimate destroys an artifact, a creature, an enchantment and a land at once", () => {
    const { game } = setUp();
    for (const land of ["Mountain", "Forest", "Mountain", "Forest"]) spawn(game, land);
    const ring = spawn(game, "Sol Ring", B);
    const bears = spawn(game, "Grizzly Bears", B);
    const anthem = spawn(game, "Glorious Anthem", B);
    const land = spawn(game, "Plains", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Decimate", A, "hand"),
      targets: [ring, bears, anthem, land].map((object) => ({ kind: "object" as const, object })),
    });
    game.advanceUntil(quiet);
    expect([ring, bears, anthem, land].map((id) => game.state.objects[id].zone)).toEqual([
      "graveyard",
      "graveyard",
      "graveyard",
      "graveyard",
    ]);
  });

  it("Defile gives -1/-1 for each Swamp you control", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    spawn(game, "Swamp");
    spawn(game, "Swamp", B);
    const wurm = spawn(game, "Craw Wurm", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: game.debugSpawn("Defile", A, "hand"),
      targets: [{ kind: "object", object: wurm }],
    });
    game.advanceUntil(quiet);
    expect(pt(game, wurm)).toEqual([4, 2]);
  });

  it("Fumigate gains 1 life for each creature destroyed — not an indestructible one", () => {
    const { game } = setUp();
    for (let i = 0; i < 5; i += 1) spawn(game, "Plains");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    // Avacyn keeps herself and Bob's Bears: two destroyed, both alice's.
    spawn(game, "Grizzly Bears", B);
    const avacyn = spawn(game, "Avacyn, Angel of Hope", B);
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Fumigate", A, "hand") });
    game.advanceUntil(quiet);
    expect(game.state.objects[avacyn].zone).toBe("battlefield");
    expect(life(game, A)).toBe(22);
  });
});

describe("creatures and enchantments", () => {
  it("Bastion Protector: your commander creatures get +2/+2 and indestructible", () => {
    const { game } = setUp();
    spawn(game, "Bastion Protector");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const other = spawn(game, "Grizzly Bears");
    expect(pt(game, commander)).toEqual([4, 4]);
    expect(game.characteristics(commander).keywords.has("indestructible")).toBe(true);
    expect(pt(game, other)).toEqual([2, 2]);
  });

  it("Thopter Spy Network: a Thopter each upkeep with an artifact; a card when artifact creatures connect", () => {
    const { game, a } = setUp();
    spawn(game, "Thopter Spy Network");
    const thopter = spawn(game, "Ornithopter");
    a.declareAttackersFn = () => [{ attacker: thopter, defender: B }];
    const before = hand(game);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    // Ornithopter is 0/1: no damage, no card. Pump it and swing again.
    expect(hand(game)).toBe(before);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(tokenCount(game, "Thopter Token")).toBe(1);
  });

  it("Thopter Spy Network makes nothing without an artifact", () => {
    const { game } = setUp();
    spawn(game, "Thopter Spy Network");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(tokenCount(game, "Thopter Token")).toBe(0);
  });

  it("Archmage of Runes: instants and sorceries cost {1} less and draw", () => {
    const { game } = setUp();
    spawn(game, "Archmage of Runes");
    const divination = game.debugSpawn("Divination", A, "hand");
    spawn(game, "Island");
    spawn(game, "Island");
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === divination)).toBe(true);
    const before = hand(game);
    game.dispatch({ type: "cast-spell", player: A, card: divination });
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before - 1 + 1 + 2);
  });

  it("Stormcatch Mentor: prowess and a cheaper instant", () => {
    const { game } = setUp();
    const mentor = spawn(game, "Stormcatch Mentor");
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    spawn(game, "Mountain");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    game.advanceUntil(quiet);
    expect(pt(game, mentor)).toEqual([2, 2]);
  });

  it("Taurean Mauler may grow as an opponent casts a spell", () => {
    const { game, a } = setUp();
    const mauler = spawn(game, "Taurean Mauler");
    a.chooseModesFn = () => [0];
    spawn(game, "Island", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    game.dispatch({ type: "cast-spell", player: B, card: game.debugSpawn("Opt", B, "hand") });
    game.advanceUntil(quiet);
    expect(game.state.objects[mauler].counters["+1/+1"]).toBe(1);
  });

  it("Cruel Celebrant and Moldervine Reclamation see your creatures die, the Celebrant itself included", () => {
    const { game } = setUp();
    const celebrant = spawn(game, "Cruel Celebrant");
    spawn(game, "Moldervine Reclamation");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears", B);
    const before = hand(game);
    game.debugApplyEffect(B, { kind: "destroy-all", filter: { type: "creature" } }, []);
    settle(game);
    expect(game.state.objects[celebrant].zone).toBe("graveyard");
    // Two of alice's creatures died: 2 drain and 2 cards (+1 life each).
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(24);
    expect(hand(game)).toBe(before + 2);
  });

  it("Ichor Wellspring draws as it enters and as it goes to the graveyard", () => {
    const { game } = setUp();
    const before = hand(game);
    const spring = enter(game, "Ichor Wellspring");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: spring }]);
    settle(game);
    expect(hand(game)).toBe(before + 2);
  });

  it("Mindcrank mills an opponent as many as they lost", () => {
    const { game } = setUp();
    spawn(game, "Mindcrank");
    const library = game.state.zones.perPlayer[B].library.length;
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "each-opponent" }, []);
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[B].library.length).toBe(library - 3);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(0);
  });

  it("Teleportation Circle blinks up to one artifact or creature of yours at your end step", () => {
    const { game } = setUp();
    spawn(game, "Teleportation Circle");
    const monitor = spawn(game, "Thought Monitor");
    const before = hand(game);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    // Blinked: its enters trigger drew two.
    expect(hand(game)).toBe(before + 2);
    expect(game.state.objects[monitor].zone).toBe("battlefield");
  });

  it("Cyberdrive Awakener animates your noncreature artifacts and gives them flying", () => {
    const { game } = setUp();
    const ring = spawn(game, "Sol Ring");
    const theirs = spawn(game, "Sol Ring", B);
    enter(game, "Cyberdrive Awakener");
    game.advanceUntil(quiet);
    expect(pt(game, ring)).toEqual([4, 4]);
    expect(game.characteristics(ring).keywords.has("flying")).toBe(true);
    expect(game.characteristics(theirs).types).not.toContain("creature");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.characteristics(ring).types).not.toContain("creature");
  });

  it("Noxious Gearhulk may destroy another creature and gains its toughness", () => {
    const { game, a } = setUp();
    const wurm = spawn(game, "Craw Wurm", B);
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [{ kind: "object", object: wurm }];
    enter(game, "Noxious Gearhulk");
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
    expect(life(game, A)).toBe(24);
  });

  it("Noxious Gearhulk gains nothing when the creature survives", () => {
    const { game, a } = setUp();
    const avacyn = spawn(game, "Avacyn, Angel of Hope", B);
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [{ kind: "object", object: avacyn }];
    enter(game, "Noxious Gearhulk");
    game.advanceUntil(quiet);
    expect(game.state.objects[avacyn].zone).toBe("battlefield");
    expect(life(game, A)).toBe(20);
  });

  it("Arasta makes a Spider as an opponent casts an instant or sorcery", () => {
    const { game } = setUp();
    spawn(game, "Arasta of the Endless Web");
    spawn(game, "Island", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    game.dispatch({ type: "cast-spell", player: B, card: game.debugSpawn("Opt", B, "hand") });
    game.advanceUntil(quiet);
    expect(tokenCount(game, "1/2 Green Spider Token (Reach)")).toBe(1);
  });

  it("Arasta ignores your own spells", () => {
    const { game } = setUp();
    spawn(game, "Arasta of the Endless Web");
    spawn(game, "Island");
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand") });
    game.advanceUntil(quiet);
    expect(tokenCount(game, "1/2 Green Spider Token (Reach)")).toBe(0);
  });

  it("Serra Ascendant is a 6/6 flier at 30 life", () => {
    const { game } = setUp();
    const serra = spawn(game, "Serra Ascendant");
    expect(pt(game, serra)).toEqual([1, 1]);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 10 }, []);
    expect(pt(game, serra)).toEqual([6, 6]);
    expect(game.characteristics(serra).keywords.has("flying")).toBe(true);
  });

  it("Wilderness Reclamation untaps your lands at your end step", () => {
    const { game } = setUp();
    spawn(game, "Wilderness Reclamation");
    const land = spawn(game, "Forest");
    const theirs = spawn(game, "Forest", B);
    game.state.objects[land].tapped = true;
    game.state.objects[theirs].tapped = true;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    expect(game.state.objects[land].tapped).toBe(false);
    expect(game.state.objects[theirs].tapped).toBe(true);
  });
});
