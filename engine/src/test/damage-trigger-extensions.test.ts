/**
 * The damage-trigger vocabulary (`trigger:damage-trigger-extensions`):
 *
 * - `deals-damage`, the *dealing* end for any recipient — "whenever a source
 *   you control deals noncombat damage to an opponent" (Niv-Mizzet,
 *   Visionary), "another source you control deals exactly 1 damage to a
 *   permanent or player" (Ghyrson Starn), "a commander you control deals
 *   combat damage to an opponent" (Kediss), "a spell deals damage to its own
 *   target". Once per recipient per damage event, for the amount that
 *   recipient was actually *dealt*: prevention shrinks it, and damage that
 *   was prevented entirely was never dealt and triggers nothing.
 * - "that permanent or player" — a `damage` effect's `toTriggerRecipient`,
 *   which is not a target, and hits nothing once a permanent recipient has
 *   left the battlefield.
 * - `dealt-damage` narrowed by a `filter` (Sonic the Hedgehog's "a creature
 *   you control with flash or haste") and by combat/noncombat.
 * - damage *from* the triggering object — "it deals damage" (Be'lakor's
 *   entering Demon, Kediss's commander): its lifelink applies, and as it last
 *   existed on the battlefield if it has left.
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

/** "Whenever a source you control deals damage to a creature, you gain 1
 * life" — a `to: "creature"` watcher whose effect doesn't name the
 * recipient, so a token stack dealt damage counts once per token. */
const creatureWatcher = defineCard({
  name: "Test Creature Watcher",
  types: ["enchantment"],
  text: "Whenever a source you control deals damage to a creature, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "deals-damage", who: "you-control", to: "creature" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever a source you control deals damage to a creature, you gain 1 life.",
    },
  ],
});

/** "Whenever a spell you control deals damage to a permanent or player it
 * targets, you gain that much life." */
const spellWatcher = defineCard({
  name: "Test Spell Watcher",
  types: ["enchantment"],
  text: "Whenever a spell you control deals damage to a permanent or player it targets, you gain that much life.",
  triggered: [
    {
      trigger: { on: "deals-damage", who: "you-control", toItsTarget: true },
      targets: [],
      effect: { kind: "gain-life", amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever a spell you control deals damage to a permanent or player it targets, you gain that much life.",
    },
  ],
});

/** A spell that damages its target *and* something it doesn't target. */
const arc = defineCard({
  name: "Test Arc",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Test Arc deals 2 damage to target creature and 1 damage to each opponent.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 2, target: 0 },
      { kind: "damage", amount: 1, who: "each-opponent" },
    ],
  },
});

/** "Whenever an opponent's source deals combat damage to you…" — `who:
 * "opponent"`, a player recipient, combat only. */
const combatWatcher = defineCard({
  name: "Test Combat Watcher",
  types: ["enchantment"],
  text: "Whenever a source an opponent controls deals combat damage to you, draw a card.",
  triggered: [
    {
      trigger: { on: "deals-damage", who: "opponent", to: "player", combat: true },
      targets: [],
      effect: {
        kind: "conditional",
        condition: { kind: "your-turn" },
        then: { kind: "sequence", effects: [] },
        else: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "Whenever a source an opponent controls deals combat damage to you, draw a card.",
    },
  ],
});

/** Ghyrson's trigger on a nonlegendary body, so two can share a board. */
const autostub = defineCard({
  name: "Test Autostub",
  types: ["enchantment"],
  text: "Whenever another source you control deals exactly 1 damage to a permanent or player, this deals 2 damage to that permanent or player.",
  triggered: [
    {
      trigger: { on: "deals-damage", who: "you-control", otherOnly: true, exactly: 1 },
      targets: [],
      effect: { kind: "damage", amount: 2, toTriggerRecipient: true },
      resolve: null,
      text: "Whenever another source you control deals exactly 1 damage to a permanent or player, this deals 2 damage to that permanent or player.",
    },
  ],
});

/** A lifelinking Demon, for "it deals damage" from the entering creature. */
const lifelinkDemon = defineCard({
  name: "Test Lifelink Demon",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 4,
  toughness: 4,
  keywords: ["lifelink"],
  text: "Lifelink",
});

const TEST_CARDS: readonly CardDefinition[] = [creatureWatcher, spellWatcher, arc, combatWatcher, lifelinkDemon, autostub];

const setUp = (players: readonly PlayerId[] = [A, B]) => {
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
  s.pendingDiscards.length === 0;
const settle = (game: Game): void => game.advanceUntil((s) => s.turn.step === "precombat-main" && quiet(s));
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const object = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const hand = (game: Game, p: PlayerId): number => game.handOf(p).length;
/** `source` deals damage, as its own ability would. */
const hit = (game: Game, source: ObjectId, targets: readonly TargetRef[], amount: number): void => {
  const controller = game.state.objects[source].controller;
  const effect: EffectSpec = { kind: "damage", amount, target: 0 };
  for (const t of targets) game.debugApplyEffect(controller, effect, [t], { source });
};
const shield = (game: Game, target: TargetRef, amount: number): void =>
  game.debugApplyEffect(A, { kind: "prevent-damage", target: 0, amount }, [target]);
const damageEvents = (game: Game, source: ObjectId) =>
  game.state.eventLog.filter((e) => e.type === "damage-dealt" && e.source === source);

describe("deals-damage — Niv-Mizzet, Visionary", () => {
  it("draws the noncombat damage a source you control deals an opponent", () => {
    const { game } = setUp();
    spawn(game, "Niv-Mizzet, Visionary");
    const bears = spawn(game, "Grizzly Bears");
    const before = hand(game, A);
    hit(game, bears, [player(B)], 3);
    settle(game);
    expect(hand(game, A)).toBe(before + 3);
  });

  it("ignores damage to yourself, to a creature, and from an opponent's source", () => {
    const { game } = setUp();
    spawn(game, "Niv-Mizzet, Visionary");
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const before = hand(game, A);
    hit(game, mine, [player(A), object(theirs)], 1);
    hit(game, theirs, [player(B)], 2);
    settle(game);
    expect(hand(game, A)).toBe(before);
  });

  it("draws what got through a prevention shield, and nothing when all of it was prevented", () => {
    const { game } = setUp();
    spawn(game, "Niv-Mizzet, Visionary");
    const bears = spawn(game, "Grizzly Bears");
    const before = hand(game, A);
    shield(game, player(B), 2);
    hit(game, bears, [player(B)], 3);
    settle(game);
    expect(hand(game, A)).toBe(before + 1);
    shield(game, player(B), 5);
    hit(game, bears, [player(B)], 3);
    settle(game);
    expect(hand(game, A)).toBe(before + 1);
  });

  it("triggers once per opponent when one source damages them all at once", () => {
    const { game } = setUp([A, B, C, D]);
    const niv = spawn(game, "Niv-Mizzet, Visionary");
    const bears = spawn(game, "Grizzly Bears");
    const before = hand(game, A);
    game.debugApplyEffect(A, { kind: "damage", amount: 2, who: "each-opponent" }, [], { source: bears });
    const triggered = game.state.pendingTriggers.filter((t) => t.sourceObjectId === niv).length;
    expect(triggered).toBe(3);
    settle(game);
    expect(hand(game, A)).toBe(before + 6);
  });

  it("does not draw for combat damage", () => {
    const { game, controllers } = setUp();
    spawn(game, "Niv-Mizzet, Visionary");
    const bears = spawn(game, "Grizzly Bears");
    controllers[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    const before = hand(game, A);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(18);
    expect(hand(game, A)).toBe(before);
  });
});

describe("deals-damage — Ghyrson Starn's exactly-1 trigger", () => {
  it("adds 2 damage to a player dealt exactly 1 by another source you control", () => {
    const { game } = setUp();
    spawn(game, "Ghyrson Starn, Kelermorph");
    const bears = spawn(game, "Grizzly Bears");
    hit(game, bears, [player(B)], 1);
    settle(game);
    expect(life(game, B)).toBe(17);
  });

  it("does not fire for 2 damage, for an opponent's source, or off its own 2 damage", () => {
    const { game } = setUp();
    const ghyrson = spawn(game, "Ghyrson Starn, Kelermorph");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    hit(game, bears, [player(B)], 2);
    hit(game, theirs, [player(A)], 1);
    // Ghyrson's own damage of exactly 1 — "another source".
    hit(game, ghyrson, [player(B)], 1);
    settle(game);
    expect(life(game, B)).toBe(17);
    expect(life(game, A)).toBe(19);
  });

  it("counts the damage dealt after prevention: 2 prevented down to 1 is exactly 1", () => {
    const { game } = setUp();
    spawn(game, "Ghyrson Starn, Kelermorph");
    const bears = spawn(game, "Grizzly Bears");
    shield(game, player(B), 1);
    hit(game, bears, [player(B)], 2);
    settle(game);
    expect(life(game, B)).toBe(17);
  });

  it("fires once per recipient of one damage-all, each hit 2 more", () => {
    const { game } = setUp();
    const ghyrson = spawn(game, "Ghyrson Starn, Kelermorph");
    const bears = spawn(game, "Grizzly Bears");
    const giants = [spawn(game, "Hill Giant", B), spawn(game, "Hill Giant", B), spawn(game, "Hill Giant", B)];
    game.debugApplyEffect(
      A,
      { kind: "damage-all", filter: { subtype: "Giant" }, amount: 1 },
      [],
      { source: bears },
    );
    expect(game.state.pendingTriggers.filter((t) => t.sourceObjectId === ghyrson)).toHaveLength(3);
    settle(game);
    for (const id of giants) expect(game.state.objects[id].zone).toBe("graveyard");
  });

  it("hits nothing when the permanent dealt 1 has left the battlefield by resolution", () => {
    const { game } = setUp();
    const ghyrson = spawn(game, "Ghyrson Starn, Kelermorph");
    const bears = spawn(game, "Grizzly Bears");
    const elf = spawn(game, "Llanowar Elves", B);
    hit(game, bears, [object(elf)], 1);
    settle(game);
    expect(game.state.objects[elf].zone).toBe("graveyard");
    expect(damageEvents(game, ghyrson)).toHaveLength(0);
  });

  it("a token stack dealt 1 fires it once per token, and each token is dealt 2 more", () => {
    const { game } = setUp();
    const ghyrson = spawn(game, "Ghyrson Starn, Kelermorph");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(B, { kind: "create-token", token: "3/3 Beast Token", count: 10 });
    game.debugApplyEffect(
      A,
      { kind: "damage-all", filter: { subtype: "Beast" }, amount: 1 },
      [],
      { source: bears },
    );
    expect(game.state.pendingTriggers.filter((t) => t.sourceObjectId === ghyrson)).toHaveLength(10);
    settle(game);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "3/3 Beast Token")).toHaveLength(0);
  });

  it("isn't a target: hexproof or not, the recipient is dealt it", () => {
    const { game } = setUp();
    spawn(game, "Ghyrson Starn, Kelermorph");
    const bears = spawn(game, "Grizzly Bears");
    game.state.hexproofPlayers.push(B);
    hit(game, bears, [player(B)], 1);
    settle(game);
    expect(life(game, B)).toBe(17);
  });

  it("two of them retrigger each other only while prevention makes a 2 into a 1", () => {
    const { game } = setUp();
    const g1 = spawn(game, "Ghyrson Starn, Kelermorph");
    const g2 = spawn(game, "Test Autostub");
    const bears = spawn(game, "Grizzly Bears");
    hit(game, bears, [player(B)], 1);
    // Both fire off the Bears' 1. A 3-point shield then eats the first
    // one's 2 whole and 1 of the second's, so the second deals exactly 1 —
    // another source you control, for the first, which fires again and deals an unprevented 2 that fires nothing.
    shield(game, player(B), 3);
    settle(game);
    const dealt = [...damageEvents(game, g1), ...damageEvents(game, g2)].map((e) =>
      e.type === "damage-dealt" ? e.amount : 0,
    );
    expect(dealt.sort()).toEqual([1, 2]);
    expect(life(game, B)).toBe(20 - 1 - 1 - 2);
    expect(game.state.zones.shared.stack).toHaveLength(0);
  });
});

describe("deals-damage — recipients, spells and token stacks", () => {
  it("toItsTarget: only the damage a spell deals to something it targets", () => {
    const { game } = setUp();
    spawn(game, "Test Spell Watcher");
    for (let i = 0; i < 2; i += 1) spawn(game, "Mountain");
    const giant = spawn(game, "Hill Giant", B);
    const arcCard = game.debugSpawn("Test Arc", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: arcCard, targets: [object(giant)] });
    settle(game);
    // 2 to the targeted Giant gained; the untargeted 1 to Bob didn't.
    expect(life(game, B)).toBe(19);
    expect(life(game, A)).toBe(22);
  });

  it("a token stack dealt damage is that many creatures dealt damage", () => {
    const { game } = setUp();
    spawn(game, "Test Creature Watcher");
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(B, { kind: "create-token", token: "Goblin Token", count: 12 });
    const stack = game.battlefield.find((id) => game.state.objects[id].cardName === "Goblin Token");
    expect(game.state.objects[stack as ObjectId].stackCount).toBe(12);
    game.debugApplyEffect(
      A,
      { kind: "damage-all", filter: { subtype: "Goblin" }, amount: 1 },
      [],
      { source: bears },
    );
    settle(game);
    expect(life(game, A)).toBe(32);
  });

  it("who: opponent / to: player / combat: an attacker's combat damage to you", () => {
    const { game, controllers } = setUp();
    spawn(game, "Test Combat Watcher", B);
    const bears = spawn(game, "Grizzly Bears");
    controllers[A].declareAttackersFn = () => [{ attacker: bears, defender: B }];
    const before = hand(game, B);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(hand(game, B)).toBe(before + 1);
  });
});

describe("dealt-damage with a filter — Sonic the Hedgehog", () => {
  const treasures = (game: Game, p: PlayerId): ObjectId[] =>
    game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Treasure Token" && game.state.objects[id].controller === p,
    );

  it("a creature you control with haste dealt damage makes a tapped Treasure; one without doesn't", () => {
    const { game } = setUp();
    const sonic = spawn(game, "Sonic the Hedgehog");
    const bears = spawn(game, "Grizzly Bears");
    const goblin = spawn(game, "Raging Goblin");
    const theirs = spawn(game, "Grizzly Bears", B);
    hit(game, theirs, [object(bears), object(goblin), object(sonic)], 1);
    settle(game);
    const made = treasures(game, A);
    expect(made).toHaveLength(2); // Sonic and the Goblin, not the Bears
    for (const id of made) expect(game.state.objects[id].tapped).toBe(true);
  });

  it("a stack of hasty tokens dealt damage is that many creatures: a Treasure each", () => {
    const { game } = setUp();
    spawn(game, "Sonic the Hedgehog");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "create-token", token: "Elemental Token", count: 10 });
    game.debugApplyEffect(
      B,
      { kind: "damage-all", filter: { subtype: "Elemental", controlledBy: "opponent" }, amount: 1 },
      [],
      { source: theirs },
    );
    settle(game);
    expect(treasures(game, A)).toHaveLength(10);
  });

  it("damage from two sources at once is one event for the creature: one Treasure", () => {
    const { game } = setUp();
    const sonic = spawn(game, "Sonic the Hedgehog");
    const x = spawn(game, "Grizzly Bears", B);
    const y = spawn(game, "Grizzly Bears", B);
    // Two sources' damage dealt together, as two blockers' is.
    (game as unknown as { withDamageBatch(fn: () => void): void }).withDamageBatch(() => {
      hit(game, x, [object(sonic)], 1);
      hit(game, y, [object(sonic)], 1);
    });
    settle(game);
    expect(treasures(game, A)).toHaveLength(1);
  });

  it("prevented damage isn't dealt: no Treasure", () => {
    const { game } = setUp();
    const sonic = spawn(game, "Sonic the Hedgehog");
    const theirs = spawn(game, "Grizzly Bears", B);
    shield(game, object(sonic), 3);
    hit(game, theirs, [object(sonic)], 2);
    settle(game);
    expect(treasures(game, A)).toHaveLength(0);
  });
});

describe("damage from the trigger object — \"it deals damage\"", () => {
  it("Be'lakor: the entering Demon deals its power, and its lifelink is its own", () => {
    const { game, controllers } = setUp();
    spawn(game, "Be'lakor, the Dark Master");
    controllers[A].chooseTargetsFn = () => [player(B)];
    game.debugSpawn("Test Lifelink Demon", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(16);
    expect(life(game, A)).toBe(24);
  });

  it("Be'lakor: a Demon that has left by resolution deals the power it last had", () => {
    const { game, controllers } = setUp();
    spawn(game, "Be'lakor, the Dark Master");
    controllers[A].chooseTargetsFn = () => [player(B)];
    const demon = game.debugSpawn("Test Lifelink Demon", A, "battlefield", { announceEntry: true });
    game.debugApplyEffect(
      A,
      { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      [object(demon)],
    );
    game.advanceUntil((s) => s.zones.shared.stack.length > 0);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [object(demon)]);
    settle(game);
    expect(game.state.objects[demon].zone).toBe("graveyard");
    expect(life(game, B)).toBe(14);
    expect(life(game, A)).toBe(26);
  });
});
