/**
 * Top-10000 batch 34a. No engine change: each test pins the clause of a card
 * most likely to be wired wrong — a dies trigger's sweep (Ryusei), a count
 * read as the ability resolves (Charisma Bobblehead), a may whose life cost is
 * the triggering spell's mana value and which happens once a turn (G'raha
 * Tia), a Pirate check made as the creature is exiled (Siren's Ruse), a
 * Lieutenant (Stormsurge Kraken), a death-this-turn rider (Fungal Rebirth)
 * and a Sliver lord that reaches every player's Slivers (Winged Sliver).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
/** Every token a stack stands for, counted. */
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
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
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;

describe("top-10000 batch 34a — Ryusei, the Falling Star", () => {
  it("deals 5 to each creature without flying as it dies, and spares fliers", () => {
    const { game } = setUp();
    const ryusei = spawn(game, "Ryusei, the Falling Star");
    const giant = spawn(game, "Hill Giant", B);
    const thopter = spawn(game, "Ornithopter", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: ryusei }]);
    settle(game);
    expect(zone(game, ryusei)).toBe("graveyard");
    expect(zone(game, giant)).toBe("graveyard");
    expect(zone(game, thopter)).toBe("battlefield");
  });
});

describe("top-10000 batch 34a — Charisma Bobblehead", () => {
  it("makes one Soldier per Bobblehead you control", () => {
    const { game } = setUp();
    lands(game, "Wastes", 4);
    const first = spawn(game, "Charisma Bobblehead");
    spawn(game, "Charisma Bobblehead");
    spawn(game, "Charisma Bobblehead", B);
    game.dispatch({ type: "activate-ability", player: A, source: first, abilityIndex: 1 });
    settle(game);
    expect(tokenCount(game, "Soldier Token")).toBe(2);
  });
});

describe("top-10000 batch 34a — G'raha Tia, Scion Reborn", () => {
  it("pays the spell's mana value in life for a Hero with that many counters, once a turn", () => {
    const { game } = setUp(["Mind Stone", "Sol Ring"]);
    lands(game, "Wastes", 4);
    spawn(game, "G'raha Tia, Scion Reborn");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Mind Stone"), targets: [] });
    settle(game);
    const heroes = named(game, "Hero Token (Black Mage's Rod)");
    expect(heroes).toHaveLength(1);
    expect(counters(game, heroes[0])).toBe(2);
    expect(life(game, A)).toBe(18);
    // A second noncreature spell the same turn isn't offered the payment.
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring"), targets: [] });
    settle(game);
    expect(named(game, "Hero Token (Black Mage's Rod)")).toHaveLength(1);
    expect(life(game, A)).toBe(18);
  });
});

describe("top-10000 batch 34a — Siren's Ruse", () => {
  it("draws only when the creature exiled was a Pirate", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Siren's Ruse"), [{ kind: "object", object: bears }]);
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    expect(game.handOf(A)).toHaveLength(hand);
    const pirate = spawn(game, "Angrath's Marauders");
    game.debugApplyEffect(A, effectOf("Siren's Ruse"), [{ kind: "object", object: pirate }]);
    settle(game);
    expect(named(game, "Angrath's Marauders")).toHaveLength(1);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });
});

describe("top-10000 batch 34a — Stormsurge Kraken", () => {
  it("is 7/7 only while you control your own commander", () => {
    const { game } = setUp();
    const kraken = spawn(game, "Stormsurge Kraken");
    const before = computeCharacteristics(game.state, registry, kraken);
    expect([before.power, before.toughness]).toEqual([5, 5]);
    const commander = spawn(game, "Grizzly Bears");
    game.state.objects[commander].isCommander = true;
    const after = computeCharacteristics(game.state, registry, kraken);
    expect([after.power, after.toughness]).toEqual([7, 7]);
    // Another player's commander doesn't count.
    game.state.objects[commander].isCommander = false;
    const theirs = spawn(game, "Grizzly Bears", B);
    game.state.objects[theirs].isCommander = true;
    const again = computeCharacteristics(game.state, registry, kraken);
    expect([again.power, again.toughness]).toEqual([5, 5]);
  });
});

describe("top-10000 batch 34a — Winged Sliver", () => {
  it("gives every player's Sliver creatures flying", () => {
    const { game } = setUp();
    const winged = spawn(game, "Winged Sliver");
    const theirs = spawn(game, "Sinew Sliver", B);
    const bears = spawn(game, "Grizzly Bears", B);
    expect(computeCharacteristics(game.state, registry, winged).keywords.has("flying")).toBe(true);
    expect(computeCharacteristics(game.state, registry, theirs).keywords.has("flying")).toBe(true);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("flying")).toBe(false);
  });
});
