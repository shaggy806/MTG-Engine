/**
 * Top-10000 batch 35b. Pins the clauses most likely to be wired wrong:
 * Raucous Audience's conditional amount, Dark Fortress's "entered this turn
 * or a basic land" gate, Brokers Charm's pump-then-bite, Solidarity of
 * Heroes' per-target doubling and Geosurge's restricted seven.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game } => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game };
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const canActivate = (game: Game, source: ObjectId, abilityIndex: number): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === abilityIndex);

describe("top-10000 batch 35b — Raucous Audience", () => {
  it("adds {G}, or {G}{G} with a creature of power 4 or greater", () => {
    const { game } = setUp();
    const audience = spawn(game, "Raucous Audience");
    game.dispatch({ type: "activate-ability", player: A, source: audience, abilityIndex: 0 });
    expect(pool(game)).toEqual(["G"]);

    const { game: g2 } = setUp();
    const audience2 = spawn(g2, "Raucous Audience");
    spawn(g2, "Hill Giant");
    expect(pool(g2)).toEqual([]);
    g2.dispatch({ type: "activate-ability", player: A, source: audience2, abilityIndex: 0 });
    // Hill Giant is 3/3: still one.
    expect(pool(g2)).toEqual(["G"]);

    const { game: g3 } = setUp();
    const audience3 = spawn(g3, "Raucous Audience");
    spawn(g3, "Craw Wurm");
    g3.dispatch({ type: "activate-ability", player: A, source: audience3, abilityIndex: 0 });
    expect(pool(g3)).toEqual(["G", "G"]);
  });
});

describe("top-10000 batch 35b — Dark Fortress", () => {
  it("makes {B} or {R} only the turn it entered, or with a basic land", () => {
    const { game } = setUp();
    const fortress = spawn(game, "Dark Fortress");
    expect(canActivate(game, fortress, 1)).toBe(true);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    expect(canActivate(game, fortress, 0)).toBe(true);
    expect(canActivate(game, fortress, 1)).toBe(false);
    spawn(game, "Swamp");
    expect(canActivate(game, fortress, 1)).toBe(true);
  });
});

describe("top-10000 batch 35b — Brokers Charm", () => {
  it("pumps your creature +1/+0, then it deals damage equal to its new power", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    const mode = registry.get("Brokers Charm")!.castModal!.modes[0];
    game.debugApplyEffect(A, mode.effect as EffectSpec, [
      { kind: "object", object: bears },
      { kind: "object", object: giant },
    ]);
    expect(game.state.objects[giant].damageMarked).toBe(3);
    expect(game.state.objects[bears].damageMarked).toBe(0);
  });
});

describe("top-10000 batch 35b — Solidarity of Heroes", () => {
  it("doubles the +1/+1 counters on each target", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 }, [
      { kind: "object", object: bears },
    ]);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 3 }, [
      { kind: "object", object: giant },
    ]);
    game.debugApplyEffect(A, registry.get("Solidarity of Heroes")!.effect!, [
      { kind: "object", object: bears },
      { kind: "object", object: giant },
    ]);
    expect(counters(game, bears)).toBe(4);
    expect(counters(game, giant)).toBe(6);
  });
});

describe("top-10000 batch 35b — Geosurge", () => {
  it("adds seven red mana", () => {
    const { game } = setUp();
    game.debugApplyEffect(A, registry.get("Geosurge")!.effect!, []);
    expect(pool(game)).toEqual(Array<string>(7).fill("R"));
  });
});
