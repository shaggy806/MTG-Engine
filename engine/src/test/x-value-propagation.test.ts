/**
 * X carries through (rule 107.3m).
 *
 * A permanent spell cast with X remembers that X for its own
 * enters-the-battlefield abilities: "enters with X counters" (a replacement)
 * and "when this enters, … X …" (a trigger) both use the X it was cast with.
 * Everything else sees X = 0 — a permanent that entered without being cast,
 * and the same card after a flicker, which is a new object (rule 400.7).
 *
 * The trigger half snapshots X as the trigger is detected rather than
 * reading it off the permanent later, so the ability keeps its X even if the
 * permanent is flickered before the ability resolves.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import type { CardRegistry } from "../cards.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Test-only: an X creature whose ETB trigger reads X. */
const harbinger = defineCard({
  name: "Test X Harbinger",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: "When Test X Harbinger enters, you gain X life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: "x" },
      resolve: null,
      text: "When Test X Harbinger enters, you gain X life.",
    },
  ],
});

/** Test-only: the same, with a target — so the trigger parks behind a
 * `choose-targets` decision before it's minted. */
const striker = defineCard({
  name: "Test X Striker",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: "When Test X Striker enters, it deals X damage to target creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "damage", amount: "x", target: 0 },
      resolve: null,
      text: "When Test X Striker enters, it deals X damage to target creature.",
    },
  ],
});

/** Test-only: another permanent's entry reads nothing of this one's X. */
const watcher = defineCard({
  name: "Test X Watcher",
  manaCost: "{X}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 1,
  toughness: 1,
  text: "Whenever another creature you control enters, you gain X life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "gain-life", amount: "x" },
      resolve: null,
      text: "Whenever another creature you control enters, you gain X life.",
    },
  ],
});

const registry = (): CardRegistry =>
  createDefaultRegistry().register(harbinger).register(striker).register(watcher);

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Plains"),
];

const mkGame = (aCards: readonly string[]): Game =>
  Game.create({
    seed: 3,
    shuffle: false,
    startingPlayer: A,
    registry: registry(),
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99 },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

/** A board at A's first main phase with `lands` untapped basics of `land`. */
const withLands = (aCards: readonly string[], lands: number, land = "Forest"): Game => {
  const game = mkGame(aCards);
  game.advanceUntil(atFirstMain);
  for (let i = 0; i < lands; i += 1) game.debugSpawn(land, A, "battlefield");
  return game;
};

const handCard = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

const cast = (game: Game, name: string, xValue?: number, targets: readonly ObjectId[] = []): ObjectId => {
  const id = handCard(game, name);
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: id,
    targets: targets.map((object) => ({ kind: "object" as const, object })),
    ...(xValue !== undefined ? { xValue } : {}),
  });
  return id;
};

const life = (game: Game): number => game.state.players[A].life;

describe("rule 107.3m — an ETB ability uses the X its permanent was cast with", () => {
  it("an ETB trigger that says X reads the X the spell was cast with", () => {
    const game = withLands(["Test X Harbinger"], 4);
    const before = life(game);
    cast(game, "Test X Harbinger", 3);
    game.advanceUntil(settled);
    expect(life(game)).toBe(before + 3);
  });

  it("a targeted ETB trigger keeps X across its choose-targets decision", () => {
    // Two creatures to choose between, so the trigger can't be forced and
    // parks behind a `choose-targets` decision before it's minted.
    const game = withLands(["Test X Striker"], 4, "Mountain");
    const big = game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    cast(game, "Test X Striker", 3);
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets");
    game.dispatch({
      type: "choose-targets",
      player: A,
      targets: [{ kind: "object", object: big }],
    });
    game.advanceUntil(settled);
    expect(game.state.objects[big].damageMarked).toBe(3);
  });

  it("keeps its X when the permanent is flickered before the trigger resolves", () => {
    // Harbinger's trigger goes on the stack with X=3; Essence Flux blinks it
    // in response. The trigger is its own object and still gains 3, and the
    // returned Harbinger is a new object that wasn't cast — its own ETB
    // trigger gains 0 (rule 400.7).
    const game = withLands(["Test X Harbinger", "Essence Flux"], 4);
    game.debugSpawn("Island", A, "battlefield");
    const before = life(game);
    const harb = cast(game, "Test X Harbinger", 3);
    game.advanceUntil((s) =>
      s.zones.shared.stack.length === 1 &&
      s.objects[s.zones.shared.stack[0]].kind === "ability" &&
      s.priority.holder === A,
    );
    cast(game, "Essence Flux", undefined, [harb]);
    game.advanceUntil(settled);
    expect(life(game)).toBe(before + 3);
    expect(game.state.objects[harb].xValue).toBeNull();
  });

  it("X is 0 for a permanent that entered without being cast", () => {
    const game = withLands([], 0);
    const before = life(game);
    game.debugSpawn("Test X Harbinger", A, "battlefield", { announceEntry: true });
    game.advanceUntil(settled);
    expect(life(game)).toBe(before);
  });

  it("another permanent's entry doesn't read this permanent's X", () => {
    // Watcher was cast with X=2, but "whenever another creature enters" is
    // not Watcher's own ETB ability, so its X is 0 there.
    const game = withLands(["Test X Watcher", "Grizzly Bears"], 5);
    cast(game, "Test X Watcher", 2);
    game.advanceUntil(settled);
    const before = life(game);
    cast(game, "Grizzly Bears");
    game.advanceUntil(settled);
    expect(life(game)).toBe(before);
  });

  it("an 'enters with X counters' replacement reads X, and a flicker brings it back with none", () => {
    // Walking Ballista (a pool card): enters with X +1/+1 counters.
    const game = withLands(["Walking Ballista", "Essence Flux"], 4);
    game.debugSpawn("Island", A, "battlefield");
    const ballista = cast(game, "Walking Ballista", 2);
    game.advanceUntil(settled);
    expect(game.state.objects[ballista].counters["+1/+1"]).toBe(2);
    cast(game, "Essence Flux", undefined, [ballista]);
    game.advanceUntil(settled);
    // A new object with X = 0: no counters, so it dies as a 0/0.
    expect(game.state.objects[ballista].zone).toBe("graveyard");
  });
});
