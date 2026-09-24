/**
 * More player scopes (`effect:player-scope-extensions`):
 *
 * - players the triggering event names: `"trigger-player"` — the player
 *   dealt damage (or the controller of the permanent dealt damage), the
 *   defending player of an attack — and `"each-other-opponent"`, every
 *   opponent but that one (Kediss's "each other opponent");
 * - a scope for `mill`, `discard` and `create-token` ("each opponent mills
 *   X", Hope Estheim), with a scoped discard asking each player with a real
 *   choice in turn rather than overwriting one question with the next;
 * - `CardFilter.controlledBy: "active-player"`;
 * - per-player amounts — `{ lifeTotal: "each" }` and `{ half, round }`:
 *   "each opponent loses half their life, rounded up".
 */
import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import type { CardDefinition } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

/** "Whenever this attacks, defending player loses 1 life and each other
 * opponent gains 1 life." */
const raider = defineCard({
  name: "Test Raider",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 2,
  toughness: 2,
  text: "Whenever this creature attacks, defending player loses 1 life and each other opponent gains 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "trigger-player" },
          { kind: "gain-life", amount: 1, who: "each-other-opponent" },
        ],
      },
      resolve: null,
      text: "Whenever this creature attacks, defending player loses 1 life and each other opponent gains 1 life.",
    },
  ],
});

/** "Whenever a source you control deals damage to a creature, that
 * creature's controller sacrifices a creature." — `trigger-player` for a
 * permanent recipient, through the sacrifice queue. */
const punisher = defineCard({
  name: "Test Punisher",
  types: ["enchantment"],
  text: "Whenever a source you control deals damage to a creature, that creature's controller sacrifices a creature.",
  triggered: [
    {
      trigger: { on: "deals-damage", who: "you-control", to: "creature" },
      targets: [],
      effect: { kind: "sacrifice", who: "trigger-player", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "Whenever a source you control deals damage to a creature, that creature's controller sacrifices a creature.",
    },
  ],
});

const TEST_CARDS: readonly CardDefinition[] = [raider, punisher];

const setUp = (players: readonly PlayerId[] = [A, B, C, D]) => {
  const registry = createDefaultRegistry();
  for (const card of TEST_CARDS) registry.register(card);
  const controllers = Object.fromEntries(players.map((p) => [p, new ScriptedController(p)]));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Mountain") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, controllers: controllers as Record<string, ScriptedController> };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.pendingDiscards.length === 0 &&
  s.pendingSacrifices.length === 0;
const settle = (game: Game): void => game.advanceUntil((s) => s.turn.step === "precombat-main" && quiet(s));
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const apply = (game: Game, effect: EffectSpec, targets: readonly TargetRef[] = []): void =>
  game.debugApplyEffect(A, effect, targets);
const graveyard = (game: Game, p: PlayerId): number => game.state.zones.perPlayer[p].graveyard.length;

describe("players the triggering event names", () => {
  it("an attack trigger's defending player, and each other opponent", () => {
    const { game, controllers } = setUp();
    const raiderId = spawn(game, "Test Raider");
    controllers[A].declareAttackersFn = () => [{ attacker: raiderId, defender: C }];
    game.advanceUntil((s) => s.turn.step === "declare-blockers" || s.turn.step === "combat-damage");
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, C)).toBe(20 - 1 - 2);
    expect(life(game, B)).toBe(21);
    expect(life(game, D)).toBe(21);
    expect(life(game, A)).toBe(20);
  });

  it("an attack on a planeswalker names its controller as defending player", () => {
    const { game, controllers } = setUp();
    const raiderId = spawn(game, "Test Raider");
    const walker = spawn(game, "Chandra, Acolyte of Flame", D);
    controllers[A].declareAttackersFn = () => [{ attacker: raiderId, defender: walker }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, D)).toBe(19);
    expect(life(game, B)).toBe(21);
    expect(life(game, C)).toBe(21);
  });

  it("the controller of a permanent dealt damage — through the sacrifice queue", () => {
    const { game } = setUp();
    spawn(game, "Test Punisher");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", C);
    spawn(game, "Grizzly Bears", C);
    spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "damage", amount: 1, target: 0 }, [{ kind: "object", object: giant }], {
      source: bears,
    });
    settle(game);
    const creaturesOf = (p: PlayerId) =>
      game.battlefield.filter(
        (id) => game.state.objects[id].controller === p && game.state.objects[id].cardName !== "Mountain",
      ).length;
    expect(creaturesOf(C)).toBe(1);
    expect(creaturesOf(B)).toBe(1);
  });

  it("outside a trigger, trigger-player is nobody and each-other-opponent is every opponent", () => {
    const { game } = setUp();
    apply(game, { kind: "lose-life", amount: 2, who: "trigger-player" });
    apply(game, { kind: "lose-life", amount: 1, who: "each-other-opponent" });
    expect([life(game, A), life(game, B), life(game, C), life(game, D)]).toEqual([20, 19, 19, 19]);
  });
});

describe("Kediss — combat damage to one opponent, the same to each other opponent", () => {
  it("deals the commander's combat damage to every opponent but the one it hit", () => {
    const { game, controllers } = setUp();
    spawn(game, "Kediss, Emberclaw Familiar");
    const giant = spawn(game, "Hill Giant");
    game.state.objects[giant].isCommander = true;
    const plain = spawn(game, "Grizzly Bears");
    controllers[A].declareAttackersFn = () => [
      { attacker: giant, defender: B },
      { attacker: plain, defender: C },
    ];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    // The Giant hit Bob for 3: Carol and Dave take 3 more. The Bears aren't
    // a commander.
    expect(life(game, B)).toBe(17);
    expect(life(game, C)).toBe(20 - 2 - 3);
    expect(life(game, D)).toBe(17);
    expect(life(game, A)).toBe(20);
  });
});

describe("scoped mill, discard and create-token", () => {
  it("each opponent mills, a per-player amount read for each", () => {
    const { game } = setUp();
    game.state.players[B].life = 7;
    apply(game, { kind: "mill", target: "each-opponent", amount: { half: { lifeTotal: "each" }, round: "down" } });
    expect([graveyard(game, A), graveyard(game, B), graveyard(game, C), graveyard(game, D)]).toEqual([
      0, 3, 10, 10,
    ]);
  });

  it("each player mills", () => {
    const { game } = setUp();
    apply(game, { kind: "mill", target: "each-player", amount: 2 });
    for (const p of [A, B, C, D]) expect(graveyard(game, p)).toBe(2);
  });

  it("each opponent discards: each is asked in turn, APNAP, not one over another", () => {
    const { game } = setUp();
    apply(game, { kind: "discard", target: "each-opponent", amount: 1 });
    const asked: PlayerId[] = [];
    for (let i = 0; i < 3; i += 1) {
      const awaiting = game.state.awaiting;
      if (awaiting?.kind !== "discard") throw new Error(`expected a discard, got ${awaiting?.kind}`);
      asked.push(awaiting.player);
      const card = game.handOf(awaiting.player)[0];
      game.dispatch({ type: "discard", player: awaiting.player, cards: [card] });
    }
    expect(asked).toEqual([B, C, D]);
    expect(game.state.awaiting).toBeNull();
    for (const p of [B, C, D]) expect(graveyard(game, p)).toBe(1);
    expect(graveyard(game, A)).toBe(0);
  });

  it("a player with no real choice discards at once and nobody waits on them", () => {
    const { game } = setUp([A, B, C]);
    const bobsHand = [...game.handOf(B)];
    for (const id of bobsHand.slice(1)) {
      (game as unknown as { moveObject(id: ObjectId, to: string): boolean }).moveObject(id, "library");
    }
    apply(game, { kind: "discard", target: "each-opponent", amount: 1 });
    // Bob's lone card went straight away; Carol is asked.
    expect(game.handOf(B)).toHaveLength(0);
    expect(game.state.awaiting?.kind === "discard" && game.state.awaiting.player).toBe(C);
    expect(game.state.pendingDiscards).toHaveLength(0);
  });

  it("each opponent creates a token under their own control", () => {
    const { game } = setUp();
    apply(game, { kind: "create-token", token: "Treasure Token", count: 1, who: "each-opponent" });
    const treasures = game.battlefield
      .filter((id) => game.state.objects[id].cardName === "Treasure Token")
      .map((id) => game.state.objects[id].controller)
      .sort();
    expect(treasures).toEqual([B, C, D].sort());
  });
});

describe("controlledBy: active-player", () => {
  it("matches the permanents of whoever's turn it is, whoever is asking", () => {
    const { game } = setUp([A, B]);
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "destroy-all", filter: { type: "creature", controlledBy: "active-player" } });
    settle(game);
    expect(game.state.objects[mine].zone).toBe("graveyard");
    expect(game.state.objects[theirs].zone).toBe("battlefield");
  });
});

describe("per-player amounts", () => {
  it("each opponent loses half their life, rounded up", () => {
    const { game } = setUp();
    game.state.players[C].life = 15;
    game.state.players[D].life = 1;
    apply(game, {
      kind: "lose-life",
      amount: { half: { lifeTotal: "each" }, round: "up" },
      who: "each-opponent",
    });
    expect([life(game, A), life(game, B), life(game, C), life(game, D)]).toEqual([20, 10, 7, 0]);
  });

  it("a per-player amount of damage to each opponent, dealt all at once", () => {
    const { game } = setUp();
    game.state.players[B].life = 9;
    apply(game, { kind: "damage", amount: { half: { lifeTotal: "each" }, round: "down" }, who: "each-opponent" });
    expect([life(game, B), life(game, C), life(game, D)]).toEqual([5, 10, 10]);
  });

  it("lifeTotal: each outside a scoped effect is the controller's", () => {
    const { game } = setUp();
    game.state.players[A].life = 12;
    apply(game, { kind: "gain-life", amount: { half: { lifeTotal: "each" }, round: "up" } });
    expect(life(game, A)).toBe(18);
  });
});
