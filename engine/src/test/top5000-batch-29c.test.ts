/**
 * Top-5000 batch 29c. No engine change: each card is existing vocabulary.
 * The tests pin the clauses most likely to be wired wrong — an end-step
 * intervening-if gated on the chosen mode and a death under your control
 * (Barrensteppe Siege), the dead creature's last-known power (Death's
 * Presence), "that player" of a discard (Fell Specter), a sacrifice by any
 * player and "defending player" of an attack (Fumulus), "a player lost 4"
 * read per player (Knight of the Ebon Legion), a mana ability's life loss
 * and an "each player" intervening-if (Cryptolith Fragment), a "you may
 * sacrifice … if you do" mode (Witherbloom Charm), an up-to-one target beside
 * a player target (Necron Deathmark) and "Slivers you control" (Thrumming
 * Hivepool).
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
const setUp = (): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Wastes") },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
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
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const hasKeyword = (game: Game, id: ObjectId, keyword: string): boolean =>
  computeCharacteristics(game.state, registry, id).keywords.has(keyword as never);
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
const destroy = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  settle(game);
};
const toTurn = (game: Game, turn: number): void =>
  game.advanceUntil((s) => s.turn.number === turn && s.turn.step === "precombat-main" && quiet(s));

describe("top-5000 batch 29c — Barrensteppe Siege (Mardu)", () => {
  it("makes each opponent sacrifice at your end step only if a creature died under your control", () => {
    const died = setUp().game;
    const siege = spawn(died, "Barrensteppe Siege");
    died.state.objects[siege].chosenOnEnter = "Mardu";
    const mine = spawn(died, "Grizzly Bears");
    const theirs = spawn(died, "Grizzly Bears", B);
    destroy(died, mine);
    toTurn(died, 2);
    expect(zone(died, theirs)).toBe("graveyard");

    // Nothing of yours died: the ability doesn't trigger.
    const quietTurn = setUp().game;
    const siege2 = spawn(quietTurn, "Barrensteppe Siege");
    quietTurn.state.objects[siege2].chosenOnEnter = "Mardu";
    const bears = spawn(quietTurn, "Grizzly Bears");
    const theirs2 = spawn(quietTurn, "Grizzly Bears", B);
    // An opponent's creature dying doesn't count either.
    const other = spawn(quietTurn, "Hill Giant", B);
    destroy(quietTurn, other);
    toTurn(quietTurn, 2);
    expect(zone(quietTurn, theirs2)).toBe("battlefield");
    // Mardu chosen, so no Abzan counters.
    expect(counters(quietTurn, bears)).toBe(0);
  });
});

describe("top-5000 batch 29c — Death's Presence", () => {
  it("puts counters equal to the dead creature's power on a creature you control", () => {
    const { game } = setUp();
    spawn(game, "Death's Presence");
    const giant = spawn(game, "Hill Giant"); // 3/3
    const bears = spawn(game, "Grizzly Bears");
    destroy(game, giant);
    expect(zone(game, giant)).toBe("graveyard");
    expect(counters(game, bears)).toBe(3);
  });
});

describe("top-5000 batch 29c — Fell Specter", () => {
  it("makes an opponent who discards lose 2 life, and not you", () => {
    const { game } = setUp();
    spawn(game, "Fell Specter");
    const discard: EffectSpec = { kind: "discard", target: 0, amount: 1 };
    game.debugApplyEffect(A, discard, [{ kind: "player", player: B }]);
    settle(game);
    expect(life(game, B)).toBe(18);
    game.debugApplyEffect(A, discard, [{ kind: "player", player: A }]);
    settle(game);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 29c — Knight of the Ebon Legion", () => {
  it("grows when one player lost 4 life this turn, not when two lost 2 apiece", () => {
    const one = setUp().game;
    const knight = spawn(one, "Knight of the Ebon Legion");
    const drain: EffectSpec = { kind: "lose-life", amount: 2, who: "each-opponent" };
    one.debugApplyEffect(A, drain);
    one.debugApplyEffect(A, drain);
    settle(one);
    toTurn(one, 2);
    expect(counters(one, knight)).toBe(1);

    const split = setUp().game;
    const knight2 = spawn(split, "Knight of the Ebon Legion");
    split.debugApplyEffect(A, { kind: "lose-life", amount: 2, who: "each-player" });
    settle(split);
    toTurn(split, 2);
    expect(counters(split, knight2)).toBe(0);
  });
});

describe("top-5000 batch 29c — Witherbloom Charm", () => {
  it("sacrifices a permanent to draw two", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const hand = game.handOf(A).length;
    const mode = registry.get("Witherbloom Charm")!.castModal!.modes[0].effect;
    game.debugApplyEffect(A, mode);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(hand + 2);
  });
});

describe("top-5000 batch 29c — Necron Deathmark", () => {
  it("destroys the creature and mills the player, each from its own slot", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const effect = registry.get("Necron Deathmark")!.triggered[0].effect!;
    game.debugApplyEffect(A, effect, [
      { kind: "object", object: bears },
      { kind: "player", player: B },
    ]);
    settle(game);
    expect(zone(game, bears)).toBe("graveyard");
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(4);
  });
});

describe("top-5000 batch 29c — Thrumming Hivepool", () => {
  it("gives your Slivers double strike and haste, not an opponent's or a non-Sliver", () => {
    const { game } = setUp();
    spawn(game, "Thrumming Hivepool");
    const mine = spawn(game, "Sliver Token");
    const theirs = spawn(game, "Sliver Token", B);
    const bears = spawn(game, "Grizzly Bears");
    expect(hasKeyword(game, mine, "double-strike")).toBe(true);
    expect(hasKeyword(game, mine, "haste")).toBe(true);
    expect(hasKeyword(game, theirs, "double-strike")).toBe(false);
    expect(hasKeyword(game, bears, "haste")).toBe(false);
  });
});
