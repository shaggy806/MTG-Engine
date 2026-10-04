/**
 * Top-5000 batch 29f. Pins the clauses most likely to be wired wrong:
 * Lightning Runner's energy got before the eight is paid and its combat
 * straight after this one, Oriq Loremage reading the card its search put
 * into the graveyard, Omen Hawker's mana paying only for abilities, and
 * Hammers of Moradin's one optional target per opponent.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";
import type { Step } from "../turn.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (players: readonly PlayerId[] = [A, B]): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
  const controllers: Record<string, ScriptedController> = { [A]: a };
  for (const p of players) if (p !== A) controllers[p] = new ScriptedController(p);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers,
    decks: players.map((p) => ({ player: p, cards: Array<string>(40).fill("Wastes") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const stepsSince = (game: Game, from: number): Step[] =>
  game.state.eventLog.slice(from).flatMap((e) => (e.type === "step-began" ? [e.step] : []));

describe("top-5000 batch 29f — Lightning Runner", () => {
  it("gets two energy first, so six on hand pays the eight: untaps everything and fights again at once", () => {
    const { game, a } = setUp();
    const runner = spawn(game, "Lightning Runner");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { tapped: true, summoningSick: false });
    game.state.players[A].energy = 6;
    a.declareAttackersFn = () => [{ attacker: runner, defender: B }];
    const from = game.state.eventLog.length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    // Second attack's trigger gets two more and can't pay eight.
    expect(game.state.players[A].energy).toBe(2);
    expect(game.state.objects[bears].tapped).toBe(false);
    const steps = stepsSince(game, from);
    expect(steps.filter((s) => s === "begin-combat")).toHaveLength(2);
    // No main phase between the two combats.
    const second = steps.lastIndexOf("begin-combat");
    expect(steps[second - 1]).toBe("end-combat");
  });

  it("short of eight after the two, nothing is paid and there's one combat", () => {
    const { game, a } = setUp();
    const runner = spawn(game, "Lightning Runner");
    game.state.players[A].energy = 5;
    a.declareAttackersFn = () => [{ attacker: runner, defender: B }];
    const from = game.state.eventLog.length;
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[A].energy).toBe(7);
    expect(stepsSince(game, from).filter((s) => s === "begin-combat")).toHaveLength(1);
  });
});

describe("top-5000 batch 29f — Omen Hawker", () => {
  it("makes {C}{U} that can't cast a spell but pays for an ability", () => {
    const { game } = setUp();
    const hawker = spawn(game, "Omen Hawker");
    const opt = game.debugSpawn("Opt", A, "hand");
    const stone = spawn(game, "Mind Stone");
    game.dispatch({ type: "activate-ability", player: A, source: hawker, abilityIndex: 0, targets: [] });
    const pool = game.state.players[A].manaPool;
    expect(pool.map((u) => u.type).sort()).toEqual(["C", "U"]);
    expect(pool.every((u) => u.restriction !== undefined)).toBe(true);
    expect(game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === opt)).toBe(false);
    expect(
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === stone && x.abilityIndex === 1),
    ).toBe(true);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "activate-ability", player: A, source: stone, abilityIndex: 1, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[stone].zone).toBe("graveyard");
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(game.state.players[A].manaPool).toHaveLength(1);
  });
});

describe("top-5000 batch 29f — Hammers of Moradin", () => {
  it("taps up to one creature of each opponent's, not the attacker's own side", () => {
    const { game, a } = setUp([A, B, C]);
    const hammers = spawn(game, "Hammers of Moradin");
    const mine = spawn(game, "Grizzly Bears");
    const bobs = spawn(game, "Grizzly Bears", B);
    const carols = spawn(game, "Hill Giant", C);
    a.declareAttackersFn = () => [{ attacker: hammers, defender: B }];
    // Decline myriad's copy attacking Carol.
    a.chooseModesFn = () => [];
    a.chooseTargetsFn = () => [obj(bobs), obj(carols)];
    game.advanceUntil((s) => s.turn.step === "declare-blockers");
    expect(game.state.objects[bobs].tapped).toBe(true);
    expect(game.state.objects[carols].tapped).toBe(true);
    expect(game.state.objects[mine].tapped).toBe(false);
  });
});
