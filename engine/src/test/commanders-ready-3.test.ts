/**
 * Commanders the engine could already run, authored in one pass (2026-09-24):
 * the third group, Umbris through Winter.
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

describe("Umbris, Fear Manifest", () => {
  it("an entering Horror exiles an opponent's library to a land; Umbris counts their exile", () => {
    const { game } = setUp();
    const umbris = game.debugSpawn("Umbris, Fear Manifest", A, "battlefield", { announceEntry: true });
    for (const name of ["Forest", "Grizzly Bears", "Lightning Bolt"]) game.debugSpawn(name, B, "library");
    game.advanceUntil(quiet);
    // Bolt, Bears, then the Forest: three cards exiled.
    expect(game.state.zones.shared.exile).toHaveLength(3);
    expect(game.characteristics(umbris).power).toBe(4);
  });
});

describe("Reyhan, Last of the Abzan", () => {
  it("enters with three counters, and passes a dead creature's counters on", () => {
    const { game, a } = setUp();
    const reyhan = spawn(game, "Reyhan, Last of the Abzan");
    expect(game.state.objects[reyhan].counters["+1/+1"]).toBe(3);
    const bear = spawn(game, "Grizzly Bears");
    game.state.objects[bear].counters["+1/+1"] = 2;
    a.chooseModesFn = () => [0];
    a.chooseTargetsFn = () => [obj(reyhan)];
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)], { source: reyhan });
    game.advanceUntil((s) => s.objects[reyhan].counters["+1/+1"] === 5);
    expect(game.state.objects[reyhan].counters["+1/+1"]).toBe(5);
  });
});

describe("Veyran, Voice of Duality", () => {
  it("magecraft triggers twice under its own doubling", () => {
    const { game } = setUp(["Lightning Bolt"]);
    const veyran = spawn(game, "Veyran, Voice of Duality");
    spawn(game, "Mountain");
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    expect(game.characteristics(veyran).power).toBe(4);
  });
});

describe("Clavileño, First of the Blessed", () => {
  it("an attacking Vampire becomes a Demon that leaves a card and a 4/3 behind", () => {
    const { game, a } = setUp();
    spawn(game, "Clavileño, First of the Blessed");
    const vampire = spawn(game, "Vampire Token");
    a.declareAttackersFn = () => [{ attacker: vampire, defender: B }];
    toStep(game, "declare-blockers");
    expect(effectiveSubtypes(game.state, registry, game.state.objects[vampire])).toContain("Demon");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(vampire)], { source: vampire });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
    const [demon] = named(game, "Vampire Demon Token");
    expect(game.state.objects[demon].tapped).toBe(true);
  });
});

describe("Rakdos, Lord of Riots", () => {
  it("can't be cast until an opponent has lost life; then creatures cost less", () => {
    const { game } = setUp(["Rakdos, Lord of Riots", "Craw Wurm"]);
    lands(game, "Swamp", 2);
    lands(game, "Mountain", 2);
    const rakdos = inHand(game, A, "Rakdos, Lord of Riots");
    expect(game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === rakdos)).toBe(false);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 4, who: "each-opponent" }, [], {});
    game.advanceUntil(quiet);
    cast(game, rakdos);
    expect(game.state.objects[rakdos].zone).toBe("battlefield");
    // Craw Wurm ({4}{G}{G}) now costs {G}{G}.
    lands(game, "Forest", 2);
    const wurm = inHand(game, A, "Craw Wurm");
    cast(game, wurm);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
  });
});

describe("Ketramose, the New Dawn", () => {
  it("can't attack with fewer than seven cards in exile; draws for an exile on your turn", () => {
    const { game } = setUp();
    const ketramose = spawn(game, "Ketramose, the New Dawn");
    expect(game.characteristics(ketramose).restrictions).toContain("cant-attack");
    const bear = spawn(game, "Grizzly Bears", B);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(bear)], { source: ketramose });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 1);
    expect(life(game, A)).toBe(19);
  });
});

describe("Ojer Axonil, Deepest Might // Temple of Power", () => {
  it("red noncombat damage to an opponent is at least its power", () => {
    const { game } = setUp(["Lightning Bolt"]);
    spawn(game, "Ojer Axonil, Deepest Might");
    spawn(game, "Mountain");
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    expect(life(game, B)).toBe(16);
  });

  it("returns as Temple of Power when it dies", () => {
    const { game } = setUp();
    const ojer = spawn(game, "Ojer Axonil, Deepest Might");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ojer)], { source: ojer });
    game.advanceUntil(quiet);
    expect(game.state.objects[ojer].zone).toBe("battlefield");
    expect(game.state.objects[ojer].face).toBe(1);
    expect(game.state.objects[ojer].tapped).toBe(true);
  });
});

describe("Gev, Scaled Scorch", () => {
  it("your creatures enter with a counter per opponent who lost life", () => {
    const { game } = setUp();
    spawn(game, "Gev, Scaled Scorch");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 1, who: "each-opponent" }, [], {});
    game.advanceUntil(quiet);
    const bear = spawn(game, "Grizzly Bears");
    expect(game.state.objects[bear].counters["+1/+1"]).toBe(1);
  });
});

describe("Lord Windgrace", () => {
  it("+2 draws an extra card when a land is discarded", () => {
    const { game } = setUp();
    const windgrace = spawn(game, "Lord Windgrace");
    const hand = game.handOf(A).length;
    activate(game, windgrace, 0);
    // The whole hand is Islands, so a land is discarded.
    expect(game.handOf(A).length).toBe(hand - 1 + 2);
  });

  it("−3 returns up to two land cards together", () => {
    const { game } = setUp();
    const windgrace = spawn(game, "Lord Windgrace");
    const one = game.debugSpawn("Forest", A, "graveyard");
    const two = game.debugSpawn("Swamp", A, "graveyard");
    activate(game, windgrace, 1, [obj(one), obj(two)]);
    expect(game.state.objects[one].zone).toBe("battlefield");
    expect(game.state.objects[two].zone).toBe("battlefield");
  });
});

describe("The Gitrog Monster", () => {
  it("draws when land cards hit your graveyard; sacrificed without a land", () => {
    const { game } = setUp();
    const gitrog = spawn(game, "The Gitrog Monster");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 3 }, [], { source: gitrog });
    game.advanceUntil(quiet);
    // One batch of three Islands: one draw.
    expect(game.handOf(A).length).toBe(hand + 1);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.objects[gitrog].zone).toBe("graveyard");
  });
});

describe("Okaun, Eye of Chaos and Zndrsplt, Eye of Wisdom", () => {
  it("each flip won doubles Okaun and draws for Zndrsplt", () => {
    const { game } = setUp();
    const okaun = spawn(game, "Okaun, Eye of Chaos");
    spawn(game, "Zndrsplt, Eye of Wisdom");
    const hand = game.handOf(A).length;
    toStep(game, "declare-attackers");
    const wins = game.eventsOfType("coin-flipped").filter((e) => e.won).length;
    // Both flip until they lose; every flip won draws once and doubles Okaun.
    expect(game.handOf(A).length).toBe(hand + wins);
    expect(game.characteristics(okaun).power).toBe(3 * 2 ** wins);
  });
});

describe("Katara, the Fearless", () => {
  it("an Ally's trigger triggers twice", () => {
    const { game } = setUp();
    spawn(game, "Katara, the Fearless");
    const toph = spawn(game, "Toph, the First Metalbender");
    spawn(game, "Forest");
    game.advanceUntil((s) => s.turn.number === 2);
    const creatures = game.state.zones.shared.battlefield.filter(
      (id) => types(game, id).includes("land") && types(game, id).includes("creature"),
    );
    // Two earthbends on the one land: four counters.
    expect(creatures).toHaveLength(1);
    expect(game.state.objects[creatures[0]].counters["+1/+1"]).toBe(4);
    expect(toph).toBeDefined();
  });
});

describe("Betor, Kin to All", () => {
  it("draws at 10 total toughness; drains half at 40", () => {
    const { game } = setUp();
    spawn(game, "Betor, Kin to All");
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.handOf(A).length).toBe(hand);
    const { game: big } = setUp();
    spawn(big, "Betor, Kin to All");
    for (let i = 0; i < 6; i += 1) spawn(big, "Colossal Dreadmaw");
    const before = big.handOf(A).length;
    big.advanceUntil((s) => s.turn.number === 2);
    expect(big.handOf(A).length).toBe(before + 1);
    expect(life(big, B)).toBe(10);
  });
});

describe("Nicol Bolas, the Ravager // Nicol Bolas, the Arisen", () => {
  it("flickers into the Arisen with seven loyalty", () => {
    const { game } = setUp();
    const bolas = spawn(game, "Nicol Bolas, the Ravager");
    for (const land of ["Island", "Swamp", "Mountain", "Island", "Swamp", "Mountain", "Island"]) spawn(game, land);
    activate(game, bolas, 0);
    expect(game.state.objects[bolas].face).toBe(1);
    expect(game.state.objects[bolas].counters.loyalty).toBe(7);
  });
});

describe("Quintorius, History Chaser", () => {
  it("a Spirit whenever cards leave your graveyard", () => {
    const { game } = setUp();
    const quint = spawn(game, "Quintorius, History Chaser");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "exile", target: 0 }, [obj(bears)], { source: quint });
    game.advanceUntil(quiet);
    expect(named(game, "Spirit Token (Red-White)")).toHaveLength(1);
  });

  it("+1 with an empty hand draws nothing", () => {
    const { game, a } = setUp();
    const quint = spawn(game, "Quintorius, History Chaser");
    game.debugApplyEffect(A, { kind: "discard-hand", who: "you" }, [], {});
    game.advanceUntil(quiet);
    a.chooseModesFn = () => [0];
    activate(game, quint, 0);
    expect(game.handOf(A)).toHaveLength(0);
  });
});

describe("Rocco, Cabaretti Caterer", () => {
  it("cast for X, fetches a creature with mana value X or less", () => {
    const { game, a } = setUp(["Rocco, Cabaretti Caterer"]);
    for (const land of ["Mountain", "Forest", "Plains", "Forest", "Forest"]) spawn(game, land);
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    game.debugSpawn("Craw Wurm", A, "library");
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    cast(game, inHand(game, A, "Rocco, Cabaretti Caterer"), [], { xValue: 2 });
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(named(game, "Craw Wurm")).toHaveLength(0);
  });
});

describe("Roxanne, Starfall Savant", () => {
  it("a tapped Meteorite on entering; tapping an artifact token adds one more", () => {
    const { game, a } = setUp();
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    game.debugSpawn("Roxanne, Starfall Savant", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    const [meteorite] = named(game, "Meteorite Token");
    expect(game.state.objects[meteorite].tapped).toBe(true);
    expect(life(game, B)).toBe(18);
    game.state.objects[meteorite].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: meteorite, abilityIndex: 0, targets: [], manaColors: ["R"] });
    expect(game.state.players[A].manaPool).toHaveLength(2);
    // A real token (a spawned "Treasure Token" is a card), sacrificed as it's tapped.
    game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 }, [], {});
    const [treasure] = named(game, "Treasure Token");
    game.dispatch({ type: "activate-ability", player: A, source: treasure, abilityIndex: 0, targets: [], manaColors: ["R"] });
    expect(game.state.players[A].manaPool).toHaveLength(4);
  });
});

describe("Jodah, Archmage Eternal", () => {
  it("any spell for {W}{U}{B}{R}{G}", () => {
    const { game } = setUp(["Craw Wurm"]);
    spawn(game, "Jodah, Archmage Eternal");
    for (const land of ["Plains", "Island", "Swamp", "Mountain", "Forest"]) spawn(game, land);
    const wurm = inHand(game, A, "Craw Wurm");
    const offer = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === wurm && o.altCost === true);
    expect(offer).toBeDefined();
    cast(game, wurm, [], { altCost: true });
    expect(game.state.objects[wurm].zone).toBe("battlefield");
  });
});

describe("Kratos, God of War", () => {
  it("everything has haste; each end step burns for creatures that didn't attack", () => {
    const { game } = setUp();
    spawn(game, "Kratos, God of War");
    const bear = game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(game.characteristics(bear).keywords).toContain("haste");
    game.advanceUntil((s) => s.turn.number === 2);
    // Kratos and the Bears stayed home.
    expect(life(game, A)).toBe(18);
  });
});

describe("Mirko, Obsessive Theorist", () => {
  it("grows on surveil; returns a smaller creature with a finality counter", () => {
    const { game, a } = setUp();
    const mirko = spawn(game, "Mirko, Obsessive Theorist");
    game.debugApplyEffect(A, { kind: "surveil", amount: 1 }, [], { source: mirko });
    game.advanceUntil(quiet);
    expect(game.state.objects[mirko].counters["+1/+1"]).toBe(1);
    const bears = game.debugSpawn("Llanowar Elves", A, "graveyard");
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    a.chooseModesFn = () => [0];
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].counters.finality).toBe(1);
  });
});

describe("Rowan, Scion of War", () => {
  it("black and red spells cost {X} less this turn, X the life you lost", () => {
    const { game } = setUp(["Craw Wurm", "Lightning Bolt"]);
    const rowan = spawn(game, "Rowan, Scion of War");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3 }, [], {});
    game.advanceUntil(quiet);
    activate(game, rowan, 0);
    expect(game.state.playerEffects).toHaveLength(1);
  });
});

describe("The Mycotyrant", () => {
  it("counts Fungi and Saprolings; makes a Fungus per descend", () => {
    const { game } = setUp();
    const myco = spawn(game, "The Mycotyrant");
    spawn(game, "Saproling Token");
    expect(game.characteristics(myco).power).toBe(2);
    game.debugApplyEffect(A, { kind: "mill", target: "you", amount: 2 }, [], { source: myco });
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.turn.number === 2);
    const fungi = named(game, "Fungus Token (Can't Block)");
    expect(fungi.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(game.characteristics(myco).power).toBe(4);
  });
});

describe("Wernog, Rider's Chaplain", () => {
  it("an opponent who doesn't investigate loses 1; you investigate once more per one who did", () => {
    const { game, b } = setUp();
    b.chooseModesFn = () => [];
    game.debugSpawn("Wernog, Rider's Chaplain", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(named(game, "Clue Token", A)).toHaveLength(1);
  });
});

describe("Toxrill, the Corrosive", () => {
  it("slime counters shrink their creatures, and one dying makes a Slug", () => {
    const { game } = setUp();
    spawn(game, "Toxrill, the Corrosive");
    const bear = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.characteristics(giant).power).toBe(2);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "upkeep");
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(named(game, "Slug Token", A).length).toBeGreaterThan(0);
  });
});

describe("The Master of Keys", () => {
  it("enters with X counters and mills twice X; enchantments in the graveyard can escape", () => {
    const { game } = setUp(["The Master of Keys"]);
    for (const land of ["Plains", "Island", "Swamp", "Island", "Island"]) spawn(game, land);
    const keys = inHand(game, A, "The Master of Keys");
    cast(game, keys, [], { xValue: 2 });
    expect(game.state.objects[keys].counters["+1/+1"]).toBe(2);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(4);
    const pacifism = game.debugSpawn("Pacifism", A, "graveyard");
    spawn(game, "Plains");
    spawn(game, "Plains");
    const escape = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === pacifism && o.via === "escape");
    expect(escape).toBeDefined();
  });
});

describe("Myrel, Shield of Argive", () => {
  it("opponents can't cast spells during your turn; attacking makes Soldiers", () => {
    const { game, a } = setUp([], ["Lightning Bolt"]);
    const myrel = spawn(game, "Myrel, Shield of Argive");
    spawn(game, "Mountain", B);
    const bolt = inHand(game, B, "Lightning Bolt");
    expect(game.legalActions(B).some((o) => o.kind === "cast-spell" && o.card === bolt)).toBe(false);
    a.declareAttackersFn = () => [{ attacker: myrel, defender: B }];
    toStep(game, "declare-blockers");
    expect(named(game, "Soldier Artifact Token")).toHaveLength(1);
  });
});

describe("Codie, Vociferous Codex", () => {
  it("you can't cast permanent spells", () => {
    const { game } = setUp(["Grizzly Bears"]);
    spawn(game, "Codie, Vociferous Codex");
    lands(game, "Forest", 2);
    const bears = inHand(game, A, "Grizzly Bears");
    expect(game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === bears)).toBe(false);
  });

  it("{4}, {T}: five colours, and the next spell exiles to a cheaper instant or sorcery to cast free", () => {
    const { game } = setUp(["Craw Wurm"]);
    const codie = spawn(game, "Codie, Vociferous Codex");
    lands(game, "Island", 4);
    game.debugSpawn("Lightning Bolt", A, "library");
    game.dispatch({ type: "activate-ability", player: A, source: codie, abilityIndex: 0, targets: [] });
    expect(game.state.players[A].manaPool).toHaveLength(5);
    expect(game.state.delayedTriggers).toHaveLength(1);
  });
});

describe("Goro-Goro and Satoru", () => {
  it("a Dragon when a creature that entered this turn connects", () => {
    const { game, a } = setUp();
    spawn(game, "Goro-Goro and Satoru");
    const fresh = game.debugSpawn("Grizzly Bears", A, "battlefield", { announceEntry: true });
    game.state.objects[fresh].summoningSick = false;
    a.declareAttackersFn = () => [{ attacker: fresh, defender: B }];
    toStep(game, "postcombat-main");
    expect(named(game, "Dragon Spirit Token")).toHaveLength(1);
  });
});

describe("Winter, Misanthropic Guide", () => {
  it("each player draws two in your upkeep", () => {
    const { game } = setUp();
    spawn(game, "Winter, Misanthropic Guide");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    const handB = game.handOf(B).length;
    expect(handB).toBeGreaterThanOrEqual(7 + 1 + 2);
  });
});
