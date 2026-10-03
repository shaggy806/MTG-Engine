/**
 * `CopyOnEnter` (rule 707.9) beyond Clone's "any creature": a filter read
 * from the entering permanent's side, copy exceptions that are copiable
 * values (707.9a–b), what copying adds to how it enters (707.9e — tapped,
 * extra counters judged by what it became, 707.9f), and a copy that lasts
 * until end of turn (Cursed Mirror).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { supertypesOf } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

interface SetUp {
  readonly game: Game;
  readonly a: ScriptedController;
  readonly offered: ObjectId[][];
}

const setUp = (copy: (options: readonly ObjectId[]) => ObjectId | null = (o) => o[0] ?? null): SetUp => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const offered: ObjectId[][] = [];
  a.chooseCopyFn = (_view, _source, options) => {
    offered.push([...options]);
    return copy(options);
  };
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a, offered };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => {
  game.advanceUntil(quiet);
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const cast = (game: Game, name: string, targets: TargetRef[] = [], xValue?: number): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...(xValue !== undefined ? { xValue } : {}) });
  settle(game);
  return card;
};
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);

describe("copyOnEnter's filter", () => {
  it("is read from the entering permanent's side: 'a creature you control' offers none of an opponent's", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    const mine = spawn(s.game, "Grizzly Bears");
    spawn(s.game, "Serra Angel", B);
    const mimic = cast(s.game, "Glasspool Mimic");
    expect(s.offered).toEqual([[mine]]);
    expect(s.game.state.objects[mimic].copyOf).toBe("Grizzly Bears");
    // "Shapeshifter Rogue in addition to its other types" (a copy exception).
    expect(chars(s.game, mimic).subtypes).toEqual(expect.arrayContaining(["Bear", "Shapeshifter", "Rogue"]));
  });

  it("can ask for power as it is now (Deceptive Frostkite: power 4 or greater)", () => {
    const s = setUp();
    lands(s.game, "Island", 2);
    const angel = spawn(s.game, "Serra Angel");
    spawn(s.game, "Grizzly Bears");
    const kite = cast(s.game, "Deceptive Frostkite");
    expect(s.offered).toEqual([[angel]]);
    const c = chars(s.game, kite);
    expect([c.power, c.toughness]).toEqual([4, 4]);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Angel", "Dragon"]));
    expect(c.keywords.has("flying")).toBe(true);
  });

  it("reads an amount for the entering permanent (Mockingbird: mana value up to the mana spent)", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    const elves = spawn(s.game, "Llanowar Elves");
    spawn(s.game, "Serra Angel");
    const bird = cast(s.game, "Mockingbird", [], 2);
    // {X}{U} with X = 2 is three mana: the Elves (1) qualify, the Angel (5) doesn't.
    expect(s.offered).toEqual([[elves]]);
    expect(chars(s.game, bird).subtypes).toEqual(expect.arrayContaining(["Elf", "Druid", "Bird"]));
    expect(chars(s.game, bird).keywords.has("flying")).toBe(true);
  });

  it("can reach noncreature types, and the copy takes them (Phyrexian Metamorph copying Sol Ring)", () => {
    const s = setUp();
    lands(s.game, "Island", 4);
    const ring = spawn(s.game, "Sol Ring");
    spawn(s.game, "Grizzly Bears");
    s.a.chooseCopyFn = (_v, _s, options) => {
      s.offered.push([...options]);
      return ring;
    };
    const metamorph = cast(s.game, "Phyrexian Metamorph");
    expect(s.offered[0]).toHaveLength(2);
    // A copy of a noncreature artifact isn't a creature (its ruling).
    expect(chars(s.game, metamorph).types).toEqual(["artifact"]);
    expect(s.game.state.objects[metamorph].zone).toBe("battlefield");
  });
});

describe("what copying adds to how it enters (rule 707.9e)", () => {
  it("Vesuva enters tapped only if it copies", () => {
    const s = setUp();
    spawn(s.game, "Forest");
    const vesuva = s.game.debugSpawn("Vesuva", A, "hand");
    s.game.dispatch({ type: "play-land", player: A, card: vesuva });
    settle(s.game);
    expect(s.game.state.objects[vesuva].copyOf).toBe("Forest");
    expect(s.game.state.objects[vesuva].tapped).toBe(true);

    const t = setUp(() => null);
    spawn(t.game, "Forest");
    const plain = t.game.debugSpawn("Vesuva", A, "hand");
    t.game.dispatch({ type: "play-land", player: A, card: plain });
    settle(t.game);
    expect(t.game.state.objects[plain].copyOf).toBeNull();
    expect(t.game.state.objects[plain].tapped).toBe(false);
  });

  it("Spark Double's extra counter goes by what it became, and a copy of it doesn't get one", () => {
    const s = setUp();
    lands(s.game, "Island", 8);
    spawn(s.game, "Grizzly Bears");
    const double = cast(s.game, "Spark Double");
    expect(s.game.state.objects[double].counters["+1/+1"]).toBe(1);
    expect(s.game.state.objects[double].counters.loyalty).toBeUndefined();
    s.a.chooseCopyFn = () => double;
    const clone = cast(s.game, "Clone");
    expect(s.game.state.objects[clone].copyOf).toBe("Grizzly Bears");
    expect(s.game.state.objects[clone].counters["+1/+1"]).toBeUndefined();
  });

  it("Spark Double copying a planeswalker enters with its printed loyalty plus one", () => {
    const s = setUp();
    lands(s.game, "Island", 4);
    const nissa = spawn(s.game, "Nissa, Who Shakes the World");
    const double = cast(s.game, "Spark Double");
    expect(s.game.state.objects[double].copyOf).toBe("Nissa, Who Shakes the World");
    expect(s.game.state.objects[double].counters.loyalty).toBe(6);
    expect(s.game.state.objects[double].counters["+1/+1"]).toBeUndefined();
    // "It isn't legendary": both stay.
    expect(supertypesOf(registry, s.game.state.objects[double])).not.toContain("legendary");
    expect(s.game.state.objects[nissa].zone).toBe("battlefield");
  });

  it("Altered Ego enters with X additional +1/+1 counters, none if it copies nothing", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    lands(s.game, "Forest", 3);
    spawn(s.game, "Grizzly Bears");
    const ego = cast(s.game, "Altered Ego", [], 2);
    expect(s.game.state.objects[ego].copyOf).toBe("Grizzly Bears");
    expect(s.game.state.objects[ego].counters["+1/+1"]).toBe(2);
    expect(chars(s.game, ego).power).toBe(4);
  });
});

describe("copy exceptions are copiable values (rule 707.9a–b)", () => {
  it("Phantasmal Image's sacrifice trigger: on the copy, and on a copy of the copy", () => {
    const s = setUp();
    lands(s.game, "Island", 6);
    lands(s.game, "Forest", 2);
    spawn(s.game, "Serra Angel");
    const image = cast(s.game, "Phantasmal Image");
    expect(chars(s.game, image).subtypes).toEqual(expect.arrayContaining(["Angel", "Illusion"]));
    s.a.chooseCopyFn = () => image;
    const clone = cast(s.game, "Clone");
    expect(chars(s.game, clone).subtypes).toContain("Illusion");
    cast(s.game, "Giant Growth", [{ kind: "object", object: clone }]);
    expect(s.game.state.objects[clone].zone).toBe("graveyard");
    expect(s.game.state.objects[image].zone).toBe("battlefield");
    cast(s.game, "Giant Growth", [{ kind: "object", object: image }]);
    expect(s.game.state.objects[image].zone).toBe("graveyard");
  });

  it("a creature subtype exception doesn't stick to a copy that isn't a creature (rule 205.3d)", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    // A land that's a creature only for now: the copy is a plain land.
    const forest = spawn(s.game, "Forest");
    s.game.state.objects[forest].modifiers.push({
      power: 0,
      toughness: 0,
      keywords: [],
      setPt: [3, 3],
      addTypes: ["creature"],
      untilEndOfTurn: true,
      timestamp: s.game.state.timestampSeq + 1,
    });
    const mimic = cast(s.game, "Glasspool Mimic");
    expect(s.game.state.objects[mimic].copyOf).toBe("Forest");
    // It becomes a creature later: still no Shapeshifter Rogue (its ruling).
    s.game.state.objects[mimic].modifiers.push({
      power: 0,
      toughness: 0,
      keywords: [],
      setPt: [1, 1],
      addTypes: ["creature"],
      untilEndOfTurn: true,
      timestamp: s.game.state.timestampSeq + 2,
    });
    const c = chars(s.game, mimic);
    expect(c.types).toContain("creature");
    expect(c.subtypes).not.toContain("Shapeshifter");
    expect(c.subtypes).not.toContain("Rogue");
  });
});

describe("a copy until end of turn (Cursed Mirror)", () => {
  it("is the creature with haste this turn and itself again after the cleanup step", () => {
    const s = setUp();
    lands(s.game, "Mountain", 3);
    spawn(s.game, "Serra Angel", B);
    const mirror = cast(s.game, "Cursed Mirror");
    expect(s.game.state.objects[mirror].copyOf).toBe("Serra Angel");
    expect(chars(s.game, mirror).keywords.has("haste")).toBe(true);
    expect(chars(s.game, mirror).types).toContain("creature");
    s.game.advanceUntil((st) => st.turn.number === 2);
    expect(s.game.state.objects[mirror].copyOf).toBeNull();
    expect(chars(s.game, mirror).types).toEqual(["artifact"]);
    expect(chars(s.game, mirror).keywords.has("haste")).toBe(false);
  });

  it("doesn't pass its duration on: a Clone of it stays the creature, haste and all", () => {
    const s = setUp();
    lands(s.game, "Mountain", 3);
    lands(s.game, "Island", 4);
    spawn(s.game, "Serra Angel", B);
    const mirror = cast(s.game, "Cursed Mirror");
    s.a.chooseCopyFn = () => mirror;
    const clone = cast(s.game, "Clone");
    s.game.advanceUntil((st) => st.turn.number === 2);
    expect(s.game.state.objects[mirror].copyOf).toBeNull();
    expect(s.game.state.objects[clone].copyOf).toBe("Serra Angel");
    expect(chars(s.game, clone).keywords.has("haste")).toBe(true);
  });
});
