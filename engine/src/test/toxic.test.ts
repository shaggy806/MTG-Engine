/**
 * Toxic (rule 702.164): a parameterised, cumulative static ability. Combat
 * damage a creature with toxic deals a player also gives that player its
 * total toxic value in poison counters (rules 120.3g, 702.164c) — the sum of
 * every instance it has (702.164b): a printed one (`CardDefinition.toxic`)
 * and any a static grants (`StaticAbility.grantToxic`).
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** "Other creatures you control have toxic 2." */
const GRANTER = "Test Toxic Granter";

const registry = createDefaultRegistry().register(
  defineCard({
    name: GRANTER,
    manaCost: "{0}",
    types: ["enchantment"],
    text: "Creatures you control have toxic 2.",
    static: [{ affects: { scope: "creatures-you-control" }, grantToxic: 2, text: "Creatures you control have toxic 2." }],
  }),
);

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
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
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0;
const poisonOf = (game: Game, player: PlayerId): number => game.state.players[player].counters.poison ?? 0;
const attackWith = (game: Game, a: ScriptedController, attackers: readonly ObjectId[]): void => {
  a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
  game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
};

describe("toxic", () => {
  it("combat damage to a player gives that many poison counters, and the damage still lands", () => {
    const { game, a } = setUp();
    const rat = game.debugSpawn("Blightbelly Rat", A, "battlefield", { summoningSick: false });
    expect(game.characteristics(rat).toxic).toBe(1);
    const life = game.state.players[B].life;
    attackWith(game, a, [rat]);
    // A 2/2 with toxic 1: two damage and one poison counter (the rulings).
    expect(poisonOf(game, B)).toBe(1);
    expect(game.state.players[B].life).toBe(life - 2);
    expect(poisonOf(game, A)).toBe(0);
  });

  it("is the total toxic value, not the damage: an 8/8 with toxic 4 gives four", () => {
    const { game, a } = setUp();
    const rex = game.debugSpawn("Tyrranax Rex", A, "battlefield", { summoningSick: false });
    attackWith(game, a, [rex]);
    expect(poisonOf(game, B)).toBe(4);
  });

  it("does nothing when the creature deals its combat damage to a creature", () => {
    const { game, a, b } = setUp();
    const rat = game.debugSpawn("Blightbelly Rat", A, "battlefield", { summoningSick: false });
    const wall = game.debugSpawn("Wall of Wood", B, "battlefield", { summoningSick: false });
    b.declareBlockersFn = () => [{ blocker: wall, attacker: rat }];
    attackWith(game, a, [rat]);
    expect(game.state.objects[wall].damageMarked).toBe(2);
    expect(poisonOf(game, B)).toBe(0);
  });

  it("does nothing for noncombat damage", () => {
    const { game } = setUp();
    const rat = game.debugSpawn("Blightbelly Rat", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 2 }, [{ kind: "player", player: B }], {
      source: rat,
    });
    expect(game.state.players[B].life).toBe(18);
    game.advanceUntil(quiet);
    expect(poisonOf(game, B)).toBe(0);
  });

  it("instances add up: a granted toxic beside a printed one (rule 702.164b)", () => {
    const { game, a } = setUp();
    game.debugSpawn(GRANTER, A, "battlefield");
    const rat = game.debugSpawn("Blightbelly Rat", A, "battlefield", { summoningSick: false });
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    expect(game.characteristics(rat).toxic).toBe(3);
    expect(game.characteristics(bears).toxic).toBe(2);
    attackWith(game, a, [rat, bears]);
    expect(poisonOf(game, B)).toBe(5);
  });

  it("a creature that loses its abilities loses its printed toxic", () => {
    const { game, a } = setUp();
    const rat = game.debugSpawn("Blightbelly Rat", A, "battlefield", { summoningSick: false });
    game.debugApplyEffect(
      A,
      {
        kind: "animate",
        target: 0,
        power: 1,
        toughness: 1,
        addTypes: [],
        addSubtypes: [],
        loseAbilities: true,
        duration: "end-of-turn",
      },
      [{ kind: "object", object: rat }],
    );
    expect(game.characteristics(rat).toxic).toBe(0);
    attackWith(game, a, [rat]);
    expect(poisonOf(game, B)).toBe(0);
  });

  it("ten poison from toxic loses the game", () => {
    const { game, a } = setUp();
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 6, who: "each-opponent" });
    const rex = game.debugSpawn("Tyrranax Rex", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: rex, defender: B }];
    game.advanceUntil((s) => s.result.over);
    expect(game.state.players[B].hasLost).toBe(true);
    expect(game.state.players[B].lossReason).toContain("poison");
  });
});
