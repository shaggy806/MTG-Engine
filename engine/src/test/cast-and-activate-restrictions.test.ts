/**
 * Rules about casting and activating: a card's own `castOnlyIf` (Rakdos,
 * Lord of Riots: "you can't cast this spell unless an opponent lost life
 * this turn"); a `prohibits` static (Myrel, Shield of Argive: "during your
 * turn, your opponents can't cast spells or activate abilities of artifacts,
 * creatures, enchantments, or planeswalkers" — mana abilities too; Marisi,
 * Breaker of the Coil: "your opponents can't cast spells during combat";
 * Codie, Vociferous Codex: "you can't cast permanent spells"); "cast spells
 * as though they had flash"; the one-shot `prohibit` effect (Sen Triplets'
 * "this turn, that player can't cast spells or activate abilities", Koma's
 * "its activated abilities can't be activated this turn"); and split second.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import type { StaticAbility } from "../cards/define.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const RAKDOS = "Test Lord of Riots";
const MYREL = "Test Shield of Argive";
const MARISI = "Test Breaker of the Coil";
const CODIE = "Test Vociferous Codex";
const HELIOD = "Test Warped Eclipse";
const PINGER = "Test Pinger";
const SPLIT = "Test Split Second Bolt";
/** Rakdos's other half: "Creature spells you cast cost {1} less to cast for
 * each 1 life your opponents have lost this turn." */
const RIOT = "Test Riot Discount";

const enchantment = (name: string, ability: Omit<StaticAbility, "text" | "affects">) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    static: [{ affects: { scope: "self" }, ...ability, text: name } as StaticAbility],
  });

const PERMANENT_TYPES = ["artifact", "creature", "enchantment", "planeswalker", "land"] as const;

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: RAKDOS,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Demon"],
      power: 6,
      toughness: 6,
      text: RAKDOS,
      castOnlyIf: { kind: "turn-stat", stat: "life-lost", who: "opponent", atLeast: 1 },
    }),
  )
  .register(
    enchantment(MYREL, {
      condition: { kind: "your-turn" },
      prohibits: {
        who: "opponents",
        spells: true,
        abilitiesOf: { typesAnyOf: ["artifact", "creature", "enchantment", "planeswalker"] },
      },
    }),
  )
  .register(
    enchantment(MARISI, {
      condition: { kind: "turn-structure", duringCombat: true },
      prohibits: { who: "opponents", spells: true },
    }),
  )
  .register(enchantment(CODIE, { prohibits: { who: "you", spells: { typesAnyOf: [...PERMANENT_TYPES] } } }))
  .register(enchantment(HELIOD, { castAsThoughFlash: true }))
  .register(
    enchantment(RIOT, {
      costModification: {
        applies: { type: "creature", controlledBy: "you" },
        reduceGeneric: { turnStat: "life-lost", who: "opponent" },
      },
    }),
  )
  .register(
    defineCard({
      name: PINGER,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Wizard"],
      power: 1,
      toughness: 1,
      text: "{T}: This creature deals 1 damage to any target.",
      activated: [
        {
          cost: { mana: null, tap: true },
          targets: ["any-target"],
          effect: { kind: "damage", amount: 1, target: 0 },
          resolve: null,
          text: "{T}: This creature deals 1 damage to any target.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: SPLIT,
      manaCost: "{0}",
      types: ["instant"],
      text: "Split second\nYou gain 1 life.",
      splitSecond: true,
      effect: { kind: "gain-life", amount: 1 },
    }),
  );

const setUp = (hands: Partial<Record<PlayerId, readonly string[]>> = {}) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [A, B].map((player) => ({
      player,
      cards: [...(hands[player] ?? []), ...Array<string>(40).fill("Mountain")],
    })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  // Mana for anything the tests cast.
  for (const player of [A, B]) {
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Mountain", player, "battlefield");
  }
  return game;
};

const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};
const castable = (game: Game, player: PlayerId, card: ObjectId): boolean =>
  game.legalActions(player).some((o: LegalAction) => o.kind === "cast-spell" && o.card === card);
const activatable = (game: Game, player: PlayerId, source: ObjectId): boolean =>
  game.legalActions(player).some((o: LegalAction) => o.kind === "activate-ability" && o.source === source);
/** Advance until `player` holds priority at `step` of the current turn. */
const priorityTo = (game: Game, player: PlayerId, step: string): void => {
  game.advanceUntil((s: GameState) => s.turn.step === step && s.priority.holder === player);
};
const run = (game: Game, effect: EffectSpec, targets: readonly (PlayerId | ObjectId)[] = []): void => {
  // A source with no mana ability, so it adds nothing to what anyone can pay.
  const source = game.debugSpawn("Grizzly Bears", A, "battlefield");
  game.debugApplyEffect(
    A,
    effect,
    targets.map((t) =>
      game.state.players[t as PlayerId] !== undefined
        ? { kind: "player", player: t as PlayerId }
        : { kind: "object", object: t as ObjectId },
    ),
    { source },
  );
};

describe("a card's own castOnlyIf", () => {
  it("Rakdos: only once an opponent has lost life this turn", () => {
    const game = setUp({ [A]: [RAKDOS] });
    const rakdos = inHand(game, A, RAKDOS);
    expect(castable(game, A, rakdos)).toBe(false);
    expect(() => game.dispatch({ type: "cast-spell", player: A, card: rakdos, targets: [] })).toThrow(
      /can't be cast/,
    );
    run(game, { kind: "lose-life", amount: 1, who: "each-opponent" });
    expect(castable(game, A, rakdos)).toBe(true);
  });
});

describe("a cost reduction per turn stat", () => {
  it("creature spells cost {1} less for each 1 life your opponents have lost this turn", () => {
    // Hill Giant costs {3}{R}: four Mountains' worth, and there are three.
    const game = setUp({ [A]: ["Hill Giant"] });
    game.debugSpawn(RIOT, A, "battlefield");
    const giant = inHand(game, A, "Hill Giant");
    expect(castable(game, A, giant)).toBe(false);
    run(game, { kind: "lose-life", amount: 1, who: "each-opponent" });
    expect(castable(game, A, giant)).toBe(true);
  });
});

describe("prohibitions from a static", () => {
  it("Myrel: on your turn, opponents can't cast spells or use their creatures' abilities — mana ones included", () => {
    const game = setUp({ [B]: ["Lightning Bolt"] });
    game.debugSpawn(MYREL, A, "battlefield");
    const pinger = game.debugSpawn(PINGER, B, "battlefield", { summoningSick: false });
    const elves = game.debugSpawn("Llanowar Elves", B, "battlefield", { summoningSick: false });
    const bolt = inHand(game, B, "Lightning Bolt");
    priorityTo(game, B, "precombat-main");
    expect(castable(game, B, bolt)).toBe(false);
    expect(activatable(game, B, pinger)).toBe(false);
    // Lands still tap for mana; the Elves don't.
    expect(activatable(game, B, elves)).toBe(false);
    const mountain = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].controller === B && game.state.objects[id].cardName === "Mountain",
    )!;
    expect(activatable(game, B, mountain)).toBe(true);
    // On Bob's own turn, no prohibition.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(castable(game, B, bolt)).toBe(true);
    expect(activatable(game, B, pinger)).toBe(true);
    expect(activatable(game, B, elves)).toBe(true);
  });

  it("Marisi: opponents can't cast spells during combat, but can before it", () => {
    const game = setUp({ [B]: ["Lightning Bolt"] });
    game.debugSpawn(MARISI, A, "battlefield");
    const bolt = inHand(game, B, "Lightning Bolt");
    priorityTo(game, B, "precombat-main");
    expect(castable(game, B, bolt)).toBe(true);
    priorityTo(game, B, "begin-combat");
    expect(castable(game, B, bolt)).toBe(false);
  });

  it("Codie: you can't cast permanent spells, only others", () => {
    const game = setUp({ [A]: ["Grizzly Bears", "Lightning Bolt"] });
    game.debugSpawn(CODIE, A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    expect(castable(game, A, inHand(game, A, "Grizzly Bears"))).toBe(false);
    expect(castable(game, A, inHand(game, A, "Lightning Bolt"))).toBe(true);
  });

  it("cast spells as though they had flash", () => {
    const game = setUp({ [B]: ["Grizzly Bears"] });
    game.debugSpawn("Forest", B, "battlefield");
    const bears = inHand(game, B, "Grizzly Bears");
    priorityTo(game, B, "precombat-main");
    expect(castable(game, B, bears)).toBe(false);
    game.debugSpawn(HELIOD, B, "battlefield");
    expect(castable(game, B, bears)).toBe(true);
  });
});

describe("one-shot prohibitions", () => {
  it("Sen Triplets: that player can't cast spells or activate abilities this turn", () => {
    const game = setUp({ [B]: ["Lightning Bolt"] });
    const pinger = game.debugSpawn(PINGER, B, "battlefield", { summoningSick: false });
    run(game, { kind: "prohibit", who: 0, spells: true, abilities: true }, [B]);
    const bolt = inHand(game, B, "Lightning Bolt");
    priorityTo(game, B, "precombat-main");
    expect(castable(game, B, bolt)).toBe(false);
    expect(activatable(game, B, pinger)).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(castable(game, B, bolt)).toBe(true);
    expect(activatable(game, B, pinger)).toBe(true);
  });

  it("Koma: a permanent's activated abilities can't be activated this turn — until it's a new object", () => {
    const game = setUp();
    const pinger = game.debugSpawn(PINGER, B, "battlefield", { summoningSick: false });
    run(game, { kind: "prohibit", target: 0 }, [pinger]);
    priorityTo(game, B, "precombat-main");
    expect(activatable(game, B, pinger)).toBe(false);
    run(game, { kind: "flicker", target: 0 }, [pinger]);
    game.state.objects[pinger].summoningSick = false;
    expect(activatable(game, B, pinger)).toBe(true);
  });
});

describe("split second", () => {
  it("while it's on the stack, nobody casts spells or activates non-mana abilities", () => {
    const game = setUp({ [A]: [SPLIT], [B]: ["Lightning Bolt"] });
    const pinger = game.debugSpawn(PINGER, B, "battlefield", { summoningSick: false });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, A, SPLIT), targets: [] });
    game.dispatch({ type: "pass-priority", player: A });
    expect(game.state.priority.holder).toBe(B);
    expect(castable(game, B, inHand(game, B, "Lightning Bolt"))).toBe(false);
    expect(activatable(game, B, pinger)).toBe(false);
    // Mana abilities are still fine.
    expect(game.legalActions(B).some((o) => o.kind === "activate-ability")).toBe(true);
  });
});
