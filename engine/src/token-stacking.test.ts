import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

// A pure engine resource-safety optimization (not a rule): a self-replicating
// token generator (Scute Swarm) is compacted into one `stackCount`-carrying
// GameObject instead of one real object per copy, so a long game with many
// land drops doesn't blow up in object count / CPU. Every individual
// interaction (targeting, combat, sacrifice) must still behave exactly as if
// the tokens were never compacted.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[] = [], land = "Forest") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill(land)] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each]?.cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const scuteStackOf = (game: Game): ObjectId | undefined =>
  game.battlefield.find(
    (id) => game.state.objects[id].cardName === "Scute Swarm" && game.state.objects[id].isToken,
  );

/** Grow a Scute Swarm stack by repeatedly playing lands (6+ already out) from
 * hand — `play-land` (unlike `debugSpawn`) fires the landfall event. Returns
 * the id of the resulting stack/token. */
const growStack = (game: Game, drops: number): ObjectId => {
  game.advanceUntil(toPrecombat);
  for (let i = 0; i < 5; i += 1) game.debugSpawn("Forest", A, "battlefield");
  game.debugSpawn("Scute Swarm", A, "battlefield");
  for (let i = 0; i < drops; i += 1) {
    const forest = named(game, game.handOf(A), "Forest");
    game.dispatch({ type: "play-land", player: A, card: forest });
    game.advanceUntil(quiet);
  }
  const stack = scuteStackOf(game);
  if (stack === undefined) throw new Error("no Scute Swarm copy formed");
  return stack;
};

describe("token stacking — object count stays bounded", () => {
  it("compacts repeated landfall copies into one growing stackCount instead of many objects", () => {
    const { game } = mkGame(Array(6).fill("Forest"));
    const before = game.battlefield.length;
    const stack = growStack(game, 5);

    // The token count still doubles-ish each drop after the first — real
    // Scute Swarm behaviour (1 -> 3 -> 7 -> 15 -> 31) — but it's all one
    // object.
    expect(game.state.objects[stack].stackCount).toBe(31);
    // Object count grew by a small, bounded amount — 5 new land objects plus
    // a couple of not-yet-merged early copies, nowhere near the 31 tokens
    // the stack represents.
    expect(game.battlefield.length - before).toBeLessThan(15);
  });

  it("leaves an ordinary small batch (Raise the Alarm) as separate objects", () => {
    const { game } = mkGame(["Raise the Alarm"], "Plains");
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Raise the Alarm"),
    });
    game.advanceUntil(quiet);

    const soldiers = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Soldier Token",
    );
    expect(soldiers).toHaveLength(2);
    expect(game.state.objects[soldiers[0]].stackCount).toBeUndefined();
    expect(game.state.objects[soldiers[1]].stackCount).toBeUndefined();
  });
});

describe("token stacking — individual interactions split correctly", () => {
  it("a forced sacrifice peels one off a stack, leaving the rest", () => {
    const { game, a } = mkGame(["Diabolic Edict"], "Forest");
    const stack = growStack(game, 2); // 6 lands + 2 drops -> stackCount 3
    const before = game.state.objects[stack].stackCount ?? 1;
    expect(before).toBeGreaterThan(1);
    game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Swamp", A, "battlefield");
    // The real (non-token) Scute Swarm is also an eligible sacrifice —
    // force the choice onto the stack specifically to test its split.
    a.chooseSacrificesFn = () => [stack];

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Diabolic Edict"),
      targets: [{ kind: "player", player: A }],
    });
    game.advanceUntil(quiet);

    const remaining = game.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Scute Swarm" && game.state.objects[id].isToken,
    );
    const totalRemaining = remaining.reduce(
      (sum, id) => sum + (game.state.objects[id].stackCount ?? 1),
      0,
    );
    expect(totalRemaining).toBe(before - 1);
  });

  it("attacking with a stack deals damage for every member, not just one", () => {
    const { game, a } = mkGame([], "Forest");
    const stack = growStack(game, 2); // 6 lands + 2 drops -> stackCount 3
    const count = game.state.objects[stack].stackCount ?? 1;
    expect(count).toBeGreaterThan(1);
    // Turn 2 is B's (turns alternate) — advance to turn 3, A's next turn, so
    // the stack's summoning sickness has worn off and it can attack.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");

    const lifeBefore = game.state.players[B].life;
    a.declareAttackersFn = () => [{ attacker: stack, defender: B }];
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "postcombat-main");

    // Each member of the (now-materialized) stack is its own 1/1 attacker.
    expect(game.state.players[B].life).toBe(lifeBefore - count);
  });

  it("a mass effect hits the whole stack uniformly", () => {
    const { game } = mkGame(["Wrath of God", "Forest", "Forest"], "Forest");
    const stack = growStack(game, 2); // 6 lands + 2 drops -> stackCount 3
    expect(game.state.objects[stack].stackCount).toBeGreaterThan(1);
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");
    game.debugSpawn("Plains", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Wrath of God"),
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[stack]).toBeUndefined(); // the whole group died at once
  });
});
