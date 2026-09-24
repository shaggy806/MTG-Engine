/**
 * Amounts and P/T counts the top-500 commanders asked for:
 *
 * - `sum` — "N plus an amount", in an effect and in a filter's `{ amount }`
 *   operand;
 * - `difference` — floored at 0 ("defending player's hand minus yours" — Mr.
 *   Foxglove), or `absolute` ("the difference between its power and
 *   toughness" — Doran, Besieged by Time);
 * - `cardsInHand`, `colorsOf` ("each of that spell's colors" — Ramos),
 *   `colorsAmong` ("each color among other legendary permanents you control"
 *   — Sisay) and `cardTypesInGraveyard` (Tarmogoyf, delirium), the last also
 *   as a CDA count;
 * - `grantPtPerCount` over counters on the affected creature itself (Toxrill,
 *   the Corrosive), cards in exile (Umbris, Fear Manifest) and colours among
 *   permanents (Sisay).
 */

import { describe, expect, it } from "vitest";

import type { CardDraft } from "../cards/define.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectAmount, EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import type { Color } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const legend = (name: string, colors: readonly Color[], extra: Partial<CardDraft> = {}) =>
  defineCard({
    name,
    manaCost: "{0}",
    colors: [...colors],
    supertypes: ["legendary"],
    types: ["creature"],
    subtypes: ["Human"],
    power: 2,
    toughness: 2,
    text: name,
    ...extra,
  });

/** "Gets +1/+1 for each color among other legendary permanents you control." */
const SISAY = "Test Captain";
/** "Creatures your opponents control get -1/-1 for each slime counter on them." */
const TOXRILL = "Test Corroder";
/** "Gets +1/+1 for each card your opponents own in exile." */
const UMBRIS = "Test Manifest";
/** "Power is the number of card types among cards in all graveyards, and
 * toughness that plus 1." */
const GOYF = "Test Goyf";
/** Doran, Besieged by Time's shape: "Each creature spell you cast with
 * toughness greater than its power costs {1} less to cast. Whenever a
 * creature you control attacks or blocks, it gets +X/+X until end of turn,
 * where X is the difference between its power and toughness." */
const DORAN = "Test Besieged";
const differenceOfIt: EffectAmount = {
  difference: [{ powerOf: "trigger-object" }, { toughnessOf: "trigger-object" }],
  absolute: true,
};
const pumpByDifference: EffectSpec = {
  kind: "modify-pt",
  target: "trigger-object",
  power: differenceOfIt,
  toughness: differenceOfIt,
  duration: "end-of-turn",
};

const registry = createDefaultRegistry()
  .register(legend("Test Red Legend", ["R"]))
  .register(legend("Test Azorius Legend", ["W", "U"]))
  .register(legend("Test Colorless Legend", []))
  .register(
    legend(SISAY, ["W", "U", "B", "R", "G"], {
      static: [
        {
          affects: { scope: "self" },
          grantPtPerCount: {
            colorsAmong: { supertype: "legendary", controlledBy: "you" },
            excludeSelf: true,
            pt: [1, 1],
          },
          text: "Test Captain gets +1/+1 for each color among other legendary permanents you control.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: TOXRILL,
      manaCost: "{0}",
      types: ["enchantment"],
      text: TOXRILL,
      static: [
        {
          affects: { scope: "filter", filter: { type: "creature", controlledBy: "opponent" } },
          grantPtPerCount: { countersOnAffected: "slime", pt: [-1, -1] },
          text: "Creatures your opponents control get -1/-1 for each slime counter on them.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: UMBRIS,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Horror"],
      power: 1,
      toughness: 1,
      text: UMBRIS,
      static: [
        {
          affects: { scope: "self" },
          grantPtPerCount: { exiled: { ownedBy: "opponent" }, pt: [1, 1] },
          text: "Test Manifest gets +1/+1 for each card your opponents own in exile.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: GOYF,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Lhurgoyf"],
      power: 0,
      toughness: 1,
      text: GOYF,
      static: [
        {
          affects: { scope: "self" },
          setBasePtFromCount: {
            countOf: { cardTypesInGraveyard: {} },
            plusPower: 0,
            plusToughness: 1,
          },
          text: "Test Goyf's power is the number of card types among cards in all graveyards and its toughness is that number plus 1.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: DORAN,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Treefolk", "Druid"],
      power: 0,
      toughness: 5,
      text: DORAN,
      static: [
        {
          affects: { scope: "self" },
          costModification: {
            applies: { type: "creature", toughness: { op: "gt", n: { own: "power" } } },
            caster: "you",
            reduceGeneric: 1,
          },
          text: "Each creature spell you cast with toughness greater than its power costs {1} less to cast.",
        },
      ],
      triggered: (["attacks", "blocks"] as const).map((on) => ({
        trigger: { on, who: "you-control" as const },
        targets: [],
        effect: pumpByDifference,
        resolve: null,
        text: "Whenever a creature you control attacks or blocks, it gets +X/+X until end of turn.",
      })),
    }),
  )
  .register(
    defineCard({
      name: "Test Wall Spell",
      manaCost: "{2}{G}",
      types: ["creature"],
      subtypes: ["Wall"],
      power: 0,
      toughness: 4,
      text: "",
    }),
  )
  .register(
    defineCard({
      name: "Test Brute Spell",
      manaCost: "{2}{G}",
      types: ["creature"],
      subtypes: ["Ogre"],
      power: 4,
      toughness: 1,
      text: "",
    }),
  );

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const life = (game: Game): number => game.state.players[A].life;
/** Alice gains `amount` life off a real source, with `target` in slot 0. */
const gain = (game: Game, amount: EffectAmount, opts: { target?: ObjectId; x?: number } = {}): number => {
  const before = life(game);
  const source = game.debugSpawn("Test Colorless Legend", A, "battlefield");
  game.debugApplyEffect(
    A,
    { kind: "gain-life", amount },
    opts.target === undefined ? [] : [{ kind: "object", object: opts.target }],
    { source, ...(opts.x !== undefined ? { x: opts.x } : {}) },
  );
  game.advanceUntil(quiet);
  return life(game) - before;
};

describe("sum", () => {
  it("adds amounts", () => {
    const game = setUp();
    expect(gain(game, { sum: ["x", 1] }, { x: 2 })).toBe(3);
  });

  it("works as a filter's operand: 'mana value X plus 1'", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    const effect: EffectSpec = {
      kind: "destroy-all",
      filter: { type: "creature", manaValue: { op: "eq", n: { amount: { sum: ["x", 1] } } } },
    };
    game.debugApplyEffect(A, effect, [], { x: 1 });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(game.state.objects[giant].zone).toBe("battlefield");
  });
});

describe("difference", () => {
  const handGap: EffectAmount = {
    difference: [{ cardsInHand: "each-opponent" }, { cardsInHand: "you" }],
  };

  it("hand sizes: theirs minus yours", () => {
    const game = setUp();
    game.debugApplyEffect(B, { kind: "draw", amount: 5 });
    game.advanceUntil(quiet);
    const gap = game.handOf(B).length - game.handOf(A).length;
    expect(gap).toBeGreaterThan(0);
    expect(gain(game, handGap)).toBe(gap);
  });

  it("is never below 0", () => {
    const game = setUp();
    game.debugApplyEffect(A, { kind: "draw", amount: 5 });
    game.advanceUntil(quiet);
    expect(gain(game, handGap)).toBe(0);
  });

  it("absolute: the difference between power and toughness either way", () => {
    const game = setUp();
    const wall = game.debugSpawn("Wall of Wood", A, "battlefield");
    const diff: EffectAmount = {
      difference: [{ powerOf: 0 }, { toughnessOf: 0 }],
      absolute: true,
    };
    expect(gain(game, diff, { target: wall })).toBe(3);
    const giant = game.debugSpawn("Hill Giant", A, "battlefield");
    expect(gain(game, diff, { target: giant })).toBe(0);
  });
});

describe("colours", () => {
  it("colorsOf counts one object's colours", () => {
    const game = setUp();
    const azorius = game.debugSpawn("Test Azorius Legend", A, "battlefield");
    expect(gain(game, { colorsOf: 0 }, { target: azorius })).toBe(2);
    const myr = game.debugSpawn("Darksteel Myr", A, "battlefield");
    expect(gain(game, { colorsOf: 0 }, { target: myr })).toBe(0);
  });

  it("colorsAmong counts each colour once across permanents", () => {
    const game = setUp();
    game.debugSpawn("Test Azorius Legend", A, "battlefield");
    game.debugSpawn("Test Red Legend", A, "battlefield");
    game.debugSpawn("Test Red Legend", B, "battlefield");
    expect(gain(game, { colorsAmong: { supertype: "legendary", controlledBy: "you" } })).toBe(3);
  });

  it("Sisay's shape: +1/+1 per colour among *other* legendary permanents you control", () => {
    const game = setUp();
    const sisay = game.debugSpawn(SISAY, A, "battlefield");
    expect(game.characteristics(sisay).power).toBe(2);
    game.debugSpawn("Test Azorius Legend", A, "battlefield");
    expect(game.characteristics(sisay).power).toBe(4);
    game.debugSpawn("Test Red Legend", A, "battlefield");
    expect(game.characteristics(sisay).power).toBe(5);
    // An opponent's legend isn't yours.
    game.debugSpawn("Test Red Legend", B, "battlefield");
    expect(game.characteristics(sisay).toughness).toBe(5);
  });
});

describe("card types among cards in graveyards", () => {
  it("counts each type once, both of a two-typed card, as an amount and a CDA", () => {
    const game = setUp();
    const goyf = game.debugSpawn(GOYF, A, "battlefield");
    expect(game.characteristics(goyf).power).toBe(0);
    expect(game.characteristics(goyf).toughness).toBe(1);
    game.debugSpawn("Darksteel Myr", B, "graveyard");
    game.debugSpawn("Lightning Bolt", A, "graveyard");
    game.debugSpawn("Lightning Bolt", B, "graveyard");
    game.debugSpawn("Island", A, "graveyard");
    // artifact, creature, instant, land.
    expect(game.characteristics(goyf).power).toBe(4);
    expect(game.characteristics(goyf).toughness).toBe(5);
    expect(gain(game, { cardTypesInGraveyard: { ownedBy: "you" } })).toBe(2);
  });
});

describe("grantPtPerCount's new counts", () => {
  it("counters on the affected creature itself — each by its own", () => {
    const game = setUp();
    game.debugSpawn(TOXRILL, A, "battlefield");
    const slimed = game.debugSpawn("Hill Giant", B, "battlefield");
    const clean = game.debugSpawn("Hill Giant", B, "battlefield");
    const mine = game.debugSpawn("Hill Giant", A, "battlefield");
    for (const id of [slimed, mine]) {
      game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "slime", amount: 2 }, [
        { kind: "object", object: id },
      ]);
    }
    expect(game.characteristics(slimed).power).toBe(1);
    expect(game.characteristics(slimed).toughness).toBe(1);
    expect(game.characteristics(clean).power).toBe(3);
    expect(game.characteristics(mine).power).toBe(3);
  });

  it("cards an opponent owns in exile", () => {
    const game = setUp();
    const umbris = game.debugSpawn(UMBRIS, A, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "exile");
    game.debugSpawn("Island", B, "exile");
    game.debugSpawn("Island", A, "exile");
    expect(game.characteristics(umbris).power).toBe(3);
    expect(game.characteristics(umbris).toughness).toBe(3);
  });
});

describe("Doran, Besieged by Time's shape", () => {
  it("a creature spell with toughness greater than its power costs {1} less", () => {
    const game = setUp();
    game.debugSpawn(DORAN, A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    const wall = game.debugSpawn("Test Wall Spell", A, "hand");
    const brute = game.debugSpawn("Test Brute Spell", A, "hand");
    const castable = game
      .legalActions(A)
      .filter((a) => a.kind === "cast-spell")
      .map((a) => (a.kind === "cast-spell" ? a.card : null));
    expect(castable).toContain(wall);
    expect(castable).not.toContain(brute);
  });

  it("a blocker gets +X/+X, X the difference between its power and toughness", () => {
    const a = new ScriptedController(A);
    const b = new ScriptedController(B);
    const g = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: a, [B]: b },
      decks: [
        { player: A, cards: Array<string>(40).fill("Island") },
        { player: B, cards: Array<string>(40).fill("Island") },
      ],
    });
    g.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    g.debugSpawn(DORAN, B, "battlefield");
    const wall = g.debugSpawn("Wall of Wood", B, "battlefield");
    const giant = g.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: giant, defender: B }];
    b.declareBlockersFn = () => [{ blocker: wall, attacker: giant }];
    g.advanceUntil((s) => s.turn.step === "combat-damage");
    // Wall of Wood is 0/3: +3/+3.
    expect(g.characteristics(wall).power).toBe(3);
    expect(g.characteristics(wall).toughness).toBe(6);
  });
});
