/**
 * Mana abilities whose cost is more than `{T}` (rule 605.1a says nothing
 * about costs): Kykar, Wind's Fury's "Sacrifice a Spirit: Add {R}", Ramos,
 * Dragon Engine's "Remove five +1/+1 counters from Ramos: Add
 * {W}{W}{U}{U}{B}{B}{R}{R}{G}{G}. Activate only once each turn." They never
 * use the stack; the auto-payer can't pay those costs itself, so it leaves
 * them alone and they're activated by hand. And Exhaust — "activate each
 * exhaust ability only once" (Loot, the Pathfinder), for as long as the
 * object exists.
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const KYKAR = "Test Wind's Fury";
const RAMOS = "Test Dragon Engine";
const LOOT = "Test Pathfinder";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: KYKAR,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Bird", "Wizard"],
      power: 3,
      toughness: 3,
      text: "Sacrifice a Spirit: Add {R}.",
      activated: [
        {
          cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Spirit" } } },
          targets: [],
          effect: { kind: "add-mana", mana: "R", amount: 1 },
          resolve: null,
          text: "Sacrifice a Spirit: Add {R}.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: RAMOS,
      manaCost: "{0}",
      types: ["artifact", "creature"],
      subtypes: ["Dragon", "Construct"],
      power: 4,
      toughness: 4,
      text: "Remove five +1/+1 counters: Add {W}{W}{U}{U}{B}{B}{R}{R}{G}{G}. Activate only once each turn.",
      activated: [
        {
          cost: { mana: null, tap: false, removeCounter: { kind: "+1/+1", count: 5 } },
          targets: [],
          effect: {
            kind: "sequence",
            effects: (["W", "U", "B", "R", "G"] as const).map((mana) => ({
              kind: "add-mana" as const,
              mana,
              amount: 2,
            })),
          },
          resolve: null,
          oncePerTurn: true,
          text: "Remove five +1/+1 counters: Add {W}{W}{U}{U}{B}{B}{R}{R}{G}{G}. Activate only once each turn.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: LOOT,
      manaCost: "{0}",
      types: ["creature"],
      subtypes: ["Noggle"],
      power: 1,
      toughness: 1,
      text: "Exhaust — {G}, {T}: Add {R}{R}{R}.",
      activated: [
        {
          cost: { mana: "{G}", tap: true },
          targets: [],
          effect: { kind: "add-mana", mana: "R", amount: 3 },
          resolve: null,
          exhaust: true,
          text: "Exhaust — {G}, {T}: Add {R}{R}{R}.",
        },
      ],
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
      { player: A, cards: ["Lightning Bolt", ...Array<string>(39).fill("Island")] },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

type Activation = Extract<LegalAction, { kind: "activate-ability" }>;
const activations = (game: Game, source: ObjectId): Activation[] =>
  game
    .legalActions(A)
    .filter((o): o is Activation => o.kind === "activate-ability" && o.source === source);
const pool = (game: Game): string =>
  game.state.players[A].manaPool
    .map((unit) => unit.type)
    .sort()
    .join("");
const bolt = (game: Game): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === "Lightning Bolt")!;
const boltOffered = (game: Game): boolean =>
  game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === bolt(game));

describe("a mana ability that sacrifices a chosen permanent", () => {
  it("Kykar: never on the stack, and never tapped by the auto-payer", () => {
    const game = setUp();
    const kykar = game.debugSpawn(KYKAR, A, "battlefield");
    const spirit = game.debugSpawn("Spirit Token", A, "battlefield");
    // Nothing else makes mana: the auto-payer won't sacrifice the Spirit.
    expect(boltOffered(game)).toBe(false);
    const [offer] = activations(game, kykar);
    expect(offer.manaAbility).toBe(true);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: kykar,
      abilityIndex: 0,
      targets: [],
      sacrifice: spirit,
    });
    // Resolved at once: {R} floating, nothing on the stack.
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(pool(game)).toBe("R");
    expect(game.state.objects[spirit]?.zone ?? "gone").not.toBe("battlefield");
    // And the floating {R} pays for the Bolt.
    expect(boltOffered(game)).toBe(true);
  });
});

describe("a mana ability that removes counters", () => {
  it("Ramos: ten mana for five counters, once each turn", () => {
    const game = setUp();
    const ramos = game.debugSpawn(RAMOS, A, "battlefield");
    game.state.objects[ramos].counters["+1/+1"] = 10;
    expect(boltOffered(game)).toBe(false);
    game.dispatch({ type: "activate-ability", player: A, source: ramos, abilityIndex: 0, targets: [] });
    expect(game.state.zones.shared.stack).toHaveLength(0);
    expect(pool(game)).toBe("BBGGRRUUWW");
    expect(game.state.objects[ramos].counters["+1/+1"]).toBe(5);
    expect(activations(game, ramos)).toHaveLength(0);
  });
});

describe("exhaust", () => {
  it("Loot: once for as long as it exists, not once a turn", () => {
    const game = setUp();
    const loot = game.debugSpawn(LOOT, A, "battlefield", { summoningSick: false });
    game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Forest", A, "battlefield");
    // A coloured cost: the auto-payer leaves it alone.
    expect(boltOffered(game)).toBe(false);
    game.dispatch({ type: "activate-ability", player: A, source: loot, abilityIndex: 0, targets: [] });
    expect(pool(game)).toBe("RRR");
    game.state.objects[loot].tapped = false;
    expect(activations(game, loot)).toHaveLength(0);
    // Next turn, still spent.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(activations(game, loot)).toHaveLength(0);
    // A new object after a flicker: fresh.
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: loot }]);
    game.state.objects[loot].summoningSick = false;
    expect(activations(game, loot)).toHaveLength(1);
  });
});
