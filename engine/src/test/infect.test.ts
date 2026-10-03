/**
 * Infect and wither (rules 702.90, 702.80, 120.3): damage from a source with
 * infect gives a player poison counters instead of costing life (120.3b), and
 * damage from a source with wither or infect puts that many -1/-1 counters on
 * a creature instead of being marked (120.3d) — any damage, combat or not,
 * and still damage in every other respect: lifelink, deathtouch, "is dealt
 * damage", prevention (the rulings). A planeswalker loses loyalty as usual.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** A creature with infect whose dies trigger deals its damage once it has
 * left the battlefield — read through its last-known information. */
const DIER = "Test Infect Dier";

const registry = createDefaultRegistry().register(
  defineCard({
    name: DIER,
    manaCost: "{0}",
    types: ["creature"],
    power: 1,
    toughness: 1,
    keywords: ["infect"],
    text: "Infect\nWhen this creature dies, it deals 3 damage to each opponent.",
    triggered: [
      {
        trigger: { on: "dies", who: "self" },
        targets: [],
        effect: { kind: "damage", amount: 3, who: "each-opponent" },
        resolve: null,
        text: "When this creature dies, it deals 3 damage to each opponent.",
      },
    ],
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
/** State-based actions, then whatever they put on the stack resolved. */
const settle = (game: Game): void => {
  const holder = game.state.priority.holder as PlayerId;
  (game as unknown as { prepareForPriority(player: PlayerId): void }).prepareForPriority(holder);
  game.advanceUntil(quiet);
};
const poisonOf = (game: Game, player: PlayerId): number => game.state.players[player].counters.poison ?? 0;
const minusCounters = (game: Game, id: ObjectId): number => game.state.objects[id].counters["-1/-1"] ?? 0;
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const attackWith = (game: Game, a: ScriptedController, attackers: readonly ObjectId[]): void => {
  a.declareAttackersFn = () => attackers.map((attacker) => ({ attacker, defender: B }));
  game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
};
const grant = (game: Game, id: ObjectId, keyword: "lifelink" | "deathtouch" | "infect" | "wither") =>
  game.debugApplyEffect(A, { kind: "grant-keyword", target: 0, keyword, duration: "end-of-turn" }, [obj(id)]);

describe("infect", () => {
  it("combat damage to a player is poison counters, not life (rule 120.3b)", () => {
    const { game, a } = setUp();
    const agent = game.debugSpawn("Blighted Agent", A, "battlefield", { summoningSick: false });
    const life = game.state.players[B].life;
    attackWith(game, a, [agent]);
    expect(poisonOf(game, B)).toBe(1);
    expect(game.state.players[B].life).toBe(life);
  });

  it("damage to a creature is -1/-1 counters, not marked damage, and they stay (rule 120.3d)", () => {
    const { game, a, b } = setUp();
    const myr = game.debugSpawn("Ichorclaw Myr", A, "battlefield", { summoningSick: false });
    const wall = game.debugSpawn("Wall of Wood", B, "battlefield", { summoningSick: false });
    b.declareBlockersFn = () => [{ blocker: wall, attacker: myr }];
    attackWith(game, a, [myr]);
    // Ichorclaw Myr is 3/3 once blocked: three counters on the 0/3 wall,
    // which dies of 0 toughness; the wall's 0 damage leaves the Myr alone.
    expect(game.state.objects[wall].zone).toBe("graveyard");
    expect(game.state.objects[myr].zone).toBe("battlefield");
  });

  it("the counters outlast the turn — a creature that survives keeps them", () => {
    const { game } = setUp();
    const stinger = game.debugSpawn("Plague Stinger", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    // Noncombat: "infect's effect applies to any damage" (the ruling).
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 1 }, [obj(giant)], { source: stinger });
    settle(game);
    expect(minusCounters(game, giant)).toBe(1);
    expect(game.state.objects[giant].damageMarked).toBe(0);
    expect(game.characteristics(giant).toughness).toBe(2);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(minusCounters(game, giant)).toBe(1);
  });

  it("noncombat damage to a player is poison too", () => {
    const { game } = setUp();
    const stinger = game.debugSpawn("Plague Stinger", A, "battlefield");
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 3 }, [{ kind: "player", player: B }], {
      source: stinger,
    });
    settle(game);
    expect(poisonOf(game, B)).toBe(3);
    expect(game.state.players[B].life).toBe(20);
  });

  it("is still damage: lifelink gains the life (the ruling)", () => {
    const { game, a } = setUp();
    const agent = game.debugSpawn("Blighted Agent", A, "battlefield", { summoningSick: false });
    grant(game, agent, "lifelink");
    const life = game.state.players[A].life;
    attackWith(game, a, [agent]);
    expect(poisonOf(game, B)).toBe(1);
    expect(game.state.players[A].life).toBe(life + 1);
  });

  it("deathtouch still destroys: dealt damage by a deathtouch source, though none is marked (704.5h)", () => {
    const { game } = setUp();
    const stinger = game.debugSpawn("Plague Stinger", A, "battlefield");
    grant(game, stinger, "deathtouch");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 1 }, [obj(giant)], { source: stinger });
    settle(game);
    expect(game.state.objects[giant].zone).toBe("graveyard");
  });

  it("prevented damage gives no counters (the ruling)", () => {
    const { game } = setUp();
    const stinger = game.debugSpawn("Plague Stinger", A, "battlefield");
    game.debugApplyEffect(B, { kind: "prevent-damage", target: 0, amount: 4 }, [{ kind: "player", player: B }]);
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 3 }, [{ kind: "player", player: B }], {
      source: stinger,
    });
    settle(game);
    expect(poisonOf(game, B)).toBe(0);
  });

  it("a planeswalker loses loyalty as usual (the ruling)", () => {
    const { game } = setUp();
    const stinger = game.debugSpawn("Plague Stinger", A, "battlefield");
    const ajani = game.debugSpawn("Ajani, Caller of the Pride", B, "battlefield");
    const loyalty = game.state.objects[ajani].counters.loyalty ?? 0;
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 2 }, [obj(ajani)], { source: stinger });
    settle(game);
    expect(game.state.objects[ajani].counters.loyalty).toBe(loyalty - 2);
    expect(game.state.objects[ajani].counters["-1/-1"] ?? 0).toBe(0);
  });

  it("a source that has left is read as it last existed (rule 702.90d)", () => {
    const { game } = setUp();
    const dier = game.debugSpawn(DIER, A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(dier)]);
    settle(game);
    expect(game.state.objects[dier].zone).toBe("graveyard");
    expect(poisonOf(game, B)).toBe(3);
    expect(game.state.players[B].life).toBe(20);
  });

  it("ten poison counters lose the game", () => {
    const { game, a } = setUp();
    game.debugApplyEffect(A, { kind: "add-player-counters", counter: "poison", amount: 9, who: "each-opponent" });
    const agent = game.debugSpawn("Blighted Agent", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: agent, defender: B }];
    game.advanceUntil((s) => s.result.over);
    expect(game.state.players[B].hasLost).toBe(true);
    expect(game.state.players[B].lossReason).toContain("poison");
  });
});

describe("wither", () => {
  it("damage to a creature is -1/-1 counters; damage to a player is life as usual", () => {
    const { game } = setUp();
    const skitter = game.debugSpawn("Necroskitter", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 1 }, [obj(giant)], { source: skitter });
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 1 }, [{ kind: "player", player: B }], {
      source: skitter,
    });
    settle(game);
    expect(minusCounters(game, giant)).toBe(1);
    expect(game.state.objects[giant].damageMarked).toBe(0);
    expect(game.state.players[B].life).toBe(19);
    expect(poisonOf(game, B)).toBe(0);
  });

  it("the source's controller puts the counters: Hapatra makes a Snake (rule 120.3d)", () => {
    const { game } = setUp();
    game.debugSpawn("Hapatra, Vizier of Poisons", A, "battlefield");
    const skitter = game.debugSpawn("Necroskitter", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    const snakes = () =>
      game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Deathtouch Snake Token")
        .length;
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 2 }, [obj(giant)], { source: skitter });
    settle(game);
    expect(minusCounters(game, giant)).toBe(2);
    expect(snakes()).toBe(1);
  });

  it("a creature without wither still marks damage", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 2 }, [obj(giant)], { source: bears });
    settle(game);
    expect(game.state.objects[giant].damageMarked).toBe(2);
    expect(minusCounters(game, giant)).toBe(0);
  });
});
