/**
 * The cards the amounts-statics features unblocked that the feature tests
 * (`copy-on-enter-options.test.ts`, `legend-rule-exemptions.test.ts`) don't
 * already pin: each one's own copy filter, exceptions and abilities.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { supertypesOf } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

interface SetUp {
  readonly game: Game;
  readonly a: ScriptedController;
  readonly offered: ObjectId[][];
}

const setUp = (
  pick: (options: readonly ObjectId[]) => ObjectId | null = (o) => o[0] ?? null,
  commander?: string,
): SetUp => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const offered: ObjectId[][] = [];
  a.chooseCopyFn = (_view, _source, options) => {
    offered.push([...options]);
    return pick(options);
  };
  a.chooseModesFn = () => [0];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      {
        player: A,
        cards: Array<string>(40).fill("Island"),
        ...(commander !== undefined ? { commanders: [commander] } : {}),
      },
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
const cast = (game: Game, name: string): ObjectId => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  settle(game);
  return card;
};
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);

describe("Sculpting Steel, Copy Artifact, Mirrormade, Copy Enchantment", () => {
  it("Sculpting Steel copies an artifact and only an artifact", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    const ring = spawn(s.game, "Sol Ring");
    spawn(s.game, "Grizzly Bears");
    spawn(s.game, "Phyrexian Arena");
    const steel = cast(s.game, "Sculpting Steel");
    expect(s.offered).toEqual([[ring]]);
    expect(s.game.state.objects[steel].copyOf).toBe("Sol Ring");
  });

  it("Copy Artifact is an enchantment in addition, with the artifact's colours", () => {
    const s = setUp();
    lands(s.game, "Island", 2);
    spawn(s.game, "Sol Ring");
    const copy = cast(s.game, "Copy Artifact");
    const c = chars(s.game, copy);
    expect([...c.types].sort()).toEqual(["artifact", "enchantment"]);
    expect([...c.colors]).toEqual([]);
  });

  it("Mirrormade copies an artifact or an enchantment; a copied Aura chooses what it enchants", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    lands(s.game, "Plains", 2);
    const bears = spawn(s.game, "Grizzly Bears", B);
    const pacifism = s.game.debugSpawn("Pacifism", A, "hand");
    s.game.dispatch({ type: "cast-spell", player: A, card: pacifism, targets: [{ kind: "object", object: bears }] });
    settle(s.game);
    expect(s.game.state.objects[pacifism].attachedTo).toBe(bears);
    const ring = spawn(s.game, "Sol Ring");
    const mirror = cast(s.game, "Mirrormade");
    expect([...s.offered[0]].sort()).toEqual([pacifism, ring].sort());
    expect(s.game.state.objects[mirror].copyOf).toBe("Pacifism");
    expect(s.game.state.objects[mirror].attachedTo).toBe(bears);
  });

  it("Copy Enchantment copies only an enchantment", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    const arena = spawn(s.game, "Phyrexian Arena");
    spawn(s.game, "Sol Ring");
    const copy = cast(s.game, "Copy Enchantment");
    expect(s.offered).toEqual([[arena]]);
    expect(s.game.state.objects[copy].copyOf).toBe("Phyrexian Arena");
  });
});

describe("Clever Impersonator, Masterwork of Ingenuity, Stunt Double, Malleable Impostor", () => {
  it("Clever Impersonator copies any nonland permanent, a planeswalker with its printed loyalty", () => {
    const s = setUp((options) => options.find((id) => s.game.state.objects[id].cardName.startsWith("Nissa")) ?? null);
    lands(s.game, "Island", 4);
    const nissa = spawn(s.game, "Nissa, Who Shakes the World", B);
    s.game.state.objects[nissa].counters.loyalty = 2;
    const ring = spawn(s.game, "Sol Ring");
    const imp = cast(s.game, "Clever Impersonator");
    expect([...s.offered[0]].sort()).toEqual([nissa, ring].sort());
    expect(s.game.state.objects[imp].copyOf).toBe("Nissa, Who Shakes the World");
    expect(s.game.state.objects[imp].counters.loyalty).toBe(5);
  });

  it("Masterwork of Ingenuity copies an Equipment and enters unattached", () => {
    const s = setUp();
    lands(s.game, "Island", 1);
    const bears = spawn(s.game, "Grizzly Bears");
    const boots = spawn(s.game, "Swiftfoot Boots");
    s.game.state.objects[boots].attachedTo = bears;
    const work = cast(s.game, "Masterwork of Ingenuity");
    expect(s.offered).toEqual([[boots]]);
    expect(s.game.state.objects[work].copyOf).toBe("Swiftfoot Boots");
    expect(s.game.state.objects[work].attachedTo).toBeNull();
  });

  it("Stunt Double has flash and copies any creature", () => {
    const s = setUp();
    lands(s.game, "Island", 4);
    spawn(s.game, "Serra Angel", B);
    s.game.advanceUntil((st) => st.turn.step === "end" && st.priority.holder === A);
    const double = cast(s.game, "Stunt Double");
    expect(s.game.state.objects[double].copyOf).toBe("Serra Angel");
  });

  it("Malleable Impostor copies only an opponent's creature, as a flying Faerie Shapeshifter too", () => {
    const s = setUp();
    lands(s.game, "Island", 4);
    spawn(s.game, "Grizzly Bears");
    const theirs = spawn(s.game, "Grizzly Bears", B);
    const imp = cast(s.game, "Malleable Impostor");
    expect(s.offered).toEqual([[theirs]]);
    const c = chars(s.game, imp);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Bear", "Faerie", "Shapeshifter"]));
    expect(c.keywords.has("flying")).toBe(true);
  });
});

describe("Auton Soldier, Sakashima the Impostor, Estrid's Invocation", () => {
  it("Auton Soldier isn't legendary, is an artifact too, and has myriad", () => {
    const s = setUp();
    lands(s.game, "Island", 6);
    const krenko = spawn(s.game, "Krenko, Mob Boss");
    const soldier = cast(s.game, "Auton Soldier");
    expect(s.game.state.objects[soldier].copyOf).toBe("Krenko, Mob Boss");
    expect(supertypesOf(registry, s.game.state.objects[soldier])).not.toContain("legendary");
    expect(chars(s.game, soldier).types).toEqual(expect.arrayContaining(["artifact", "creature"]));
    expect(s.game.state.objects[krenko].zone).toBe("battlefield");
    const myriad = s.game.state.objects[soldier].modifiers.some((m) =>
      (m.grantsTriggered ?? []).some((t) => t.text === "Myriad" && t.trigger.on === "attacks"),
    );
    expect(myriad).toBe(true);
  });

  it("Sakashima the Impostor is named Sakashima the Impostor, legendary, and can send itself home", () => {
    const s = setUp();
    lands(s.game, "Island", 8);
    spawn(s.game, "Grizzly Bears");
    const sakashima = cast(s.game, "Sakashima the Impostor");
    expect(nameOf(s.game.state.objects[sakashima])).toBe("Sakashima the Impostor");
    expect(supertypesOf(registry, s.game.state.objects[sakashima])).toContain("legendary");
    expect(chars(s.game, sakashima).power).toBe(2);
    const ability = s.game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === sakashima);
    expect(ability).toBeDefined();
    if (ability?.kind !== "activate-ability") throw new Error("no ability");
    s.game.dispatch({
      type: "activate-ability",
      player: A,
      source: sakashima,
      abilityIndex: ability.abilityIndex,
      targets: [],
    });
    settle(s.game);
    expect(s.game.state.objects[sakashima].zone).toBe("battlefield");
    s.game.advanceUntil((st) => st.turn.step === "cleanup" || st.turn.number === 2);
    expect(s.game.handOf(A)).toContain(sakashima);
  });

  it("Estrid's Invocation may blink itself each upkeep and choose again", () => {
    const s = setUp();
    lands(s.game, "Island", 3);
    const arena = spawn(s.game, "Phyrexian Arena");
    const invocation = cast(s.game, "Estrid's Invocation");
    expect(s.game.state.objects[invocation].copyOf).toBe("Phyrexian Arena");
    s.a.chooseCopyFn = (_v, _s, options) => {
      s.offered.push([...options]);
      return null;
    };
    s.game.advanceUntil((st) => st.turn.number === 3 && st.turn.step === "draw");
    // Blinked at A's upkeep: a new object, asked again, which this time
    // copied nothing.
    expect(s.offered).toHaveLength(2);
    expect(s.offered[1]).toContain(arena);
    const back = s.game.battlefield.find((id) => s.game.state.objects[id].cardName === "Estrid's Invocation");
    expect(back).toBeDefined();
    expect(s.game.state.objects[back!].copyOf).toBeNull();
  });
});

describe("Ghalta and Mavren — X from the other creatures attacking as it resolves", () => {
  const attackWith = (mode: number): SetUp => {
    const s = setUp();
    const ghalta = spawn(s.game, "Ghalta and Mavren");
    const angel = spawn(s.game, "Serra Angel");
    spawn(s.game, "Llanowar Elves");
    s.a.chooseModesFn = () => [mode];
    s.a.declareAttackersFn = () => [
      { attacker: ghalta, defender: B },
      { attacker: angel, defender: B },
    ];
    s.game.advanceUntil((st) => st.turn.step === "declare-attackers" && st.priority.holder === A && quiet(st));
    return s;
  };

  it("makes an attacking Dinosaur as big as the greatest other attacker", () => {
    const s = attackWith(0);
    const dinos = s.game.battlefield.filter((id) => s.game.state.objects[id].cardName === "X/X Dinosaur Token (Trample)");
    expect(dinos).toHaveLength(1);
    // Serra Angel's 4 — not Ghalta and Mavren's own 12, not the Elves at home.
    expect([chars(s.game, dinos[0]).power, chars(s.game, dinos[0]).toughness]).toEqual([4, 4]);
    expect(s.game.state.objects[dinos[0]].attacking).not.toBeNull();
    expect(s.game.state.objects[dinos[0]].tapped).toBe(true);
  });

  it("or a lifelink Vampire for each other attacker", () => {
    const s = attackWith(1);
    const vampires = s.game.battlefield.filter((id) => s.game.state.objects[id].cardName === "Lifelink Vampire Token");
    expect(vampires.reduce((n, id) => n + (s.game.state.objects[id].stackCount ?? 1), 0)).toBe(1);
  });
});

describe("Prime Speaker Zegana and One with the Machine — greatest-value amounts", () => {
  it("Zegana enters with the greatest other power in counters, then draws its power", () => {
    const s = setUp();
    lands(s.game, "Forest", 3);
    lands(s.game, "Island", 3);
    spawn(s.game, "Serra Angel");
    spawn(s.game, "Grizzly Bears");
    spawn(s.game, "Krenko, Mob Boss", B);
    const before = s.game.handOf(A).length;
    const zegana = cast(s.game, "Prime Speaker Zegana");
    // The Angel's 4 — not the opponent's creature, not itself.
    expect(s.game.state.objects[zegana].counters["+1/+1"]).toBe(4);
    expect(s.game.handOf(A).length - before).toBe(5);
  });

  it("One with the Machine draws the greatest mana value among your artifacts", () => {
    const s = setUp();
    lands(s.game, "Island", 4);
    spawn(s.game, "Sol Ring");
    spawn(s.game, "Swiftfoot Boots");
    const before = s.game.handOf(A).length;
    cast(s.game, "One with the Machine");
    expect(s.game.handOf(A).length - before).toBe(2);
  });
});

describe("Tangleweave Armor — +X/+X, X the greatest mana value among your commanders", () => {
  const germ = (game: Game): ObjectId | undefined =>
    game.battlefield.find((id) => game.state.objects[id].cardName === "Phyrexian Germ Token");

  it("reads a commander in the command zone, and moves with the Armor", () => {
    const s = setUp(undefined, "Krenko, Mob Boss");
    lands(s.game, "Forest", 8);
    const armor = cast(s.game, "Tangleweave Armor");
    const token = germ(s.game);
    expect(token).toBeDefined();
    expect(s.game.state.objects[armor].attachedTo).toBe(token);
    // Krenko, Mob Boss is {2}{R}{R}: mana value 4, from the command zone.
    expect([chars(s.game, token!).power, chars(s.game, token!).toughness]).toEqual([4, 4]);
    const bears = spawn(s.game, "Grizzly Bears");
    s.game.dispatch({
      type: "activate-ability",
      player: A,
      source: armor,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    settle(s.game);
    expect(chars(s.game, bears).power).toBe(6);
    // Unequipped, the Germ is a 0/0 and dies.
    expect(germ(s.game)).toBeUndefined();
  });

  it("with no commander, X is 0 and the Germ dies at once", () => {
    const s = setUp();
    lands(s.game, "Forest", 4);
    cast(s.game, "Tangleweave Armor");
    expect(germ(s.game)).toBeUndefined();
  });
});
