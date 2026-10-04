/**
 * Top-5000 batch 24d. No engine change: every card is existing vocabulary.
 * These pin the clause of each most likely to be wired wrong — Spellstutter
 * Sprite's X read off the Faeries you control, Edgar's return transformed and
 * the Coffin's third counter, Summon: Ixion's O-Ring chapter and optional
 * targets, Sozin's Comet's granted firebending, Gonti's Aether Heart's energy,
 * and Crossway Troublemakers' paid draw.
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
const obj = (object: ObjectId) => ({ kind: "object" as const, object });

describe("top-5000 batch 24d — Spellstutter Sprite", () => {
  const castBoth = (faeries: number): { game: Game; before: number } => {
    const { game } = setUp(["Divination", "Spellstutter Sprite"], "Island");
    lands(game, "Island", 5);
    for (let i = 0; i < faeries; i += 1) spawn(game, "Spellstutter Sprite");
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Divination"), targets: [] });
    // Flash: cast it in response, so its trigger sees Divination on the stack.
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Spellstutter Sprite"), targets: [] });
    settle(game);
    return { game, before };
  };

  it("can't counter a mana value 3 spell with only itself as a Faerie", () => {
    const { game, before } = castBoth(0);
    // Both cards left the hand, and Divination resolved for two.
    expect(game.handOf(A).length).toBe(before);
  });

  it("counters it once three Faeries are counted", () => {
    const { game, before } = castBoth(2);
    expect(game.handOf(A).length).toBe(before - 2);
    expect(game.eventsOfType("spell-countered").length).toBeGreaterThan(0);
  });
});

describe("top-5000 batch 24d — Edgar, Charmed Groom // Edgar Markov's Coffin", () => {
  it("returns transformed as it dies, and the Coffin flips back on its third counter", () => {
    const { game } = setUp();
    const edgar = spawn(game, "Edgar, Charmed Groom");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(edgar)], { source: edgar });
    settle(game);
    expect(zone(game, edgar)).toBe("battlefield");
    expect(game.state.objects[edgar].face).toBe(1);
    const upkeep = registry.get("Edgar Markov's Coffin")!.triggered[0].effect!;
    for (let i = 1; i <= 3; i += 1) {
      game.debugApplyEffect(A, upkeep, [], { source: edgar });
      settle(game);
      if (i < 3) {
        expect(counters(game, edgar, "bloodline")).toBe(i);
        expect(game.state.objects[edgar].face).toBe(1);
      }
    }
    expect(counters(game, edgar, "bloodline")).toBe(0);
    expect(game.state.objects[edgar].face ?? 0).toBe(0);
    const vampires = named(game, "Vampire Token (Edgar, Charmed Groom // Edgar Markov's Coffin)");
    const count = vampires.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(count).toBe(3);
    // Edgar is back: the other Vampires get +1/+1, Edgar himself doesn't.
    const token = computeCharacteristics(game.state, registry, vampires[0]);
    expect([token.power, token.toughness]).toEqual([2, 2]);
    const self = computeCharacteristics(game.state, registry, edgar);
    expect([self.power, self.toughness]).toEqual([4, 4]);
  });
});

describe("top-5000 batch 24d — Summon: Ixion", () => {
  it("exiles until the Saga leaves, and its later chapters gain life with no targets chosen", () => {
    const { game } = setUp();
    const ixion = spawn(game, "Summon: Ixion");
    const bears = spawn(game, "Grizzly Bears", B);
    const [chapterI, chapterII] = registry.get("Summon: Ixion")!.chapters;
    game.debugApplyEffect(A, chapterI.effect!, [obj(bears)], { source: ixion });
    settle(game);
    expect(named(game, "Grizzly Bears")).toHaveLength(0);
    game.debugApplyEffect(A, chapterII.effect!, [], { source: ixion });
    settle(game);
    expect(life(game, A)).toBe(22);
    const mine = spawn(game, "Hill Giant");
    game.debugApplyEffect(A, chapterII.effect!, [obj(mine)], { source: ixion });
    settle(game);
    expect(counters(game, mine)).toBe(1);
    expect(life(game, A)).toBe(24);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(ixion)], { source: ixion });
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].controller).toBe(B);
  });
});

describe("top-5000 batch 24d — Sozin's Comet", () => {
  it("gives each creature you control firebending 5 for the turn", () => {
    const { game, a } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, effectOf("Sozin's Comet"), []);
    settle(game);
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    game.advanceUntil(
      (s) =>
        s.turn.step === "declare-attackers" &&
        s.awaiting === null &&
        s.zones.shared.stack.length === 0 &&
        s.pendingTriggers.length === 0 &&
        game.eventsOfType("ability-resolved").length > 0,
    );
    expect(game.state.players[A].manaPool.filter((unit) => unit.type === "R")).toHaveLength(5);
  });
});

describe("top-5000 batch 24d — Gonti's Aether Heart", () => {
  it("gets two energy for itself and each other artifact, and spends eight for an extra turn", () => {
    const { game } = setUp();
    const heart = game.debugSpawn("Gonti's Aether Heart", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.players[A].energy).toBe(2);
    game.debugSpawn("Sol Ring", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.players[A].energy).toBe(4);
    spawn(game, "Grizzly Bears");
    expect(game.state.players[A].energy).toBe(4);
    const canActivate = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === heart && x.abilityIndex === 0);
    expect(canActivate()).toBe(false);
    game.state.players[A].energy = 8;
    expect(canActivate()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: heart, abilityIndex: 0 });
    settle(game);
    expect(zone(game, heart)).toBe("exile");
    expect(game.state.players[A].energy).toBe(0);
    expect(game.eventsOfType("extra-turn-queued").some((e) => e.player === A)).toBe(true);
  });
});

describe("top-5000 batch 24d — Crossway Troublemakers", () => {
  it("pays 2 life to draw when a Vampire you control dies, and not for another creature", () => {
    const { game } = setUp();
    spawn(game, "Crossway Troublemakers");
    const vampire = spawn(game, "Lifelink Vampire Token");
    const bears = spawn(game, "Grizzly Bears");
    const handBefore = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(vampire)]);
    settle(game);
    expect(life(game, A)).toBe(18);
    expect(game.handOf(A).length).toBe(handBefore + 1);
    // A non-Vampire dying asks nothing.
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    settle(game);
    expect(life(game, A)).toBe(18);
    expect(game.handOf(A).length).toBe(handBefore + 1);
  });
});
