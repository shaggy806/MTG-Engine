/**
 * Two pieces of amount/condition vocabulary:
 *
 * - **"other"**: `excludeSelf` / `excludeTarget` on a `countOf` amount and on
 *   the `controls` condition, and `exceptSource` on `add-counter-all` and
 *   `grant-keyword-all`. "Other" leaves out one *permanent*, so a source
 *   that is a member of a token stack leaves the rest of its stack counted.
 * - **aggregates**: a sum or maximum of power / toughness / mana value over
 *   matching permanents, as an `EffectAmount`, a `StaticCondition` (plus the
 *   "greatest power" comparison, `source-greatest`) and a cost reduction. A
 *   token stack counts once per token in a sum.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import type { EffectAmount, EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const [A, B] = ["alice", "bob"].map(asPlayerId);

const TOTAL_POWER = {
  aggregate: "sum",
  of: "power",
  filter: { type: "creature", controlledBy: "you" },
} as const;

/** Flying as long as creatures you control have total power 5 or greater. */
const SENTINEL = defineCard({
  name: "Aggregate Test Sentinel",
  manaCost: "{1}",
  colors: [],
  types: ["creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 1,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "aggregate", value: TOTAL_POWER, compare: { op: "gte", n: 5 } },
      grantKeywords: ["flying"],
      text: "As long as creatures you control have total power 5 or greater, this has flying.",
    },
  ],
});

/** Trample while its power is greater than each other creature's. */
const BRUTE = defineCard({
  name: "Greatest Test Brute",
  manaCost: "{3}",
  colors: [],
  types: ["creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 3,
  static: [
    {
      affects: { scope: "self" },
      condition: {
        kind: "source-greatest",
        of: "power",
        filter: { type: "creature" },
        strict: true,
      },
      grantKeywords: ["trample"],
      text: "As long as this creature's power is greater than each other creature's power, it has trample.",
    },
  ],
});

/** Ghalta's shape: {X} less, where X is the total power of your creatures. */
const HUNGER = defineCard({
  name: "Aggregate Test Hunger",
  manaCost: "{6}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "This spell costs {X} less to cast, where X is the total power of creatures you control.",
  selfCostReduction: {
    condition: { kind: "hand-size", atLeast: 0 },
    reduceGeneric: TOTAL_POWER,
  },
  effect: { kind: "draw", amount: 1 },
});

const registry = createDefaultRegistry().register(SENTINEL).register(BRUTE).register(HUNGER);

function table(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });

function stackOf(game: Game, name: string, player: PlayerId, count: number): ObjectId {
  game.debugApplyEffect(player, { kind: "create-token", token: name, count });
  const stack = game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === name && game.state.objects[id].isToken,
  );
  if (stack === undefined || (game.state.objects[stack].stackCount ?? 1) !== count) {
    throw new Error(`expected one stack of ${count} ${name}`);
  }
  return stack;
}

/** Resolve `amount` through a `gain-life` and report how much was gained. */
function amountOf(
  game: Game,
  amount: EffectAmount,
  source: ObjectId,
  targets: readonly ObjectId[] = [],
): number {
  const before = game.state.players[A].life;
  game.debugApplyEffect(
    A,
    { kind: "gain-life", amount },
    targets.map((object) => ({ kind: "object", object })),
    { source },
  );
  return game.state.players[A].life - before;
}

/** Whether a `conditional` effect took its `then` branch. */
function branch(
  game: Game,
  condition: Extract<EffectSpec, { kind: "conditional" }>["condition"],
  source: ObjectId,
  targets: readonly ObjectId[] = [],
): boolean {
  const before = game.state.players[A].life;
  game.debugApplyEffect(
    A,
    { kind: "conditional", condition, then: { kind: "gain-life", amount: 1 } },
    targets.map((object) => ({ kind: "object", object })),
    { source },
  );
  return game.state.players[A].life > before;
}

const creatures = { countOf: { type: "creature", controlledBy: "you" } } as const;

describe("countOf: excludeSelf / excludeTarget", () => {
  it("\"each other creature you control\" leaves the source out", () => {
    const game = table();
    const source = spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    expect(amountOf(game, creatures, source)).toBe(3);
    expect(amountOf(game, { ...creatures, excludeSelf: true }, source)).toBe(2);
  });

  it("a source in a token stack leaves only itself out, not the stack", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 8);
    expect(amountOf(game, { ...creatures, excludeSelf: true }, stack)).toBe(7);
  });

  it("\"other than that creature\" leaves the target out", () => {
    const game = table();
    const source = spawn(game, "Grizzly Bears");
    const target = spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    expect(amountOf(game, { ...creatures, excludeTarget: 0 }, source, [target])).toBe(2);
    expect(
      amountOf(game, { ...creatures, excludeSelf: true, excludeTarget: 0 }, source, [target]),
    ).toBe(1);
  });
});

describe("controls: excludeSelf / excludeTarget", () => {
  const twoCreatures = {
    kind: "controls",
    filter: { type: "creature", controlledBy: "you" },
    atLeast: 2,
  } as const;

  it("a resolving ability counts its own source, unless it says \"another\"", () => {
    const game = table();
    const source = spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    expect(branch(game, twoCreatures, source)).toBe(true);
    expect(branch(game, { ...twoCreatures, excludeSelf: true }, source)).toBe(false);
    spawn(game, "Grizzly Bears");
    expect(branch(game, { ...twoCreatures, excludeSelf: true }, source)).toBe(true);
  });

  it("excludeTarget leaves the targeted permanent out", () => {
    const game = table();
    const source = spawn(game, "Grizzly Bears");
    const target = spawn(game, "Grizzly Bears");
    expect(branch(game, twoCreatures, source, [target])).toBe(true);
    expect(branch(game, { ...twoCreatures, excludeTarget: 0 }, source, [target])).toBe(false);
  });
});

describe("exceptSource on mass effects", () => {
  it("add-counter-all spares the source", () => {
    const game = table();
    const source = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(
      A,
      {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      [],
      { source },
    );
    expect(game.state.objects[source].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[other].counters["+1/+1"]).toBe(1);
  });

  it("grant-keyword-all spares the source", () => {
    const game = table();
    const source = spawn(game, "Grizzly Bears");
    const other = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(
      A,
      {
        kind: "grant-keyword-all",
        filter: { type: "creature", controlledBy: "you" },
        keyword: "haste",
        duration: "end-of-turn",
        exceptSource: true,
      },
      [],
      { source },
    );
    const has = (id: ObjectId) =>
      computeCharacteristics(game.state, registry, id).keywords.has("haste");
    expect(has(source)).toBe(false);
    expect(has(other)).toBe(true);
  });
});

describe("aggregate amounts", () => {
  it("a sum of power counts a token stack once per token", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears");
    stackOf(game, "Goblin Token", A, 10);
    spawn(game, "Grizzly Bears", B); // not yours
    // 2 (Bears) + 10 × 1 (Goblins).
    expect(amountOf(game, TOTAL_POWER, bears)).toBe(12);
    expect(amountOf(game, { ...TOTAL_POWER, excludeSelf: true }, bears)).toBe(10);
  });

  it("reads computed power — counters count", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters["+1/+1"] = 3;
    expect(amountOf(game, TOTAL_POWER, bears)).toBe(5);
    expect(amountOf(game, { ...TOTAL_POWER, of: "toughness" }, bears)).toBe(5);
  });

  it("a maximum takes the greatest, and is 0 over nothing", () => {
    const game = table();
    const bears = spawn(game, "Grizzly Bears");
    const greatest = { aggregate: "max", of: "mana-value", filter: { controlledBy: "you" } } as const;
    expect(amountOf(game, { ...greatest, filter: { type: "artifact", controlledBy: "you" } }, bears)).toBe(0);
    spawn(game, "Sol Ring");
    stackOf(game, "Goblin Token", A, 9);
    expect(amountOf(game, greatest, bears)).toBe(2); // Bears {1}{G}
    spawn(game, "Greatest Test Brute");
    expect(amountOf(game, greatest, bears)).toBe(3);
    expect(
      amountOf(game, { aggregate: "max", of: "power", filter: { type: "creature" } }, bears),
    ).toBe(3);
  });
});

describe("aggregate conditions", () => {
  it("a resolving ability's total includes its own source", () => {
    const game = table();
    const source = spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    const four = { kind: "aggregate", value: TOTAL_POWER, compare: { op: "gte", n: 4 } } as const;
    expect(branch(game, four, source)).toBe(true);
    expect(
      branch(game, { ...four, value: { ...TOTAL_POWER, excludeSelf: true } }, source),
    ).toBe(false);
  });

  it("a static condition sees a token stack's whole power", () => {
    const game = table();
    const sentinel = spawn(game, "Aggregate Test Sentinel");
    const flying = () =>
      computeCharacteristics(game.state, registry, sentinel).keywords.has("flying");
    // A static leaves its own permanent out of the scan: 1 power isn't 5.
    expect(flying()).toBe(false);
    stackOf(game, "Goblin Token", A, 8);
    expect(flying()).toBe(true);
  });

  it("source-greatest: strictly greater than each other creature's power", () => {
    const game = table();
    const brute = spawn(game, "Greatest Test Brute");
    const trample = () =>
      computeCharacteristics(game.state, registry, brute).keywords.has("trample");
    spawn(game, "Grizzly Bears", B);
    expect(trample()).toBe(true);
    const rival = spawn(game, "Grizzly Bears", B);
    game.state.objects[rival].counters["+1/+1"] = 1; // 3/3: a tie is not greater
    expect(trample()).toBe(false);
    expect(
      branch(
        game,
        { kind: "source-greatest", of: "power", filter: { type: "creature" } },
        brute,
      ),
    ).toBe(true); // "greatest", not "greater than each other": a tie still has it
  });

  it("source-greatest: a stack-mate is another creature with the same power", () => {
    const game = table();
    const stack = stackOf(game, "Goblin Token", A, 8);
    const greater = { kind: "source-greatest", of: "power", filter: { type: "creature" } } as const;
    expect(branch(game, { ...greater, strict: true }, stack)).toBe(false);
    expect(branch(game, greater, stack)).toBe(true);
  });
});

describe("aggregate cost reduction", () => {
  it("Ghalta's shape: {X} less, X the total power of your creatures", () => {
    const game = table();
    const spell = game.debugSpawn("Aggregate Test Hunger", A, "hand");
    game.debugSpawn("Forest", A, "battlefield");
    const castable = () =>
      game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === spell);
    expect(castable()).toBe(false);
    spawn(game, "Grizzly Bears");
    expect(castable()).toBe(false); // {4}{G} off one Forest
    stackOf(game, "Goblin Token", A, 8);
    expect(castable()).toBe(true); // {6}{G} less 10 → {G}
  });
});
