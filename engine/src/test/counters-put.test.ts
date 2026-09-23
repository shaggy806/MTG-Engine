/**
 * The `counters-put` trigger — "whenever one or more counters are put on …"
 * — and the two commanders built on it.
 *
 * Rule 122.6 counts counters a permanent *enters with* as put on it, so a
 * Kalonian Hydra arriving with four +1/+1 counters is four for Shalai and
 * Hallar. The trigger fires once per permanent per event with the amount as
 * its value, narrows by counter kind and by whose permanent it is, and
 * `byYou` asks who put them.
 *
 * Shalai and Hallar: +1/+1 counters on a creature you control deal that
 * much to target opponent; not an opponent's creature, not -1/-1 counters.
 * Hapatra, Vizier of Poisons: a Snake per creature you put -1/-1 counters on
 * (two at once is two Snakes), but not for counters an opponent put; and its
 * combat trigger is a "may".
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Forest")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const counters = (game: Game, by: PlayerId, on: readonly ObjectId[], kind: string, amount: number): void => {
  for (const id of on) {
    game.debugApplyEffect(by, { kind: "add-counter", target: 0, counter: kind, amount }, [
      { kind: "object", object: id },
    ]);
  }
  game.advanceUntil(quiet);
};
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const snakes = (game: Game): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === "Deathtouch Snake Token")
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

describe("Shalai and Hallar", () => {
  it("deals as much damage as +1/+1 counters put on a creature you control", () => {
    const { game } = setUp();
    game.debugSpawn("Shalai and Hallar", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    counters(game, A, [bears], "+1/+1", 3);
    expect(life(game, B)).toBe(17);
  });

  it("ignores an opponent's creature, -1/-1 counters, and noncreature permanents", () => {
    const { game } = setUp();
    game.debugSpawn("Shalai and Hallar", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", A, "battlefield");
    counters(game, A, [theirs], "+1/+1", 2);
    counters(game, A, [mine], "-1/-1", 1);
    counters(game, A, [ring], "+1/+1", 1);
    expect(life(game, B)).toBe(20);
  });

  it("counts the counters a creature enters with (rule 122.6)", () => {
    const { game } = setUp(["Kalonian Hydra"]);
    game.debugSpawn("Shalai and Hallar", A, "battlefield");
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const hydra = game.handOf(A).find((id) => game.state.objects[id].cardName === "Kalonian Hydra");
    if (hydra === undefined) throw new Error("no Hydra");
    game.dispatch({ type: "cast-spell", player: A, card: hydra });
    game.advanceUntil(quiet);
    expect(game.state.objects[hydra].counters["+1/+1"]).toBe(4);
    expect(life(game, B)).toBe(16);
  });
});

describe("Hapatra, Vizier of Poisons", () => {
  it("makes a Snake for each creature you put -1/-1 counters on", () => {
    const { game } = setUp();
    game.debugSpawn("Hapatra, Vizier of Poisons", A, "battlefield");
    const one = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const two = game.debugSpawn("Grizzly Bears", B, "battlefield");
    // Put at once, by one effect: once per creature.
    game.debugApplyEffect(A, {
      kind: "add-counter-all",
      filter: { type: "creature", controlledBy: "opponent" },
      counter: "-1/-1",
      amount: 1,
    });
    game.advanceUntil(quiet);
    expect(snakes(game)).toBe(2);
    expect(game.state.objects[one].counters["-1/-1"]).toBe(1);
    expect(game.state.objects[two].counters["-1/-1"]).toBe(1);
    const c = game.characteristics(
      game.battlefield.find((id) => game.state.objects[id].cardName === "Deathtouch Snake Token") as ObjectId,
    );
    expect([c.power, c.toughness]).toEqual([1, 1]);
    expect(c.keywords.has("deathtouch")).toBe(true);
  });

  it("not for counters an opponent put, and not for +1/+1 counters", () => {
    const { game } = setUp();
    const hapatra = game.debugSpawn("Hapatra, Vizier of Poisons", A, "battlefield");
    const mine = game.debugSpawn("Grizzly Bears", A, "battlefield");
    counters(game, B, [mine, hapatra], "-1/-1", 1);
    counters(game, A, [mine], "+1/+1", 1);
    expect(snakes(game)).toBe(0);
  });

  it("may put a -1/-1 counter on a creature when it deals combat damage, which makes a Snake", () => {
    const { game, a } = setUp();
    const hapatra = game.debugSpawn("Hapatra, Vizier of Poisons", A, "battlefield", { summoningSick: false });
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: hapatra, defender: B }];
    a.chooseTargetsFn = () => [{ kind: "object", object: victim }];
    a.chooseModesFn = () => [0];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.objects[victim].counters["-1/-1"]).toBe(1);
    expect(snakes(game)).toBe(1);
  });

  it("declining the may puts no counter and makes no Snake", () => {
    const { game, a } = setUp();
    const hapatra = game.debugSpawn("Hapatra, Vizier of Poisons", A, "battlefield", { summoningSick: false });
    const victim = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: hapatra, defender: B }];
    a.chooseTargetsFn = () => [{ kind: "object", object: victim }];
    a.chooseModesFn = () => [];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.objects[victim].counters["-1/-1"] ?? 0).toBe(0);
    expect(snakes(game)).toBe(0);
  });
});
