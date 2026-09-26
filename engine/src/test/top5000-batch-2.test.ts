/**
 * Top-5000 card backlog, batch 2 (EDHREC ranks 697-930): the Verges, Elves of
 * Deep Shadow, Sheoldred, Whispering One, Tyvar's Stand, Rising of the Day,
 * Warstorm Surge, Oran-Rief, Abrupt Decay, Thought Monitor, Noble Hierarch,
 * Eladamri's Call, Cloudshift, Avacyn, Angel of Hope, Priest of Titania,
 * Elvish Archdruid, Elesh Norn, Grand Cenobite, Young Pyromancer,
 * Bloodthirsty Conqueror, Steel Overseer, Warleader's Call, Krenko, Tin
 * Street Kingpin, Eidolon of Blossoms, Resculpt, Rancor, Myr Retriever, Rite
 * of Replication, Revitalizing Repast, Sundering Eruption, Loyal Apprentice,
 * Danitha Capashen, Vanquish the Horde, Castle Locthwain, High Fae Trickster,
 * Valley Floodcaller, Spell Pierce, Ranger-Captain of Eos, Eldritch
 * Evolution, Springbloom Druid, Ghost Quarter, Tocasia's Welcome and Nadier's
 * Nightblade.
 */

import { describe, expect, it } from "vitest";

import { restrictionsOf } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import type { GameRules } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

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
/** `name` enters under `player`'s control — announced, unlike a spawn. */
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.debugApplyEffect(player, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: card }]);
  return card;
};
const castable = (game: Game, card: ObjectId, player: PlayerId = A): boolean =>
  game.legalActions(player).some((action) => action.kind === "cast-spell" && action.card === card);
const cast = (game: Game, card: ObjectId, targets: readonly ObjectId[] = [], player: PlayerId = A): void => {
  game.dispatch({
    type: "cast-spell",
    player,
    card,
    ...(targets.length > 0 ? { targets: targets.map((object) => ({ kind: "object" as const, object })) } : {}),
  });
};
const offered = (game: Game, source: ObjectId, index: number, player: PlayerId = A): boolean =>
  game
    .legalActions(player)
    .some((action) => action.kind === "activate-ability" && action.source === source && action.abilityIndex === index);
const activate = (game: Game, source: ObjectId, index: number, player: PlayerId = A): void =>
  game.dispatch({ type: "activate-ability", player, source, abilityIndex: index });
const tokensNamed = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** How many tokens those are — a compacted stack counts every token in it. */
const tokenCount = (game: Game, name: string): number =>
  tokensNamed(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power ?? 0, c.toughness ?? 0];
};
const hand = (game: Game, player: PlayerId = A): number => game.state.zones.perPlayer[player].hand.length;
/** Run state-based actions and triggers, then let the stack settle — an
 * effect applied from outside a resolution doesn't check them itself. */
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;

describe("the Verges", () => {
  it("the second colour only while you control one of its two land types", () => {
    for (const [verge, land] of [
      ["Thornspire Verge", "Forest"],
      ["Bleachbone Verge", "Plains"],
      ["Sunbillow Verge", "Mountain"],
      ["Riverpyre Verge", "Island"],
    ] as const) {
      const { game } = setUp();
      const id = spawn(game, verge);
      expect(offered(game, id, 0)).toBe(true);
      expect(offered(game, id, 1)).toBe(false);
      spawn(game, land);
      expect(offered(game, id, 1)).toBe(true);
    }
  });

  it("a Mountain an opponent controls doesn't count", () => {
    const { game } = setUp();
    const id = spawn(game, "Thornspire Verge");
    spawn(game, "Mountain", B);
    expect(offered(game, id, 1)).toBe(false);
  });
});

describe("Elves of Deep Shadow", () => {
  it("taps for {B} and deals 1 damage to you", () => {
    const { game } = setUp();
    const elves = spawn(game, "Elves of Deep Shadow");
    activate(game, elves, 0);
    expect(game.state.players[A].manaPool.map((unit) => unit.type)).toEqual(["B"]);
    expect(life(game, A)).toBe(19);
  });
});

describe("Sheoldred, Whispering One", () => {
  it("each opponent's upkeep they sacrifice a creature; your upkeep a creature card comes back", () => {
    const { game } = setUp();
    spawn(game, "Sheoldred, Whispering One");
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(game.state.objects[theirs].zone).toBe("graveyard");
    // Not on their upkeep: the card stays until yours.
    expect(game.state.objects[mine].zone).toBe("graveyard");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.objects[mine].zone).toBe("battlefield");
    expect(game.state.objects[mine].controller).toBe(A);
  });

  it("the opponent's creature card in their graveyard is no target", () => {
    const { game } = setUp();
    spawn(game, "Sheoldred, Whispering One");
    const theirs = game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(game.state.objects[theirs].zone).toBe("graveyard");
  });
});

describe("Tyvar's Stand", () => {
  it("+X/+X, hexproof and indestructible until end of turn", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    for (let i = 0; i < 4; i += 1) spawn(game, "Forest");
    const stand = game.debugSpawn("Tyvar's Stand", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: stand,
      xValue: 3,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([5, 5]);
    const keywords = game.characteristics(bears).keywords;
    expect(keywords.has("hexproof")).toBe(true);
    expect(keywords.has("indestructible")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(game.characteristics(bears).keywords.has("hexproof")).toBe(false);
  });
});

describe("Rising of the Day", () => {
  it("your creatures have haste; your legendary ones +1/+0", () => {
    const { game } = setUp();
    spawn(game, "Rising of the Day");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const krenko = spawn(game, "Krenko, Tin Street Kingpin");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(game.characteristics(bears).keywords.has("haste")).toBe(true);
    expect(game.characteristics(theirs).keywords.has("haste")).toBe(false);
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(pt(game, krenko)).toEqual([2, 2]);
  });
});

describe("Warstorm Surge", () => {
  it("an entering creature deals damage equal to its power — its lifelink included", () => {
    const { game, a } = setUp();
    spawn(game, "Warstorm Surge");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];
    enter(game, "Vampire Nighthawk");
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    // The Nighthawk dealt it, so its lifelink gained the life.
    expect(life(game, A)).toBe(22);
  });

  it("an opponent's creature entering doesn't trigger it", () => {
    const { game } = setUp();
    spawn(game, "Warstorm Surge");
    enter(game, "Grizzly Bears", B);
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(20);
    expect(life(game, B)).toBe(20);
  });
});

describe("Oran-Rief, the Vastwood", () => {
  it("a counter on each green creature that entered this turn, whoever controls it", () => {
    const { game } = setUp();
    const old = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    const oran = enter(game, "Oran-Rief, the Vastwood");
    expect(game.state.objects[oran].tapped).toBe(true);
    game.state.objects[oran].tapped = false;
    const fresh = enter(game, "Grizzly Bears");
    const theirs = enter(game, "Grizzly Bears", B);
    const blue = enter(game, "Ornithopter");
    activate(game, oran, 1);
    game.advanceUntil(quiet);
    expect(game.state.objects[fresh].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[theirs].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[old].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[blue].counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Abrupt Decay", () => {
  it("destroys a nonland permanent with mana value 3 or less — not a land, not a four-drop", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    spawn(game, "Forest");
    const ring = spawn(game, "Sol Ring", B);
    const big = spawn(game, "Thought Monitor", B);
    const land = spawn(game, "Forest", B);
    const decay = game.debugSpawn("Abrupt Decay", A, "hand");
    const offer = game
      .legalActions(A)
      .find((action) => action.kind === "cast-spell" && action.card === decay);
    if (offer?.kind !== "cast-spell") throw new Error("Abrupt Decay not offered");
    const options = offer.targetOptions?.[0]?.map((ref) => (ref.kind === "object" ? ref.object : null)) ?? [];
    expect(options).toContain(ring);
    expect(options).not.toContain(big);
    expect(options).not.toContain(land);
  });

  it("can't be countered", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    spawn(game, "Forest");
    const ring = spawn(game, "Sol Ring", B);
    spawn(game, "Island", B);
    spawn(game, "Island", B);
    const decay = game.debugSpawn("Abrupt Decay", A, "hand");
    cast(game, decay, [ring]);
    game.advanceUntil((s) => s.priority.holder === B);
    const counterspell = game.debugSpawn("Counterspell", B, "hand");
    cast(game, counterspell, [decay], B);
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("graveyard");
    expect(game.state.objects[decay].zone).toBe("graveyard");
  });
});

describe("Thought Monitor", () => {
  it("costs {1} less for each artifact you control, and draws two as it enters", () => {
    const { game } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Ornithopter");
    spawn(game, "Island");
    spawn(game, "Wastes");
    spawn(game, "Wastes");
    const monitor = game.debugSpawn("Thought Monitor", A, "hand");
    expect(castable(game, monitor)).toBe(false);
    spawn(game, "Wastes");
    expect(castable(game, monitor)).toBe(true);
    const before = hand(game);
    cast(game, monitor);
    game.advanceUntil(quiet);
    expect(game.state.objects[monitor].zone).toBe("battlefield");
    expect(hand(game)).toBe(before - 1 + 2);
  });
});

describe("Noble Hierarch", () => {
  it("exalted, and {G}, {W} or {U}", () => {
    const { game, a } = setUp();
    const hierarch = spawn(game, "Noble Hierarch");
    const bears = spawn(game, "Grizzly Bears");
    expect([0, 1, 2].every((i) => offered(game, hierarch, i))).toBe(true);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(17);
  });
});

describe("Eladamri's Call", () => {
  it("finds a creature card and puts it into your hand", () => {
    const { game, a } = setUp();
    spawn(game, "Forest");
    spawn(game, "Plains");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    const ring = game.debugSpawn("Sol Ring", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return [bears];
    };
    cast(game, game.debugSpawn("Eladamri's Call", A, "hand"));
    game.advanceUntil(quiet);
    expect(eligible).toContain(bears);
    expect(eligible).not.toContain(ring);
    expect(game.state.objects[bears].zone).toBe("hand");
  });
});

describe("Cloudshift", () => {
  it("blinks a creature you control: a new object, its enters trigger again", () => {
    const { game } = setUp();
    const monitor = spawn(game, "Thought Monitor");
    game.state.objects[monitor].counters["+1/+1"] = 2;
    spawn(game, "Plains");
    const before = hand(game);
    cast(game, game.debugSpawn("Cloudshift", A, "hand"), [monitor]);
    game.advanceUntil(quiet);
    expect(game.state.objects[monitor].zone).toBe("battlefield");
    expect(game.state.objects[monitor].counters["+1/+1"] ?? 0).toBe(0);
    expect(hand(game)).toBe(before + 2);
  });

  it("can't target a creature an opponent controls", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears", B);
    spawn(game, "Plains");
    expect(castable(game, game.debugSpawn("Cloudshift", A, "hand"))).toBe(false);
  });
});

describe("Avacyn, Angel of Hope", () => {
  it("your other permanents have indestructible and survive a wrath; an opponent's don't", () => {
    const { game } = setUp();
    const avacyn = spawn(game, "Avacyn, Angel of Hope");
    const bears = spawn(game, "Grizzly Bears");
    const land = spawn(game, "Plains");
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(game.characteristics(land).keywords.has("indestructible")).toBe(true);
    game.debugApplyEffect(B, { kind: "destroy-all", filter: { type: "creature" } }, []);
    game.advanceUntil(quiet);
    expect(game.state.objects[avacyn].zone).toBe("battlefield");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[theirs].zone).toBe("graveyard");
  });
});

describe("Priest of Titania and Elvish Archdruid", () => {
  it("Priest counts every Elf on the battlefield", () => {
    const { game } = setUp();
    const priest = spawn(game, "Priest of Titania");
    spawn(game, "Llanowar Elves");
    spawn(game, "Llanowar Elves", B);
    activate(game, priest, 0);
    expect(game.state.players[A].manaPool.map((unit) => unit.type)).toEqual(["G", "G", "G"]);
  });

  it("Archdruid pumps your other Elves and counts only the Elves you control", () => {
    const { game } = setUp();
    const druid = spawn(game, "Elvish Archdruid");
    const elves = spawn(game, "Llanowar Elves");
    const theirs = spawn(game, "Llanowar Elves", B);
    expect(pt(game, elves)).toEqual([2, 2]);
    expect(pt(game, druid)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([1, 1]);
    activate(game, druid, 0);
    expect(game.state.players[A].manaPool.map((unit) => unit.type)).toEqual(["G", "G"]);
  });
});

describe("Elesh Norn, Grand Cenobite", () => {
  it("+2/+2 to your other creatures, -2/-2 to an opponent's — their 2/2s die", () => {
    const { game } = setUp();
    const norn = spawn(game, "Elesh Norn, Grand Cenobite");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.advanceUntil(quiet);
    expect(pt(game, norn)).toEqual([4, 7]);
    expect(pt(game, bears)).toEqual([4, 4]);
    expect(pt(game, theirs)).toEqual([0, 0]);
    settle(game);
    expect(game.state.objects[theirs].zone).toBe("graveyard");
  });
});

describe("Young Pyromancer", () => {
  it("a 1/1 red Elemental for each instant or sorcery you cast — not a creature spell", () => {
    const { game } = setUp();
    spawn(game, "Young Pyromancer");
    spawn(game, "Island");
    spawn(game, "Forest");
    cast(game, game.debugSpawn("Opt", A, "hand"));
    game.advanceUntil(quiet);
    const [token] = tokensNamed(game, "1/1 Red Elemental Token");
    expect(token).toBeDefined();
    expect(pt(game, token)).toEqual([1, 1]);
    expect([...game.characteristics(token).colors]).toEqual(["R"]);
    cast(game, game.debugSpawn("Llanowar Elves", A, "hand"));
    game.advanceUntil(quiet);
    expect(tokenCount(game, "1/1 Red Elemental Token")).toBe(1);
  });
});

describe("Bloodthirsty Conqueror", () => {
  it("you gain as much life as an opponent loses", () => {
    const { game } = setUp();
    spawn(game, "Bloodthirsty Conqueror");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "each-opponent" }, []);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(23);
    // Your own loss doesn't count.
    game.debugApplyEffect(A, { kind: "lose-life", amount: 2 }, []);
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(21);
  });
});

describe("Steel Overseer", () => {
  it("a +1/+1 counter on each artifact creature you control", () => {
    const { game } = setUp();
    const overseer = spawn(game, "Steel Overseer");
    const thopter = spawn(game, "Ornithopter");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Ornithopter", B);
    activate(game, overseer, 0);
    game.advanceUntil(quiet);
    expect(game.state.objects[overseer].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[thopter].counters["+1/+1"]).toBe(1);
    expect(game.state.objects[bears].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[theirs].counters["+1/+1"] ?? 0).toBe(0);
  });
});

describe("Warleader's Call", () => {
  it("an anthem, and 1 damage to each opponent as a creature of yours enters", () => {
    const { game } = setUp();
    spawn(game, "Warleader's Call");
    const bears = enter(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(pt(game, bears)).toEqual([3, 3]);
    expect(life(game, B)).toBe(19);
    enter(game, "Grizzly Bears", B);
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(20);
  });
});

describe("Krenko, Tin Street Kingpin", () => {
  it("attacks: a +1/+1 counter, then Goblins equal to its power", () => {
    const { game, a } = setUp();
    const krenko = spawn(game, "Krenko, Tin Street Kingpin");
    a.declareAttackersFn = () => [{ attacker: krenko, defender: B }];
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-blockers");
    expect(pt(game, krenko)).toEqual([2, 3]);
    const goblins = tokensNamed(game, "Goblin Token");
    expect(goblins.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(2);
    expect(goblins.every((id) => !game.state.objects[id].attacking)).toBe(true);
  });
});

describe("Eidolon of Blossoms", () => {
  it("draws as it or another enchantment you control enters — not a creature", () => {
    const { game } = setUp();
    let before = hand(game);
    enter(game, "Eidolon of Blossoms");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    before = hand(game);
    enter(game, "Glorious Anthem");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    before = hand(game);
    enter(game, "Grizzly Bears");
    enter(game, "Glorious Anthem", B);
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before);
  });
});

describe("Resculpt", () => {
  it("exiles an artifact or creature; its controller gets a 4/4 blue and red Elemental", () => {
    const { game } = setUp();
    spawn(game, "Island");
    spawn(game, "Wastes");
    const theirs = spawn(game, "Sol Ring", B);
    cast(game, game.debugSpawn("Resculpt", A, "hand"), [theirs]);
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].zone).toBe("exile");
    const [token] = tokensNamed(game, "4/4 Blue Red Elemental Token");
    expect(game.state.objects[token].controller).toBe(B);
    expect(pt(game, token)).toEqual([4, 4]);
    expect([...game.characteristics(token).colors].sort()).toEqual(["R", "U"]);
  });
});

describe("Rancor", () => {
  it("+2/+0 and trample, and back to its owner's hand when it's put into a graveyard", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Forest");
    const rancor = game.debugSpawn("Rancor", A, "hand");
    cast(game, rancor, [bears]);
    game.advanceUntil(quiet);
    expect(game.state.objects[rancor].attachedTo).toBe(bears);
    expect(pt(game, bears)).toEqual([4, 2]);
    expect(game.characteristics(bears).keywords.has("trample")).toBe(true);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    expect(game.state.objects[rancor].zone).toBe("hand");
  });

  it("exiled instead, it stays in exile", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Forest");
    const rancor = game.debugSpawn("Rancor", A, "hand");
    cast(game, rancor, [bears]);
    game.advanceUntil(quiet);
    game.debugApplyEffect(B, { kind: "exile", target: 0 }, [{ kind: "object", object: rancor }]);
    (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(A);
    // Not put into a graveyard, so it never triggers.
    expect(game.state.zones.shared.stack).toHaveLength(0);
    game.advanceUntil(quiet);
    expect(game.state.objects[rancor].zone).toBe("exile");
  });
});

describe("Myr Retriever", () => {
  it("dies: another artifact card from your graveyard to your hand", () => {
    const { game } = setUp();
    const myr = spawn(game, "Myr Retriever");
    const ring = game.debugSpawn("Sol Ring", A, "graveyard");
    game.debugSpawn("Sol Ring", B, "graveyard");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: myr }]);
    settle(game);
    expect(game.state.objects[ring].zone).toBe("hand");
    expect(game.state.objects[myr].zone).toBe("graveyard");
  });

  it("never returns itself", () => {
    const { game } = setUp();
    const myr = spawn(game, "Myr Retriever");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: myr }]);
    settle(game);
    expect(game.state.objects[myr].zone).toBe("graveyard");
  });
});

describe("Rite of Replication", () => {
  it("a token copy of target creature under your control — five, kicked", () => {
    const { game } = setUp();
    for (let i = 0; i < 13; i += 1) spawn(game, "Island");
    const theirs = spawn(game, "Grizzly Bears", B);
    cast(game, game.debugSpawn("Rite of Replication", A, "hand"), [theirs]);
    game.advanceUntil(quiet);
    let copies = tokensNamed(game, "Grizzly Bears").filter((id) => game.state.objects[id].isToken);
    expect(copies).toHaveLength(1);
    expect(game.state.objects[copies[0]].controller).toBe(A);
    const rite = game.debugSpawn("Rite of Replication", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: rite,
      kicked: true,
      targets: [{ kind: "object", object: theirs }],
    });
    game.advanceUntil(quiet);
    copies = tokensNamed(game, "Grizzly Bears").filter((id) => game.state.objects[id].isToken);
    expect(copies.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0)).toBe(6);
  });
});

describe("Revitalizing Repast // Old-Growth Grove", () => {
  it("a +1/+1 counter and indestructible — or a land that enters tapped for {B} or {G}", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Swamp");
    cast(game, game.debugSpawn("Revitalizing Repast", A, "hand"), [bears]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].counters["+1/+1"]).toBe(1);
    expect(game.characteristics(bears).keywords.has("indestructible")).toBe(true);
    const grove = game.debugSpawn("Revitalizing Repast", A, "hand");
    const play = game.legalActions(A).find((action) => action.kind === "play-land" && action.card === grove);
    if (play?.kind !== "play-land") throw new Error("the land face isn't offered");
    game.dispatch({ type: "play-land", player: A, card: grove, ...(play.face !== undefined ? { face: play.face } : {}) });
    game.advanceUntil(quiet);
    expect(game.state.objects[grove].zone).toBe("battlefield");
    expect(game.state.objects[grove].tapped).toBe(true);
  });
});

describe("Sundering Eruption", () => {
  it("destroys a land, its controller may fetch a basic tapped, and creatures without flying can't block", () => {
    const { game, b } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Mountain");
    const target = spawn(game, "Forest", B);
    const basic = game.debugSpawn("Forest", B, "library");
    b.chooseFromZoneFn = () => [basic];
    const walker = spawn(game, "Grizzly Bears", B);
    const flier = spawn(game, "Vampire Nighthawk", B);
    cast(game, game.debugSpawn("Sundering Eruption", A, "hand"), [target]);
    game.advanceUntil(quiet);
    expect(game.state.objects[target].zone).toBe("graveyard");
    expect(game.state.objects[basic].zone).toBe("battlefield");
    expect(game.state.objects[basic].tapped).toBe(true);
    expect(restrictionsOf(game.state, registry, walker).has("cant-block")).toBe(true);
    expect(restrictionsOf(game.state, registry, flier).has("cant-block")).toBe(false);
    // One that enters later is bound too.
    const late = spawn(game, "Grizzly Bears", B);
    expect(restrictionsOf(game.state, registry, late).has("cant-block")).toBe(true);
  });

  it("Volcanic Fissure: pay 3 life or it enters tapped", () => {
    const { game, a } = setUp();
    a.payLifeForUntappedFn = () => true;
    const land = game.debugSpawn("Sundering Eruption", A, "hand");
    const play = game.legalActions(A).find((action) => action.kind === "play-land" && action.card === land);
    if (play?.kind !== "play-land") throw new Error("the land face isn't offered");
    game.dispatch({ type: "play-land", player: A, card: land, ...(play.face !== undefined ? { face: play.face } : {}) });
    game.advanceUntil(quiet);
    expect(game.state.objects[land].tapped).toBe(false);
    expect(life(game, A)).toBe(17);
  });
});

describe("Loyal Apprentice", () => {
  it("Lieutenant: a hasty Thopter at the beginning of combat, only while you control your commander", () => {
    const without = setUp();
    spawn(without.game, "Loyal Apprentice");
    without.game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "declare-attackers");
    expect(tokensNamed(without.game, "Thopter Token")).toHaveLength(0);

    const { game } = setUp();
    spawn(game, "Loyal Apprentice");
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "begin-combat" && quiet(s));
    const [thopter] = tokensNamed(game, "Thopter Token");
    expect(thopter).toBeDefined();
    expect(game.characteristics(thopter).keywords.has("haste")).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.characteristics(thopter).keywords.has("haste")).toBe(false);
  });
});

describe("Danitha Capashen, Paragon", () => {
  it("Aura and Equipment spells you cast cost {1} less", () => {
    const { game } = setUp();
    spawn(game, "Danitha Capashen, Paragon");
    spawn(game, "Wastes");
    const greaves = game.debugSpawn("Lightning Greaves", A, "hand");
    expect(castable(game, greaves)).toBe(true);
    const ring = game.debugSpawn("Mind Stone", A, "hand");
    expect(castable(game, ring)).toBe(false);
  });
});

describe("Vanquish the Horde", () => {
  it("costs {1} less for each creature on the battlefield, and destroys them all", () => {
    const { game } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Grizzly Bears");
    for (let i = 0; i < 2; i += 1) spawn(game, "Grizzly Bears", B);
    spawn(game, "Plains");
    spawn(game, "Plains");
    const vanquish = game.debugSpawn("Vanquish the Horde", A, "hand");
    expect(castable(game, vanquish)).toBe(false);
    spawn(game, "Grizzly Bears", B);
    expect(castable(game, vanquish)).toBe(true);
    cast(game, vanquish);
    game.advanceUntil(quiet);
    expect(game.state.zones.shared.battlefield.filter((id) => game.characteristics(id).types.includes("creature"))).toHaveLength(0);
  });
});

describe("Castle Locthwain", () => {
  it("enters tapped unless you control a Swamp; draws, then loses life equal to your hand", () => {
    const { game } = setUp();
    const first = game.debugSpawn("Castle Locthwain", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: first });
    expect(game.state.objects[first].tapped).toBe(true);
    spawn(game, "Swamp");
    const castle = game.debugSpawn("Castle Locthwain", A, "hand");
    game.dispatch({ type: "play-land", player: A, card: castle });
    expect(game.state.objects[castle].tapped).toBe(false);
    spawn(game, "Swamp");
    spawn(game, "Swamp");
    game.state.objects[first].tapped = false;
    const before = hand(game);
    activate(game, castle, 1);
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    expect(life(game, A)).toBe(20 - (before + 1));
  });
});

describe("High Fae Trickster and Valley Floodcaller", () => {
  it("High Fae Trickster: any spell at instant speed", () => {
    const { game } = setUp();
    spawn(game, "High Fae Trickster");
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const divination = game.debugSpawn("Divination", A, "hand");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.priority.holder === A);
    expect(castable(game, divination)).toBe(true);
    spawn(game, "Forest");
    expect(castable(game, bears)).toBe(true);
  });

  it("Valley Floodcaller: noncreature spells only; each one pumps and untaps your Otters", () => {
    const { game } = setUp();
    const otter = spawn(game, "Valley Floodcaller");
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    spawn(game, "Forest");
    const divination = game.debugSpawn("Divination", A, "hand");
    const bears = game.debugSpawn("Grizzly Bears", A, "hand");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.priority.holder === A);
    expect(castable(game, bears)).toBe(false);
    expect(castable(game, divination)).toBe(true);
    game.state.objects[otter].tapped = true;
    cast(game, divination);
    game.advanceUntil(quiet);
    expect(pt(game, otter)).toEqual([3, 3]);
    expect(game.state.objects[otter].tapped).toBe(false);
  });

  it("without them, a sorcery waits for your main phase", () => {
    const { game } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Island");
    const divination = game.debugSpawn("Divination", A, "hand");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.priority.holder === A);
    expect(castable(game, divination)).toBe(false);
  });
});

describe("Spell Pierce", () => {
  const setUpPierce = () => {
    const env = setUp();
    const { game } = env;
    spawn(game, "Island");
    spawn(game, "Island", B);
    spawn(game, "Island", B);
    spawn(game, "Island", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    const opt = game.debugSpawn("Opt", B, "hand");
    cast(game, opt, [], B);
    game.advanceUntil((s) => s.priority.holder === A);
    cast(game, game.debugSpawn("Spell Pierce", A, "hand"), [opt]);
    return { ...env, opt };
  };

  it("its controller declines to pay {2}: countered", () => {
    const { game, opt } = setUpPierce();
    game.advanceUntil(quiet);
    expect(game.state.objects[opt].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[B].hand).not.toContain(opt);
  });

  it("its controller pays {2}: it resolves", () => {
    const { game, b, opt } = setUpPierce();
    b.chooseModesFn = () => [0];
    const before = hand(game, B);
    game.advanceUntil(quiet);
    expect(hand(game, B)).toBe(before + 1);
    expect(
      game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].controller === B && game.state.objects[id].tapped),
    ).toHaveLength(3);
    expect(opt).toBeDefined();
  });

  it("targets only a noncreature spell", () => {
    const { game } = setUp();
    spawn(game, "Island");
    spawn(game, "Forest", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    cast(game, game.debugSpawn("Llanowar Elves", B, "hand"), [], B);
    game.advanceUntil((s) => s.priority.holder === A);
    expect(castable(game, game.debugSpawn("Spell Pierce", A, "hand"))).toBe(false);
  });
});

describe("Ranger-Captain of Eos", () => {
  it("finds a creature with mana value 1 or less as it enters", () => {
    const { game, a } = setUp();
    const elves = game.debugSpawn("Llanowar Elves", A, "library");
    const bears = game.debugSpawn("Grizzly Bears", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseModesFn = () => [0];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return options.includes(elves) ? [elves] : [];
    };
    enter(game, "Ranger-Captain of Eos");
    game.advanceUntil(quiet);
    expect(eligible).toContain(elves);
    expect(eligible).not.toContain(bears);
    expect(game.state.objects[elves].zone).toBe("hand");
  });

  it("sacrificed, your opponents can't cast noncreature spells this turn — creature spells, and you, still can", () => {
    const { game } = setUp();
    const captain = spawn(game, "Ranger-Captain of Eos");
    spawn(game, "Island");
    spawn(game, "Island", B);
    spawn(game, "Forest", B);
    activate(game, captain, 0);
    game.advanceUntil(quiet);
    expect(game.state.objects[captain].zone).toBe("graveyard");
    const theirOpt = game.debugSpawn("Opt", B, "hand");
    game.advanceUntil((s) => s.priority.holder === B);
    expect(castable(game, theirOpt, B)).toBe(false);
    expect(castable(game, game.debugSpawn("Llanowar Elves", B, "hand"), B)).toBe(false);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end" && s.priority.holder === A);
    expect(castable(game, game.debugSpawn("Opt", A, "hand"))).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep" && s.priority.holder === B);
    expect(castable(game, theirOpt, B)).toBe(true);
  });

  it("a creature spell at instant speed isn't barred", () => {
    const { game } = setUp();
    const captain = spawn(game, "Ranger-Captain of Eos");
    spawn(game, "Forest", B);
    spawn(game, "Forest", B);
    activate(game, captain, 0);
    game.advanceUntil(quiet);
    game.advanceUntil((s) => s.priority.holder === B);
    expect(castable(game, game.debugSpawn("Ambush Viper", B, "hand"), B)).toBe(true);
  });
});

describe("Eldritch Evolution", () => {
  it("sacrifice a creature, find one with mana value up to 2 more, and exile itself", () => {
    const { game, a } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest");
    const bears = spawn(game, "Grizzly Bears");
    const four = game.debugSpawn("Thought Monitor", A, "library");
    const big = game.debugSpawn("Avacyn, Angel of Hope", A, "library");
    const three = game.debugSpawn("Sheoldred, Whispering One", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return [];
    };
    const evolution = game.debugSpawn("Eldritch Evolution", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: evolution, sacrifice: bears });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    // Grizzly Bears is mana value 2: up to 4 — not Thought Monitor (7),
    // Sheoldred (7) or Avacyn (8).
    expect(eligible).not.toContain(four);
    expect(eligible).not.toContain(big);
    expect(eligible).not.toContain(three);
    expect(game.state.objects[evolution].zone).toBe("exile");
  });

  it("finds a creature at exactly 2 more", () => {
    const { game, a } = setUp();
    for (let i = 0; i < 3; i += 1) spawn(game, "Forest");
    const elves = spawn(game, "Llanowar Elves");
    const druid = game.debugSpawn("Elvish Archdruid", A, "library");
    const norn = game.debugSpawn("Elesh Norn, Grand Cenobite", A, "library");
    let eligible: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, options) => {
      eligible = options;
      return [druid];
    };
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Eldritch Evolution", A, "hand"), sacrifice: elves });
    game.advanceUntil(quiet);
    expect(eligible).toContain(druid);
    expect(eligible).not.toContain(norn);
    expect(game.state.objects[druid].zone).toBe("battlefield");
  });
});

describe("Springbloom Druid", () => {
  it("may sacrifice a land to fetch two basics tapped", () => {
    const { game, a } = setUp();
    const forest = spawn(game, "Forest");
    const first = game.debugSpawn("Plains", A, "library");
    const second = game.debugSpawn("Island", A, "library");
    a.chooseModesFn = () => [0];
    a.chooseFromZoneFn = () => [first, second];
    enter(game, "Springbloom Druid");
    game.advanceUntil(quiet);
    expect(game.state.objects[forest].zone).toBe("graveyard");
    expect([first, second].map((id) => game.state.objects[id].zone)).toEqual(["battlefield", "battlefield"]);
    expect([first, second].every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("with no land to sacrifice, nothing is found", () => {
    const { game, a } = setUp();
    const plains = game.debugSpawn("Plains", A, "library");
    a.chooseModesFn = () => [0];
    a.chooseFromZoneFn = () => [plains];
    enter(game, "Springbloom Druid");
    game.advanceUntil(quiet);
    expect(game.state.objects[plains].zone).toBe("library");
  });

  it("declined, nothing happens", () => {
    const { game } = setUp();
    const forest = spawn(game, "Forest");
    enter(game, "Springbloom Druid");
    game.advanceUntil(quiet);
    expect(game.state.objects[forest].zone).toBe("battlefield");
  });
});

describe("Ghost Quarter", () => {
  it("destroys a land; its controller may fetch a basic, untapped", () => {
    const { game, b } = setUp();
    const quarter = spawn(game, "Ghost Quarter");
    const target = spawn(game, "Urborg, Tomb of Yawgmoth", B);
    const basic = game.debugSpawn("Swamp", B, "library");
    b.chooseFromZoneFn = () => [basic];
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: quarter,
      abilityIndex: 1,
      targets: [{ kind: "object", object: target }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[quarter].zone).toBe("graveyard");
    expect(game.state.objects[target].zone).toBe("graveyard");
    expect(game.state.objects[basic].zone).toBe("battlefield");
    expect(game.state.objects[basic].tapped).toBe(false);
  });
});

describe("Tocasia's Welcome", () => {
  it("draws once a turn as creatures with mana value 3 or less enter", () => {
    const { game } = setUp();
    spawn(game, "Tocasia's Welcome");
    let before = hand(game);
    enter(game, "Thought Monitor");
    game.advanceUntil(quiet);
    // Mana value 7: no draw (Thought Monitor's own draws two).
    expect(hand(game)).toBe(before + 2);
    before = hand(game);
    enter(game, "Grizzly Bears");
    enter(game, "Llanowar Elves");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    before = hand(game);
    enter(game, "Grizzly Bears", B);
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before);
    enter(game, "Grizzly Bears");
    game.advanceUntil(quiet);
    expect(hand(game)).toBe(before + 1);
  });
});

describe("Nadier's Nightblade", () => {
  it("each token of yours leaving drains each opponent for 1 — a stack counting every token", () => {
    const { game } = setUp();
    spawn(game, "Nadier's Nightblade");
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 10 }, []);
    game.advanceUntil(quiet);
    game.debugApplyEffect(B, { kind: "return-to-hand-all", filter: { token: true } }, []);
    game.advanceUntil(quiet);
    expect(tokensNamed(game, "Goblin Token")).toHaveLength(0);
    expect(life(game, B)).toBe(10);
    expect(life(game, A)).toBe(30);
  });

  it("an opponent's token, or a nontoken, doesn't count", () => {
    const { game } = setUp();
    spawn(game, "Nadier's Nightblade");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 1 }, []);
    game.advanceUntil(quiet);
    game.debugApplyEffect(B, { kind: "return-to-hand-all", filter: { type: "creature", notName: "Nadier's Nightblade" } }, []);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("hand");
    expect(life(game, B)).toBe(20);
  });
});
