/**
 * Activations in a batch: v2 weighs "activate this as many times as the mana
 * allows" as one candidate and, having chosen it, puts the rest on the stack
 * without searching again. One activation at a time, Lathliss, Dragon Queen's
 * "{1}{R}: Dragons you control get +1/+0" on a pile of Treasures was a dozen
 * full searches a turn — one bench game ran past its time limit.
 */

import { describe, expect, it } from "vitest";

import { EvalBotController } from "../bot/eval-bot.js";
import { simulateRepeated } from "../bot/simulate.js";
import { createDefaultRegistry } from "../cards.js";
import { AutomaticController } from "../controller.js";
import type { ControllerView } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Alice's first main phase: Lathliss and eight untapped Mountains, no land
 * drop, and Bob with nothing to block. */
function setup(bot: EvalBotController): { game: Game; lathliss: ObjectId } {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    // No land drop, so the hand's Mountains are nothing to do.
    rules: { skipFirstDraw: true, maxHandSize: 99, maxLandsPerTurn: 0 },
    controllers: { [A]: bot, [B]: new AutomaticController(B) },
    decks: [
      { player: A, cards: Array(40).fill("Mountain") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const lathliss = game.debugSpawn("Lathliss, Dragon Queen", A, "battlefield", {
    summoningSick: false,
  });
  for (let i = 0; i < 8; i += 1) game.debugSpawn("Mountain", A, "battlefield");
  return { game, lathliss };
}

const viewOf = (game: Game): ControllerView => ({
  state: game.state,
  player: A,
  legalActions: () => game.legalActions(A),
});

describe("a batch of activations", () => {
  it("is simulated as the same activation for as long as the mana lasts", () => {
    const { game, lathliss } = setup(new EvalBotController(A, registry));
    const result = simulateRepeated(
      game.state,
      registry,
      { type: "activate-ability", player: A, source: lathliss, abilityIndex: 0 },
      "stack",
      "passive",
      undefined,
      20,
    );
    expect(result?.times).toBe(4);
  });

  it("is chosen once and played out without searching again", () => {
    const bot = new EvalBotController(A, registry, { horizon: "turn" });
    const { game, lathliss } = setup(bot);
    const activations: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const action = bot.act(viewOf(game));
      if (action.type !== "activate-ability" || action.source !== lathliss) break;
      activations.push(bot.lastDecision?.simulations ?? 0);
      game.dispatch(action);
    }
    // All four the mana pays for, and only the first one searched.
    expect(activations).toHaveLength(4);
    expect(activations[0]).toBeGreaterThan(0);
    expect(activations.slice(1)).toEqual([0, 0, 0]);

    // Then "resolve all": each window while they resolve is a pass the
    // search already scored — none is searched again, though there's now
    // something else to do (the Pyromancer's ping would be a candidate).
    game.debugSpawn("Prodigal Pyromancer", A, "battlefield", { summoningSick: false });
    const resolving: string[] = [];
    while (game.state.zones.shared.stack.length > 0) {
      if (game.state.priority.holder !== A) {
        game.dispatch({ type: "pass-priority", player: B });
        continue;
      }
      const action = bot.act(viewOf(game));
      resolving.push(`${action.type}:${bot.lastDecision?.simulations ?? 0}`);
      game.dispatch(action);
    }
    expect(resolving).toEqual(Array(4).fill("pass-priority:0"));
  });

  it("is watched resolving by an opponent that searched once and passed", () => {
    const bot = new EvalBotController(A, registry, { horizon: "turn" });
    const { game } = setup(bot);
    const watcher = new EvalBotController(B, registry, { horizon: "turn" });
    // Something Bob could do at every window but never wants to: Giant
    // Growth on his own Bears in Alice's main phase. (Not on Alice's
    // creature — help for an opponent's creature at home is never a
    // candidate, `opponentPump`.)
    game.debugSpawn("Forest", B, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    game.debugSpawn("Giant Growth", B, "hand");
    const bobsSearches: number[] = [];
    let steps = 0;
    do {
      steps += 1;
      const player = game.state.priority.holder;
      const controller = player === A ? bot : watcher;
      const action = controller.act({
        state: game.state,
        player,
        legalActions: () => game.legalActions(player),
      });
      if (player === B) bobsSearches.push(controller.lastDecision?.simulations ?? 0);
      game.dispatch(action);
    } while (game.state.zones.shared.stack.length > 0 && steps < 40);
    // One window searched, with the whole batch on the stack; then held.
    expect(bobsSearches[0]).toBeGreaterThan(0);
    expect(bobsSearches.slice(1)).toEqual([0, 0, 0]);
  });

  it("re-aims each activation when the last one's target is gone", () => {
    // Scavenging Ooze: "{G}: Exile target card from a graveyard." Each
    // activation takes a different card, so repeating the same action stops
    // after one; re-aimed, it's one search for the lot.
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      startingPlayer: A,
      rules: { skipFirstDraw: true, maxHandSize: 99, maxLandsPerTurn: 0 },
      controllers: { [A]: new AutomaticController(A), [B]: new AutomaticController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Forest") },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    const bot = new EvalBotController(A, registry, { horizon: "turn" });
    game.debugSpawn("Scavenging Ooze", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield");
    const theirs = Array.from({ length: 4 }, () => game.debugSpawn("Grizzly Bears", B, "graveyard"));
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");

    const searched: number[] = [];
    const targets: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const action = bot.act(viewOf(game));
      if (action.type !== "activate-ability") break;
      searched.push(bot.lastDecision?.simulations ?? 0);
      const target = action.targets?.[0];
      targets.push(target?.kind === "object" ? target.object : "?");
      game.dispatch(action);
    }
    expect(searched).toHaveLength(4);
    expect(searched.slice(1)).toEqual([0, 0, 0]);
    expect([...targets].sort()).toEqual([...theirs].sort());
    expect(targets).not.toContain(mine);
  });

  it("passes on its own spell without searching again", () => {
    // Casting was scored as the spell cast and then passed through to
    // resolution, so the window right after it is already decided — even
    // with a ping on offer.
    const bot = new EvalBotController(A, registry, { horizon: "turn" });
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      startingPlayer: A,
      rules: { skipFirstDraw: true, maxHandSize: 99, maxLandsPerTurn: 0 },
      controllers: { [A]: new AutomaticController(A), [B]: new AutomaticController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Mountain") },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Prodigal Pyromancer", A, "battlefield", { summoningSick: false });
    const wurm = game.debugSpawn("Shivan Dragon", A, "hand");
    // Hand Alice's seat to the bot, and stop at her first window with the
    // Dragon on the stack — it may ping first if the search says so.
    const played = Game.fromSnapshot(game.snapshot(), {
      registry,
      controllers: { [A]: bot, [B]: new AutomaticController(B) },
    });
    played.advanceUntil(
      (s) =>
        (s.objects[wurm].zone === "stack" && s.priority.holder === A) || s.turn.number > 1,
    );
    expect(played.state.objects[wurm].zone).toBe("stack");
    const after = bot.act(viewOf(played));
    expect(after.type).toBe("pass-priority");
    expect(bot.lastDecision?.simulations ?? 0).toBe(0);
  });
});
