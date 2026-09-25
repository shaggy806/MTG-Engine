/**
 * "You gain that much life" / "life equal to the life lost this way" is the
 * life actually lost during the resolution (the `lifeLostThisWay` amount):
 * extort, Gray Merchant of Asphodel, Exsanguinate.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { lifeLostSince } from "../this-way.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B), [C]: new ScriptedController(C) },
    decks: [A, B, C].map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const life = (game: Game, p: PlayerId) => game.state.players[p].life;

describe("extort", () => {
  it("drains each opponent and gains the life they lost (Crypt Ghast, three players)", () => {
    const { game, a } = setUp();
    spawn(game, "Crypt Ghast");
    spawn(game, "Island");
    spawn(game, "Plains");
    a.chooseModesFn = () => [0];
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand"), targets: [] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(19);
    expect(life(game, C)).toBe(19);
    expect(life(game, A)).toBe(22);
  });

  it("each extort trigger gains only what its own drain took (Crypt Ghast and Blind Obedience)", () => {
    const { game, a } = setUp();
    spawn(game, "Crypt Ghast");
    spawn(game, "Blind Obedience");
    spawn(game, "Island");
    spawn(game, "Plains");
    spawn(game, "Plains");
    a.chooseModesFn = () => [0];
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Opt", A, "hand"), targets: [] });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    expect(life(game, C)).toBe(18);
    expect(life(game, A)).toBe(24);
  });

  it("counts the life actually lost, not the opponents", () => {
    const { game } = setUp();
    const since = game.state.eventSeq;
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, target: 0 }, [{ kind: "player", player: B }]);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 5 }, []);
    game.debugApplyEffect(A, { kind: "lose-life", amount: 2, target: 0 }, [{ kind: "player", player: A }]);
    expect(lifeLostSince(game.state, since, [B, C])).toBe(3);
    expect(lifeLostSince(game.state, since)).toBe(5);
  });
});

describe("Crypt Ghast", () => {
  it("a Swamp tapped for mana adds an additional {B}", () => {
    const { game } = setUp();
    spawn(game, "Crypt Ghast");
    const swamp = spawn(game, "Swamp");
    game.dispatch({ type: "activate-ability", player: A, source: swamp, abilityIndex: 0, targets: [] });
    expect(poolCounts(game.state.players[A].manaPool).B).toBe(2);
  });
});

describe("Blind Obedience", () => {
  it("opponents' artifacts and creatures enter tapped; their lands and yours don't", () => {
    const { game } = setUp();
    spawn(game, "Blind Obedience");
    expect(game.state.objects[spawn(game, "Grizzly Bears", B)].tapped).toBe(true);
    expect(game.state.objects[spawn(game, "Sol Ring", C)].tapped).toBe(true);
    expect(game.state.objects[spawn(game, "Forest", B)].tapped).toBe(false);
    expect(game.state.objects[spawn(game, "Grizzly Bears", A)].tapped).toBe(false);
  });
});

describe("Gray Merchant of Asphodel", () => {
  it("gains the life its drain took", () => {
    const { game } = setUp();
    spawn(game, "Swamp");
    game.debugSpawn("Gray Merchant of Asphodel", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    // Devotion 2: each of two opponents loses 2.
    expect(life(game, B)).toBe(18);
    expect(life(game, C)).toBe(18);
    expect(life(game, A)).toBe(24);
  });
});
