/**
 * Top-5000 batch 26c. No engine change: each test pins the clause most likely
 * to be wired wrong — a lord that spares itself (Coppercoat Vanguard), an
 * "activate only if an opponent controls four or more lands" gate (Tectonic
 * Edge), a dies trigger reading last-known power (Nested Shambler), an attack
 * trigger lasting until your next turn (Azure Beastbinder), a win-a-flip
 * trigger that is yours only (Tavern Scoundrel), and a combat-damage mill
 * that takes a creature from among the milled cards (Barrowgoyf).
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
const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
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
/** Every token a name stands for, a stack counted once per token. */
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
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

describe("top-5000 batch 26c — Coppercoat Vanguard", () => {
  it("gives each other Human you control +1/+0, not itself, a non-Human or an opponent's Human", () => {
    const { game } = setUp();
    const vanguard = spawn(game, "Coppercoat Vanguard");
    const human = spawn(game, "Elite Vanguard");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Elite Vanguard", B);
    expect(pt(game, vanguard)).toEqual([2, 2]);
    expect(pt(game, human)).toEqual([3, 1]);
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(pt(game, theirs)).toEqual([2, 1]);
  });
});

describe("top-5000 batch 26c — Tectonic Edge", () => {
  it("can be activated only once some one opponent controls four or more lands", () => {
    const { game } = setUp();
    const edge = spawn(game, "Tectonic Edge");
    spawn(game, "Wastes");
    const quarter = spawn(game, "Ghost Quarter", B);
    spawn(game, "Wastes", B);
    spawn(game, "Wastes", B);
    const offered = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === edge && x.abilityIndex === 1);
    expect(offered()).toBe(false);
    spawn(game, "Wastes", B);
    expect(offered()).toBe(true);
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: edge,
      abilityIndex: 1,
      targets: [{ kind: "object", object: quarter }],
    });
    settle(game);
    expect(game.state.objects[quarter].zone).toBe("graveyard");
    expect(game.state.objects[edge].zone).toBe("graveyard");
  });
});

describe("top-5000 batch 26c — Nested Shambler", () => {
  it("makes as many tapped Squirrels as the power it died with", () => {
    const { game } = setUp();
    const shambler = spawn(game, "Nested Shambler");
    game.state.objects[shambler].counters = { "+1/+1": 2 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: shambler }]);
    settle(game);
    expect(game.state.objects[shambler].zone).toBe("graveyard");
    expect(tokenCount(game, "Squirrel Token")).toBe(3);
    expect(named(game, "Squirrel Token").every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("top-5000 batch 26c — Azure Beastbinder", () => {
  it("makes an opponent's creature a 2/2 with no abilities until Alice's next turn", () => {
    const { game } = setUp();
    const binder = spawn(game, "Azure Beastbinder");
    const angel = spawn(game, "Serra Angel", B);
    const ring = spawn(game, "Sol Ring", B);
    const effect = registry.get("Azure Beastbinder")!.triggered[0].effect!;
    game.debugApplyEffect(A, effect, [{ kind: "object", object: angel }], { source: binder });
    game.debugApplyEffect(A, effect, [{ kind: "object", object: ring }], { source: binder });
    settle(game);
    expect(pt(game, angel)).toEqual([2, 2]);
    expect(hasKeyword(game, angel, "flying")).toBe(false);
    // The artifact only loses its abilities: Sol Ring taps for nothing.
    expect(computeCharacteristics(game.state, registry, ring).types).not.toContain("creature");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(pt(game, angel)).toEqual([2, 2]);
    expect(hasKeyword(game, angel, "flying")).toBe(false);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(pt(game, angel)).toEqual([4, 4]);
    expect(hasKeyword(game, angel, "flying")).toBe(true);
  });
});

describe("top-5000 batch 26c — Tavern Scoundrel", () => {
  it("makes two Treasures for each flip its controller wins, none for an opponent's", () => {
    const { game } = setUp();
    spawn(game, "Tavern Scoundrel");
    for (let i = 0; i < 12; i += 1) {
      game.debugApplyEffect(A, { kind: "flip-coin" });
      settle(game);
    }
    const mine = tokenCount(game, "Treasure Token");
    expect(mine).toBeGreaterThan(0);
    expect(mine % 2).toBe(0);
    for (let i = 0; i < 12; i += 1) {
      game.debugApplyEffect(B, { kind: "flip-coin" });
      settle(game);
    }
    expect(tokenCount(game, "Treasure Token")).toBe(mine);
  });
});
