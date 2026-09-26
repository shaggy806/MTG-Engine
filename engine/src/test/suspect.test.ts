/**
 * Suspect (rule 701.60): a designation that gives a permanent menace and
 * "This creature can't block" for as long as it has it (701.60c), until it
 * leaves the battlefield or is no longer suspected (701.60a). It isn't an
 * ability or a copiable value (701.60b), can't be given twice (701.60d), and
 * the menace and can't-block it gives are abilities, so an effect that
 * removes all abilities afterwards takes them away without ending the
 * designation (the Nelly Borca, Impulsive Accuser ruling).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const ctl = { [A]: new ScriptedController(A), [B]: new ScriptedController(B) } as Record<PlayerId, ScriptedController>;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: ctl,
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, ctl };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const suspect = (game: Game, id: ObjectId): void => game.debugApplyEffect(A, { kind: "suspect", target: 0 }, [obj(id)]);
const suspected = (game: Game, id: ObjectId, lastKnown = false): boolean =>
  matchesFilter(game.state, registry, id, { suspected: true }, { you: A, lastKnown });
const menace = (game: Game, id: ObjectId): boolean => game.characteristics(id).keywords.has("menace");
const cantBlock = (game: Game, id: ObjectId): boolean => game.characteristics(id).restrictions.has("cant-block");
const FROG: EffectSpec = registry.get("Turn to Frog").effect!;

describe("suspect (rule 701.60)", () => {
  it("gives menace and can't-block, and a suspected creature can't be declared as a blocker", () => {
    const { game, ctl } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    const giant = spawn(game, "Hill Giant", A);
    expect(menace(game, bears)).toBe(false);
    suspect(game, bears);
    expect(suspected(game, bears)).toBe(true);
    expect(menace(game, bears)).toBe(true);
    expect(cantBlock(game, bears)).toBe(true);

    ctl[A].declareAttackersFn = () => [{ attacker: giant, defender: B }];
    game.advanceUntil((s) => (s.awaiting?.kind === "blockers" && s.awaiting.player === B) || s.result.over);
    const offer = game.legalActions(B).find((o) => o.kind === "declare-blockers");
    if (offer?.kind !== "declare-blockers") throw new Error("no block offer");
    const able = offer.eligible.map((e) => e.blocker);
    expect(able).toContain(elves);
    expect(able).not.toContain(bears);
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: B, blocks: [{ blocker: bears, attacker: giant }] }),
    ).toThrow(/can't block/);
  });

  it("a suspected attacker has menace: one blocker isn't enough", () => {
    const { game, ctl } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", A);
    suspect(game, bears);
    ctl[B].declareAttackersFn = () => [{ attacker: bears, defender: A }];
    game.advanceUntil((s) => (s.awaiting?.kind === "blockers" && s.awaiting.player === A) || s.result.over);
    const offer = game.legalActions(A).find((o) => o.kind === "declare-blockers");
    if (offer?.kind !== "declare-blockers") throw new Error("no block offer");
    expect(offer.menaceAttackers).toContain(bears);
    expect(() =>
      game.dispatch({ type: "declare-blockers", player: A, blocks: [{ blocker: elves, attacker: bears }] }),
    ).toThrow();
  });

  it("suspecting it again changes nothing (rule 701.60d)", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    suspect(game, bears);
    const since = game.state.objects[bears].suspectedAt;
    expect(since).toBeDefined();
    suspect(game, bears);
    expect(game.state.objects[bears].suspectedAt).toBe(since);
  });

  it("losing all its abilities afterwards takes menace and can't-block away, but it stays suspected", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    suspect(game, bears);
    game.debugApplyEffect(A, FROG, [obj(bears)]);
    expect(menace(game, bears)).toBe(false);
    expect(cantBlock(game, bears)).toBe(false);
    expect(suspected(game, bears)).toBe(true);
    // Suspecting it again doesn't give them back (701.60d).
    suspect(game, bears);
    expect(menace(game, bears)).toBe(false);
  });

  it("abilities lost before it was suspected don't take them away (rule 613.7)", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, FROG, [obj(bears)]);
    suspect(game, bears);
    expect(menace(game, bears)).toBe(true);
    expect(cantBlock(game, bears)).toBe(true);
  });

  it("ends when it leaves the battlefield", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    suspect(game, bears);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [obj(bears)]);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(suspected(game, bears)).toBe(false);
    expect(menace(game, bears)).toBe(false);
  });

  it("is remembered once it has left: a dead suspect was suspected", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    suspect(game, bears);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bears)]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(suspected(game, bears)).toBe(false);
    expect(suspected(game, bears, true)).toBe(true);
  });

  it("no longer suspected: one, or every one a filter matches", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    const elves = spawn(game, "Llanowar Elves", B);
    const giant = spawn(game, "Hill Giant", A);
    for (const id of [bears, elves, giant]) suspect(game, id);
    game.debugApplyEffect(A, { kind: "unsuspect", target: 0 }, [obj(bears)]);
    expect(suspected(game, bears)).toBe(false);
    expect(menace(game, bears)).toBe(false);
    expect(suspected(game, elves)).toBe(true);
    game.debugApplyEffect(A, { kind: "unsuspect", filter: { suspected: true } });
    expect(suspected(game, elves)).toBe(false);
    expect(suspected(game, giant)).toBe(false);
  });

  it("isn't copiable (rule 701.60b): a token copy of a suspect isn't suspected", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears", B);
    suspect(game, bears);
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1, who: "you" }, [obj(bears)]);
    const copy = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].isToken && game.state.objects[id].copyOf === "Grizzly Bears",
    );
    expect(copy).toBeDefined();
    expect(suspected(game, copy!)).toBe(false);
    expect(menace(game, copy!)).toBe(false);
  });
});
