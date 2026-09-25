/**
 * Mana abilities that do more than make mana, still without the stack:
 * `add-mana`'s `also` — Kibo, Uktabi Prince's Banana: "{T}, Sacrifice this
 * artifact: Add {R} or {G}. You gain 2 life." — and triggered mana abilities
 * (rule 605.1b), the `tapped-for-mana` trigger — Roxanne, Starfall Savant's
 * "whenever you tap an artifact token for mana, add one mana of any type
 * that artifact token produced", Crypt Ghast's "whenever you tap a Swamp for
 * mana, add an additional {B}". The auto-payer applies the first and counts
 * the second.
 */

import { describe, expect, it } from "vitest";

import type { TriggerSpec } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import type { EffectSpec } from "../effects.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const BANANA = "Test Banana";
const SAVANT = "Test Starfall Savant";
const GHAST = "Test Crypt Ghast";

const watcher = (name: string, trigger: TriggerSpec, effect: EffectSpec) =>
  defineCard({
    name,
    manaCost: "{0}",
    types: ["enchantment"],
    text: name,
    triggered: [{ trigger, targets: [], effect, resolve: null, text: name }],
  });

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: BANANA,
      types: ["artifact"],
      text: "{T}, Sacrifice this artifact: Add {R} or {G}. You gain 2 life.",
      activated: [
        {
          cost: { mana: null, tap: true, sacrifice: "self" },
          targets: [],
          effect: {
            kind: "add-mana",
            mana: { oneOf: ["R", "G"] },
            amount: 1,
            also: { kind: "gain-life", amount: 2 },
          },
          resolve: null,
          text: "{T}, Sacrifice this artifact: Add {R} or {G}. You gain 2 life.",
        },
      ],
    }),
  )
  .register(
    watcher(
      SAVANT,
      { on: "tapped-for-mana", who: "you-control", filter: { type: "artifact", token: true } },
      { kind: "add-mana", mana: "produced", amount: 1 },
    ),
  )
  .register(
    watcher(
      GHAST,
      { on: "tapped-for-mana", who: "you-control", filter: { subtype: "Swamp" } },
      { kind: "add-mana", mana: "B", amount: 1 },
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
  return game;
};

const inHand = (game: Game, name: string): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === card);
const pool = (game: Game): string =>
  game.state.players[A].manaPool
    .map((unit) => unit.type)
    .sort()
    .join("");
const makeTreasure = (game: Game): ObjectId => {
  game.debugApplyEffect(A, { kind: "create-token", token: "Treasure Token", count: 1 });
  return game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === "Treasure Token",
  )!;
};

describe("a mana ability's rider", () => {
  it("by hand: the mana and the life together, off the stack", () => {
    const game = setUp([]);
    const banana = game.debugSpawn(BANANA, A, "battlefield");
    game.dispatch({ type: "activate-ability", player: A, source: banana, abilityIndex: 0, targets: [] });
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(pool(game)).toHaveLength(1);
    expect(game.state.players[A].life).toBe(22);
  });

  it("paying a cost: the auto-payer gains the life too", () => {
    const game = setUp(["Lightning Bolt"]);
    game.debugSpawn(BANANA, A, "battlefield");
    const bolt = inHand(game, "Lightning Bolt");
    expect(castable(game, bolt)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    expect(game.state.players[A].life).toBe(22);
  });
});

describe("triggered mana abilities", () => {
  it("Roxanne: a Treasure makes two of the same colour, and the payer counts on it", () => {
    const game = setUp(["Grizzly Bears"]);
    makeTreasure(game);
    const bears = inHand(game, "Grizzly Bears");
    // One Treasure alone can't pay {1}{G}.
    expect(castable(game, bears)).toBe(false);
    game.debugSpawn(SAVANT, A, "battlefield");
    expect(castable(game, bears)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [] });
    expect(game.state.zones.shared.stack.at(-1)).toBe(bears);
    expect(pool(game)).toBe("");
  });

  it("by hand: the extra is the type the permanent produced, and nothing goes on the stack", () => {
    const game = setUp([]);
    game.debugSpawn(SAVANT, A, "battlefield");
    const treasure = makeTreasure(game);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: treasure,
      abilityIndex: 0,
      targets: [],
      manaColors: ["U"],
    });
    expect(pool(game)).toBe("UU");
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(game.state.pendingTriggers).toHaveLength(0);
  });

  it("Crypt Ghast: a Swamp makes {B}{B}", () => {
    const game = setUp(["Vampire Nighthawk"]);
    const nighthawk = inHand(game, "Vampire Nighthawk");
    game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Swamp", A, "battlefield");
    // {1}{B}{B} from two Swamps: only with the Ghast.
    expect(castable(game, nighthawk)).toBe(false);
    game.debugSpawn(GHAST, A, "battlefield");
    expect(castable(game, nighthawk)).toBe(true);
    // An Island isn't a Swamp.
    const island = game.debugSpawn("Island", A, "battlefield");
    game.dispatch({ type: "activate-ability", player: A, source: island, abilityIndex: 0, targets: [] });
    expect(pool(game)).toBe("U");
  });
});
