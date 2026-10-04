/**
 * "You may sacrifice [a permanent]. When you do, [effect]": an
 * `each-player-may` whose sacrifice option, once taken, triggers a reflexive
 * ability (rule 603.12) that goes on the stack and chooses its targets then.
 * The option's `exceptSource` is "sacrifice **another** creature" (Ziatora,
 * the Incinerator). Felothar, Dawn of the Abzan's reflexive ability counts
 * the creatures as it resolves.
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    decks: [A, B].map((player) => ({ player, cards: Array<string>(40).fill("Wastes") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

type Awaiting = NonNullable<GameState["awaiting"]>;

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const onBattlefield = (game: Game, id: ObjectId): boolean => game.state.objects[id]?.zone === "battlefield";
const treasures = (game: Game): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === "Treasure Token" && game.state.objects[id].controller === A)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const plusOnes = (game: Game, id: ObjectId): number => game.state.objects[id].counters["+1/+1"] ?? 0;

/** Answers: the "may" with `sacrifice` (or decline with null), the
 * sacrifice with it, and a reflexive ability's target with `target`. Records
 * what each decision offered. */
const answerer = (game: Game, sacrifice: ObjectId | null, target: PlayerId = B) => {
  const seen: { sacrificeChoices?: readonly ObjectId[]; asked: number } = { asked: 0 };
  const answer = (awaiting: Awaiting): void => {
    if (awaiting.kind === "choose-modes") {
      seen.asked += 1;
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: sacrifice === null ? [] : [0] });
      return;
    }
    if (awaiting.kind === "sacrifice") {
      seen.sacrificeChoices = awaiting.eligible;
      game.dispatch({ type: "sacrifice", player: awaiting.player, permanents: [sacrifice!] });
      return;
    }
    if (awaiting.kind === "attackers") {
      game.dispatch({ type: "declare-attackers", player: awaiting.player, attackers: [] });
      return;
    }
    if (awaiting.kind === "choose-targets") {
      game.dispatch({ type: "choose-targets", player: awaiting.player, targets: [{ kind: "player", player: target }] });
      return;
    }
    throw new Error(`unexpected ${awaiting.kind} decision`);
  };
  return { seen, answer };
};

/** Pass priority until `until` holds, answering decisions on the way. */
const runUntil = (game: Game, until: (s: GameState) => boolean, answer: (a: Awaiting) => void): void => {
  for (let i = 0; i < 400; i += 1) {
    if (game.state.awaiting !== null) {
      answer(game.state.awaiting);
      continue;
    }
    if (until(game.state)) return;
    const holder = game.state.priority.holder;
    if (holder === null) throw new Error("nobody holds priority");
    game.dispatch({ type: "pass-priority", player: holder });
  }
  throw new Error("never got there");
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** Into the end step, then until its triggers have all resolved. */
const throughEndStep = (game: Game, answer: (a: Awaiting) => void): void => {
  runUntil(game, (s) => s.turn.step === "end", answer);
  runUntil(game, (s) => s.turn.step === "end" && quiet(s) && s.eventLog.some((e) => e.type === "step-began" && e.step === "end"), answer);
};

describe("Ziatora, the Incinerator", () => {
  it("sacrifices another creature, then deals its power to a target chosen as the reflexive ability goes on the stack and makes three Treasures", () => {
    const game = setUp();
    const ziatora = spawn(game, "Ziatora, the Incinerator");
    const giant = spawn(game, "Hill Giant");
    const { seen, answer } = answerer(game, giant);
    throughEndStep(game, answer);
    expect(onBattlefield(game, giant)).toBe(false);
    expect(onBattlefield(game, ziatora)).toBe(true);
    expect(game.state.players[B].life).toBe(17);
    expect(treasures(game)).toBe(3);
    // "Another creature": Ziatora is never one of the choices.
    expect(seen.sacrificeChoices ?? [giant]).not.toContain(ziatora);
  });

  it("asks nothing when it is the only creature you control", () => {
    const game = setUp();
    spawn(game, "Ziatora, the Incinerator");
    const { seen, answer } = answerer(game, null);
    throughEndStep(game, answer);
    expect(seen.asked).toBe(0);
    expect(game.state.players[B].life).toBe(20);
    expect(treasures(game)).toBe(0);
  });

  it("does nothing when you decline", () => {
    const game = setUp();
    spawn(game, "Ziatora, the Incinerator");
    const giant = spawn(game, "Hill Giant");
    const { seen, answer } = answerer(game, null);
    throughEndStep(game, answer);
    expect(seen.asked).toBe(1);
    expect(onBattlefield(game, giant)).toBe(true);
    expect(game.state.players[B].life).toBe(20);
    expect(treasures(game)).toBe(0);
  });

  it("deals the power the creature had as it last existed on the battlefield", () => {
    const game = setUp();
    spawn(game, "Ziatora, the Incinerator");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters["+1/+1"] = 3;
    const { answer } = answerer(game, bears);
    throughEndStep(game, answer);
    expect(game.state.players[B].life).toBe(15);
  });
});

describe("Felothar, Dawn of the Abzan", () => {
  it("as it enters, sacrificing a nonland permanent puts a +1/+1 counter on each creature you control", () => {
    const game = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const opposing = spawn(game, "Grizzly Bears", B);
    const ring = spawn(game, "Sol Ring");
    for (let i = 0; i < 3; i += 1) spawn(game, "Plains");
    const card = game.debugSpawn("Felothar, Dawn of the Abzan", A, "hand");
    // {W}{B}{G} paid by a hand-free debug: put the mana in the pool.
    game.state.players[A].manaPool = [
      { type: "W" },
      { type: "B" },
      { type: "G" },
    ] as unknown as GameState["players"][PlayerId]["manaPool"];
    const { seen, answer } = answerer(game, ring);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    runUntil(game, quiet, answer);
    const felothar = game.battlefield.find((id) => game.state.objects[id].cardName === "Felothar, Dawn of the Abzan")!;
    expect(onBattlefield(game, ring)).toBe(false);
    expect(plusOnes(game, bears)).toBe(1);
    expect(plusOnes(game, felothar)).toBe(1);
    expect(plusOnes(game, opposing)).toBe(0);
    // Lands can't be sacrificed to it.
    for (const id of seen.sacrificeChoices ?? []) expect(game.characteristics(id).types).not.toContain("land");
  });
});
