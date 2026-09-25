/**
 * Where the mana spent to cast a spell came from: every unit of mana carries
 * its source's types as it made the mana (`ManaUnit.from`), a spell keeps
 * the lot as it's paid for (`GameObject.manaSpentFrom`), and a `manaFrom`
 * filter clause asks about it — "whenever you cast a spell, if mana from an
 * artifact was spent to cast it", "…from a Treasure".
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const watcher = (name: string, trigger: TriggerSpec, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    triggered: [{ trigger, targets: [], effect, resolve: null, text: name }],
  });

/** "Whenever you cast a spell, if mana from an artifact was spent to cast
 * it, you gain 1 life." */
const ARTIFICER = "Test Artifact Mana Watcher";
/** "…if mana from a Treasure was spent to cast it, you gain 2 life." */
const HOARDER = "Test Treasure Mana Watcher";
/** "…if mana from an enchantment was spent to cast it, you gain 4 life." */
const MYSTIC = "Test Enchantment Mana Watcher";
/** "…if two or more mana from creatures were spent to cast it, you gain 8
 * life." */
const DRUID = "Test Creature Mana Watcher";
/** "Whenever you tap a creature for mana, add an additional {G}." */
const WELLSPRING = "Test Creature Mana Wellspring";

const gain = (amount: number): EffectSpec => ({ kind: "gain-life", amount });
const onCast = (manaFrom: NonNullable<Extract<TriggerSpec, { on: "cast-spell" }>["filter"]>["manaFrom"]) =>
  ({ on: "cast-spell", who: "you", filter: { manaFrom } }) as TriggerSpec;

const registry = createDefaultRegistry()
  .register(watcher(ARTIFICER, onCast({ type: "artifact" }), gain(1)))
  .register(watcher(HOARDER, onCast({ subtype: "Treasure" }), gain(2)))
  .register(watcher(MYSTIC, onCast({ type: "enchantment" }), gain(4)))
  .register(watcher(DRUID, onCast({ type: "creature", atLeast: 2 }), gain(8)))
  .register(
    watcher(
      WELLSPRING,
      { on: "tapped-for-mana", who: "you-control", filter: { type: "creature" } },
      { kind: "add-mana", mana: "G", amount: 1 },
    ),
  );

const setUp = (hand: readonly string[]) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  // Nothing in hand but what the test asked for can pay: the Islands drawn
  // stay in hand.
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string): ObjectId =>
  game.debugSpawn(name, A, "battlefield", { summoningSick: false });
const castBears = (game: Game): ObjectId => {
  const bears = game.handOf(A).find((id) => game.state.objects[id].cardName === "Grizzly Bears")!;
  game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
  game.advanceUntil(quiet);
  return bears;
};
const life = (game: Game): number => game.state.players[A].life;

describe("mana from an artifact", () => {
  it("a Sol Ring paying part of the cost: the spell had artifact mana", () => {
    const game = setUp(["Grizzly Bears"]);
    spawn(game, ARTIFICER);
    spawn(game, "Forest");
    spawn(game, "Sol Ring");
    const bears = castBears(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(life(game)).toBe(21);
  });

  it("only lands: no", () => {
    const game = setUp(["Grizzly Bears"]);
    spawn(game, ARTIFICER);
    spawn(game, "Forest");
    spawn(game, "Forest");
    castBears(game);
    expect(life(game)).toBe(20);
  });

  it("mana floated from an artifact by hand still counts", () => {
    const game = setUp(["Grizzly Bears"]);
    spawn(game, ARTIFICER);
    spawn(game, "Forest");
    const ring = spawn(game, "Sol Ring");
    game.dispatch({ type: "activate-ability", player: A, source: ring, abilityIndex: 0, targets: [] });
    expect(game.state.players[A].manaPool.map((u) => u.from?.types)).toEqual([["artifact"], ["artifact"]]);
    castBears(game);
    expect(life(game)).toBe(21);
  });

  it("a Treasure is read as it made the mana, though it was sacrificed for it", () => {
    const game = setUp(["Grizzly Bears"]);
    spawn(game, ARTIFICER);
    spawn(game, HOARDER);
    spawn(game, "Forest");
    const treasure = spawn(game, "Treasure Token");
    castBears(game);
    // `debugSpawn` makes it as a card, so it's in the graveyard rather than
    // gone — either way, no longer on the battlefield.
    expect(game.state.objects[treasure]?.zone).not.toBe("battlefield");
    expect(life(game)).toBe(23);
  });

  it("the permanent keeps it; a move elsewhere clears it", () => {
    const game = setUp(["Grizzly Bears"]);
    spawn(game, "Forest");
    spawn(game, "Sol Ring");
    const bears = castBears(game);
    expect(game.state.objects[bears].manaSpentFrom?.some((o) => o.types.includes("artifact"))).toBe(true);
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0 }, [{ kind: "object", object: bears }]);
    expect(game.state.objects[bears].manaSpentFrom).toBeUndefined();
  });
});

describe("mana a triggered mana ability adds", () => {
  it("is from the permanent with the trigger, not the one tapped", () => {
    const game = setUp(["Grizzly Bears"]);
    spawn(game, MYSTIC);
    spawn(game, DRUID);
    spawn(game, WELLSPRING);
    // The Elves make {G}; the Wellspring adds another {G}: one from a
    // creature, one from an enchantment.
    spawn(game, "Llanowar Elves");
    const bears = castBears(game);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(life(game)).toBe(24);
  });

  it("…and two creatures tapped are two units from creatures", () => {
    const game = setUp(["Grizzly Bears"]);
    spawn(game, DRUID);
    spawn(game, "Llanowar Elves");
    spawn(game, "Llanowar Elves");
    castBears(game);
    expect(life(game)).toBe(28);
  });
});
