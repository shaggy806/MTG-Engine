/**
 * Statics that reach other permanents through a `CardFilter` scope
 * (`AffectSpec` `scope: "filter"`), grant them types in layer 4
 * (`StaticAbility.addTypes` / `addSubtypes`) and set their base P/T in layer
 * 7b (`setBasePt`), plus the one-shot `animate-all` effect.
 *
 * What the tests pin down, rule by rule:
 * - 613.1d: a type granted in layer 4 is a type everywhere — filters,
 *   targeting, sacrifice costs, other statics' scopes all see it.
 * - 613.4b / 613.4c: a base P/T set in 7b sits under counters (7c) and
 *   bonuses (7d).
 * - 613.7: within a layer, timestamp order — a static against an `animate`;
 *   613.8: except that a type grant applies after the additions its scope
 *   depends on (Kudo reaches a land animated after it arrived).
 * - 613.6: a static's later layers reach what its layer-4 part reached.
 * - A grant ends the moment its source leaves or its condition turns false.
 */

import { describe, expect, it } from "vitest";

import { setComputedCacheCheck, withComputedCache } from "../characteristics.js";
import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A lord keyed on a subtype other statics grant. */
const bearBanner = defineCard({
  name: "Bear Banner",
  manaCost: "{1}",
  types: ["enchantment"],
  text: "Bears you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Bear" },
      grantPt: [1, 1],
      text: "Bears you control get +1/+1.",
    },
  ],
});

/** Two type grants whose scopes each read the other's grant. */
const bearsAreElves = defineCard({
  name: "Bears Are Elves",
  manaCost: "{1}",
  types: ["enchantment"],
  text: "Bears are Elves in addition to their other types.",
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Bear" } },
      addSubtypes: ["Elf"],
      text: "Bears are Elves in addition to their other types.",
    },
  ],
});
const elvesAreBears = defineCard({
  name: "Elves Are Bears",
  manaCost: "{1}",
  types: ["enchantment"],
  text: "Elves are Bears in addition to their other types.",
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Elf" } },
      addSubtypes: ["Bear"],
      text: "Elves are Bears in addition to their other types.",
    },
  ],
});

/** A type grant gated on a condition that reads the very subtype it grants. */
const bearCult = defineCard({
  name: "Bear Cult",
  manaCost: "{1}",
  types: ["enchantment"],
  text: "As long as you control a Bear, other creatures you control are Bears.",
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you" },
      },
      condition: { kind: "controls", filter: { subtype: "Bear" }, atLeast: 1 },
      addSubtypes: ["Bear"],
      text: "As long as you control a Bear, other creatures you control are Bears.",
    },
  ],
});

/** A type grant with a P/T part, for rule 613.6. */
const bearKin = defineCard({
  name: "Bear Kin",
  manaCost: "{1}",
  types: ["enchantment"],
  text: "Bears are Elves in addition to their other types and get +1/+1.",
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Bear" } },
      addSubtypes: ["Elf"],
      grantPt: [1, 1],
      text: "Bears are Elves in addition to their other types and get +1/+1.",
    },
  ],
});

/** A filter scope that asks about keywords — waits for layer 6. */
const skyBlessing = defineCard({
  name: "Sky Blessing",
  manaCost: "{1}",
  types: ["enchantment"],
  text: "Creatures you control with flying get +0/+2.",
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", keyword: "flying" },
      },
      grantPt: [0, 2],
      text: "Creatures you control with flying get +0/+2.",
    },
  ],
});

const registry = createDefaultRegistry();
for (const def of [bearKin, bearBanner, bearsAreElves, elvesAreBears, bearCult, skyBlessing]) {
  registry.register(def);
}

function makeGame() {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil(
    (s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A,
  );
  return { game, a, b };
}

const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = game.characteristics(id);
  return [c.power, c.toughness];
};
const subtypes = (game: Game, id: ObjectId) => game.characteristics(id).subtypes;
const types = (game: Game, id: ObjectId) => game.characteristics(id).types;
const matches = (game: Game, id: ObjectId, filter: Parameters<typeof matchesFilter>[3]) =>
  matchesFilter(game.state, registry, id, filter, { you: A });
const toTurn = (game: Game, n: number, step = "precombat-main") =>
  game.advanceUntil(
    (s) =>
      s.turn.number === n &&
      s.turn.step === step &&
      s.zones.shared.stack.length === 0,
  );

describe("layer 4: types granted to other permanents", () => {
  it("is seen by filters, targeting and other statics' scopes", () => {
    const { game } = makeGame();
    const elf = spawn(game, "Llanowar Elves", A);
    const theirs = spawn(game, "Llanowar Elves", B);
    spawn(game, "Bear Banner", A);
    expect(matches(game, elf, { subtype: "Bear" })).toBe(false);

    spawn(game, "Kudo, King Among Bears", A);
    expect(subtypes(game, elf)).toEqual(["Elf", "Druid", "Bear"]);
    expect(subtypes(game, theirs)).toContain("Bear");
    expect(matches(game, elf, { subtype: "Bear" })).toBe(true);
    expect(matches(game, elf, { subtypes: ["Human", "Bear"] })).toBe(true);
    // Bear Banner's lord clause reads the granted subtype: 2/2 base, +1/+1.
    expect(pt(game, elf)).toEqual([3, 3]);
    // Bear Banner is A's, so B's Elf gets only the base P/T.
    expect(pt(game, theirs)).toEqual([2, 2]);
  });

  it("stops the moment the source leaves the battlefield", () => {
    const { game } = makeGame();
    const elf = spawn(game, "Llanowar Elves", A);
    const kudo = spawn(game, "Kudo, King Among Bears", B);
    expect(pt(game, elf)).toEqual([2, 2]);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: kudo }]);
    expect(game.state.objects[kudo].zone).toBe("graveyard");
    expect(pt(game, elf)).toEqual([1, 1]);
    expect(subtypes(game, elf)).not.toContain("Bear");
  });

  it("orders against an animate effect by timestamp", () => {
    // Kudo first, Turn to Frog later: the Frog's set subtypes and 1/1 win.
    const first = makeGame().game;
    first.debugSpawn("Kudo, King Among Bears", A);
    const bear = spawn(first, "Grizzly Bears", B);
    first.debugApplyEffect(
      A,
      registry.get("Turn to Frog").effect!,
      [{ kind: "object", object: bear }],
    );
    expect(subtypes(first, bear)).toEqual(["Frog"]);
    expect(pt(first, bear)).toEqual([1, 1]);

    // The Frog first, Kudo later: a 2/2 Frog Bear.
    const second = makeGame().game;
    const frog = spawn(second, "Grizzly Bears", B);
    second.debugApplyEffect(
      A,
      registry.get("Turn to Frog").effect!,
      [{ kind: "object", object: frog }],
    );
    second.debugSpawn("Kudo, King Among Bears", A);
    expect(subtypes(second, frog)).toEqual(["Frog", "Bear"]);
    expect(pt(second, frog)).toEqual([2, 2]);
  });

  it("applies a grant after the effects that make its scope match (613.8)", () => {
    // Kudo first, Bello later: Kudo's "other creatures" depends on Bello
    // making the Archive a creature, so it still becomes a Bear. Its base
    // P/T is Bello's 4/4 — 7b stays in timestamp order.
    const { game } = makeGame();
    spawn(game, "Kudo, King Among Bears", A);
    spawn(game, "Bello, Bard of the Brambles", A);
    const archive = spawn(game, "Hedron Archive", A);
    expect(subtypes(game, archive)).toEqual(["Bear", "Elemental"]);
    expect(pt(game, archive)).toEqual([4, 4]);

    // A Sol Ring animated after Kudo arrived is a Bear too, and the
    // animation's later 3/3 wins over Kudo's 2/2.
    const ring = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(
      B,
      {
        kind: "animate",
        target: 0,
        power: 3,
        toughness: 3,
        addTypes: ["creature"],
        addSubtypes: [],
        duration: "end-of-turn",
      },
      [{ kind: "object", object: ring }],
    );
    expect(subtypes(game, ring)).toEqual(["Bear"]);
    expect(pt(game, ring)).toEqual([3, 3]);
  });

  it("keeps a static's later layers to what its layer-4 part reached (613.6)", () => {
    const { game } = makeGame();
    spawn(game, "Bear Kin", A);
    const bear = spawn(game, "Grizzly Bears", A);
    expect(subtypes(game, bear)).toEqual(["Bear", "Elf"]);
    expect(pt(game, bear)).toEqual([3, 3]);
    // Turn to Frog, later, replaces its subtypes: no longer a Bear or an
    // Elf. Bear Kin reached it in layer 4, before the Frog, so its +1/+1
    // still applies on top of the Frog's 1/1.
    game.debugApplyEffect(
      A,
      registry.get("Turn to Frog").effect!,
      [{ kind: "object", object: bear }],
    );
    expect(subtypes(game, bear)).toEqual(["Frog"]);
    expect(pt(game, bear)).toEqual([2, 2]);
  });

  it("doesn't loop when two grants' scopes read each other's grants", () => {
    const { game } = makeGame();
    spawn(game, "Bears Are Elves", A);
    spawn(game, "Elves Are Bears", A);
    const bear = spawn(game, "Grizzly Bears", A);
    const elf = spawn(game, "Llanowar Elves", A);
    // Timestamp order: "Bears are Elves" applies first, so a printed Bear
    // becomes an Elf and then a Bear again; a printed Elf wasn't a Bear yet
    // when the first applied, so it only becomes a Bear.
    expect(subtypes(game, bear)).toEqual(["Bear", "Elf"]);
    expect(subtypes(game, elf)).toEqual(["Elf", "Druid", "Bear"]);
  });

  it("doesn't loop when a grant's condition reads the subtype it grants", () => {
    const { game } = makeGame();
    const elf = spawn(game, "Llanowar Elves", A);
    spawn(game, "Bear Cult", A);
    expect(subtypes(game, elf)).not.toContain("Bear");
    spawn(game, "Grizzly Bears", A);
    expect(subtypes(game, elf)).toContain("Bear");
  });

  it("keeps the computed-value cache consistent", () => {
    const { game } = makeGame();
    spawn(game, "Kudo, King Among Bears", A);
    spawn(game, "Bello, Bard of the Brambles", A);
    spawn(game, "Hedron Archive", A);
    spawn(game, "Bear Banner", A);
    spawn(game, "Bear Cult", A);
    spawn(game, "Llanowar Elves", A);
    setComputedCacheCheck(true);
    try {
      withComputedCache(() => {
        for (let i = 0; i < 2; i += 1) {
          for (const id of game.state.zones.shared.battlefield) game.characteristics(id);
          game.legalActions(A);
        }
      });
    } finally {
      setComputedCacheCheck(false);
    }
  });
});

describe("filter scopes", () => {
  it("wait for layer 6 when they ask about keywords", () => {
    const { game } = makeGame();
    spawn(game, "Sky Blessing", A);
    const bird = spawn(game, "Grizzly Bears", A);
    expect(pt(game, bird)).toEqual([2, 2]);
    game.debugApplyEffect(
      A,
      { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" },
      [{ kind: "object", object: bird }],
    );
    expect(pt(game, bird)).toEqual([2, 4]);
  });

  it("follow control changes", () => {
    const { game } = makeGame();
    spawn(game, "Don Andres, the Renegade", A);
    const mine = spawn(game, "Grizzly Bears", A);
    const stolen = spawn(game, "Grizzly Bears", B);
    expect(pt(game, stolen)).toEqual([2, 2]);
    game.debugApplyEffect(
      A,
      { kind: "gain-control", target: 0, untilEndOfTurn: true },
      [{ kind: "object", object: stolen }],
    );
    expect(game.state.objects[stolen].controller).toBe(A);
    expect(pt(game, stolen)).toEqual([4, 4]);
    expect(subtypes(game, stolen)).toContain("Pirate");
    expect([...game.characteristics(stolen).keywords].sort()).toEqual(["deathtouch", "menace"]);
    expect(pt(game, mine)).toEqual([2, 2]);
    // Control returns at cleanup, and the bonus goes with it.
    toTurn(game, 2);
    expect(game.state.objects[stolen].controller).toBe(B);
    expect(pt(game, stolen)).toEqual([2, 2]);
    expect(subtypes(game, stolen)).not.toContain("Pirate");
  });
});

describe("layer 7b: base P/T set on other permanents", () => {
  it("sits under counters and pumps", () => {
    const { game } = makeGame();
    spawn(game, "Kudo, King Among Bears", A);
    const giant = spawn(game, "Hill Giant", B);
    expect(pt(game, giant)).toEqual([2, 2]);
    game.debugApplyEffect(
      A,
      { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 },
      [{ kind: "object", object: giant }],
    );
    expect(pt(game, giant)).toEqual([4, 4]);
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 3, toughness: 3, duration: "end-of-turn" },
      [{ kind: "object", object: giant }],
    );
    expect(pt(game, giant)).toEqual([7, 7]);
  });

  it("goes over a copy exception's base P/T, which is a copiable value", () => {
    const { game } = makeGame();
    const wurm = spawn(game, "Wurmcoil Engine", A);
    const copyOf = () =>
      game.state.zones.shared.battlefield.find(
        (id) => id !== wurm && game.state.objects[id].cardName === "Wurmcoil Engine",
      )!;
    game.debugApplyEffect(
      A,
      { kind: "create-token-copy", of: 0, count: 1, basePt: [1, 1] },
      [{ kind: "object", object: wurm }],
    );
    const copy = copyOf();
    expect(pt(game, copy)).toEqual([1, 1]);
    spawn(game, "Kudo, King Among Bears", B);
    expect(pt(game, copy)).toEqual([2, 2]);
    game.debugApplyEffect(
      A,
      {
        kind: "animate",
        target: 0,
        power: 5,
        toughness: 5,
        addTypes: [],
        addSubtypes: [],
        duration: "end-of-turn",
      },
      [{ kind: "object", object: copy }],
    );
    expect(pt(game, copy)).toEqual([5, 5]);
  });

  it("covers every token in a stack without splitting it", () => {
    const { game } = makeGame();
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 10 });
    const stack = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    )!;
    expect(game.state.objects[stack].stackCount).toBe(10);
    spawn(game, "Kudo, King Among Bears", A);
    expect(pt(game, stack)).toEqual([2, 2]);
    expect(subtypes(game, stack)).toEqual(["Goblin", "Bear"]);
    expect(game.state.objects[stack].stackCount).toBe(10);
  });
});

describe("animate-all", () => {
  it("animates every match at once until end of turn, stack whole", () => {
    const { game } = makeGame();
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 9 });
    const stack = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    )!;
    const ring = spawn(game, "Sol Ring", A);
    const theirs = spawn(game, "Sol Ring", B);
    game.debugApplyEffect(A, {
      kind: "animate-all",
      filter: { controlledBy: "you" },
      power: 5,
      toughness: 5,
      addTypes: ["creature"],
      addSubtypes: ["Golem"],
      duration: "end-of-turn",
    });
    expect(types(game, ring)).toEqual(["artifact", "creature"]);
    expect(pt(game, ring)).toEqual([5, 5]);
    expect(pt(game, stack)).toEqual([5, 5]);
    expect(game.state.objects[stack].stackCount).toBe(9);
    expect(types(game, theirs)).toEqual(["artifact"]);
    toTurn(game, 2);
    expect(types(game, ring)).toEqual(["artifact"]);
    expect(pt(game, stack)).toEqual([1, 1]);
  });

  it("with no types only sets base P/T", () => {
    const { game } = makeGame();
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, {
      kind: "animate-all",
      filter: { type: "creature", controlledBy: "opponent" },
      power: 1,
      toughness: 1,
      duration: "end-of-turn",
    });
    expect(pt(game, giant)).toEqual([1, 1]);
    expect(subtypes(game, giant)).toEqual(["Giant"]);
  });
});
