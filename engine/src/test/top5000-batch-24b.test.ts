/**
 * Top-5000 batch 24b. No engine change: each card is written in vocabulary
 * the pool already uses. These pin the clause most likely to be wired wrong
 * on each — damage doubled only to an opponent (Fiendish Duo), a landfall
 * draw gated on eight lands (Omnath, Locus of the Roil), a drain counted by
 * Vampires (Malakir Bloodwitch), "other attacking creatures" (Commissar
 * Severina Raine), a "Zombies and/or tokens" anthem and a once-per-move
 * graveyard trigger (On Wings of Gold), an opponent's creature exiled instead
 * of dying (Stone of Erech), an animation with no duration (Ride the Shoopuf),
 * an intervening-if threshold (Kiora, the Rising Tide), your-turn-only
 * hexproof and toughness damage (Bedrock Tortoise), and a lord over every
 * player's Zombies (Lord of the Undead).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const toPostcombat = (game: Game): void =>
  game.advanceUntil(
    (s) => s.turn.step === "postcombat-main" && s.zones.shared.stack.length === 0 && s.awaiting === null,
  );

describe("top-5000 batch 24b — Fiendish Duo", () => {
  it("doubles damage to an opponent from any source, but not to you or to a permanent", () => {
    const { game } = setUp();
    spawn(game, "Fiendish Duo");
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 3 }, [{ kind: "player", player: B }], {
      source: mine,
    });
    expect(life(game, B)).toBe(14);
    game.debugApplyEffect(A, { kind: "damage", target: 0, amount: 2 }, [{ kind: "object", object: giant }], {
      source: mine,
    });
    expect(game.state.objects[giant].damageMarked).toBe(2);
    game.debugApplyEffect(B, { kind: "damage", target: 0, amount: 3 }, [{ kind: "player", player: A }], {
      source: theirs,
    });
    expect(life(game, A)).toBe(17);
  });
});

describe("top-5000 batch 24b — Omnath, Locus of the Roil", () => {
  it("puts a counter on an Elemental for each land, drawing only from the eighth land on", () => {
    const { game } = setUp();
    const omnath = spawn(game, "Omnath, Locus of the Roil");
    for (let i = 0; i < 6; i += 1) spawn(game, "Wastes");
    const hand = game.handOf(A).length;
    game.debugSpawn("Wastes", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, omnath)).toBe(1);
    expect(game.handOf(A).length).toBe(hand);
    game.debugSpawn("Wastes", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, omnath)).toBe(2);
    expect(game.handOf(A).length).toBe(hand + 1);
  });
});

describe("top-5000 batch 24b — Malakir Bloodwitch", () => {
  it("drains each opponent by the Vampires you control, itself included", () => {
    const { game } = setUp();
    spawn(game, "Captivating Vampire");
    spawn(game, "Grizzly Bears");
    game.debugSpawn("Malakir Bloodwitch", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-5000 batch 24b — Commissar Severina Raine", () => {
  it("makes each opponent lose life for the other attacking creatures, not itself", () => {
    const { game, a } = setUp();
    const raine = spawn(game, "Commissar Severina Raine");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    a.declareAttackersFn = () => [
      { attacker: raine, defender: B },
      { attacker: bears, defender: B },
      { attacker: giant, defender: B },
    ];
    toPostcombat(game);
    // 2 from the trigger (two others), then 2 + 2 + 3 combat damage.
    expect(life(game, B)).toBe(11);
  });
});

describe("top-5000 batch 24b — On Wings of Gold", () => {
  it("pumps your tokens and Zombies only, and makes one Zombie however many cards leave together", () => {
    const { game } = setUp();
    const wings = spawn(game, "On Wings of Gold");
    const bears = spawn(game, "Grizzly Bears");
    const merchant = spawn(game, "Gray Merchant of Asphodel");
    const theirMerchant = spawn(game, "Gray Merchant of Asphodel", B);
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 1 }, [], { source: wings });
    const soldier = named(game, "Soldier Token")[0];
    expect(chars(game, bears).power).toBe(2);
    expect(chars(game, bears).keywords.has("flying")).toBe(false);
    expect(chars(game, merchant).power).toBe(3);
    expect(chars(game, merchant).keywords.has("flying")).toBe(true);
    expect(chars(game, soldier).power).toBe(2);
    expect(chars(game, soldier).keywords.has("flying")).toBe(true);
    expect(chars(game, theirMerchant).power).toBe(2);

    game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Hill Giant", A, "graveyard");
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: 0 }, [{ kind: "player", player: A }]);
    settle(game);
    const zombies = named(game, "Zombie Token (On Wings of Gold)");
    expect(zombies).toHaveLength(1);
    // A 1/1 Zombie token: +1/+1 once, not twice for being both.
    expect(chars(game, zombies[0]).power).toBe(2);
  });
});

describe("top-5000 batch 24b — Stone of Erech", () => {
  it("exiles an opponent's creature that would die, and lets yours die", () => {
    const { game } = setUp();
    spawn(game, "Stone of Erech");
    const theirs = spawn(game, "Grizzly Bears", B);
    const mine = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: theirs }]);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: mine }]);
    settle(game);
    expect(zone(game, theirs)).toBe("exile");
    expect(zone(game, mine)).toBe("graveyard");
  });
});

describe("top-5000 batch 24b — Ride the Shoopuf", () => {
  it("stays a 7/7 Beast creature enchantment into the next turn", () => {
    const { game } = setUp();
    const shoopuf = spawn(game, "Ride the Shoopuf");
    const animate = registry.get("Ride the Shoopuf")!.activated[0].effect!;
    game.debugApplyEffect(A, animate, [], { source: shoopuf });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    const c = chars(game, shoopuf);
    expect(c.types).toContain("creature");
    expect(c.types).toContain("enchantment");
    expect(c.power).toBe(7);
    expect(c.toughness).toBe(7);
  });
});

describe("top-5000 batch 24b — Kiora, the Rising Tide", () => {
  it("creates Scion of the Deep when it attacks with seven cards in your graveyard", () => {
    const { game, a } = setUp();
    const kiora = spawn(game, "Kiora, the Rising Tide");
    for (let i = 0; i < 7; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    a.declareAttackersFn = () => [{ attacker: kiora, defender: B }];
    toPostcombat(game);
    const scion = named(game, "Scion of the Deep");
    expect(scion).toHaveLength(1);
    expect(chars(game, scion[0]).power).toBe(8);
  });

  it("doesn't trigger with six", () => {
    const { game, a } = setUp();
    const kiora = spawn(game, "Kiora, the Rising Tide");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Wastes", A, "graveyard");
    a.declareAttackersFn = () => [{ attacker: kiora, defender: B }];
    toPostcombat(game);
    expect(named(game, "Scion of the Deep")).toHaveLength(0);
  });
});

describe("top-5000 batch 24b — Bedrock Tortoise", () => {
  it("gives your creatures hexproof on your turn only, and deals its toughness in combat", () => {
    const { game, a } = setUp();
    const tortoise = spawn(game, "Bedrock Tortoise");
    const bears = spawn(game, "Grizzly Bears");
    expect(chars(game, bears).keywords.has("hexproof")).toBe(true);
    a.declareAttackersFn = () => [
      { attacker: tortoise, defender: B },
      { attacker: bears, defender: B },
    ];
    toPostcombat(game);
    // The 0/6 assigns 6; the 2/2 (toughness not greater) assigns 2.
    expect(life(game, B)).toBe(12);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(chars(game, bears).keywords.has("hexproof")).toBe(false);
  });
});

describe("top-5000 batch 24b — Lord of the Undead", () => {
  it("pumps every player's other Zombie creatures, not itself", () => {
    const { game } = setUp();
    const lord = spawn(game, "Lord of the Undead");
    const theirs = spawn(game, "Gray Merchant of Asphodel", B);
    expect(chars(game, lord).power).toBe(2);
    expect(chars(game, theirs).power).toBe(3);
  });
});
