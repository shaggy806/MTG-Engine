/**
 * An until-end-of-turn pump is only worth its mana where it can matter: in
 * combat, in the bot's own first main phase (setting up an attack), or in
 * answer to something on the stack. On seed 50 v2 spent every land and
 * Treasure in its upkeep on Lathliss, Dragon Queen's "+1/+0 until end of
 * turn" and cast nothing that turn (`effect-worth.ts`,
 * `temporaryEffectCanMatter`).
 */

import { describe, expect, it } from "vitest";

import { EvalBotController } from "../bot/eval-bot.js";
import { createDefaultRegistry } from "../cards.js";
import { AutomaticController, HeuristicBotController } from "../controller.js";
import type { ControllerView } from "../controller.js";
import { onlyUntilEndOfTurn, temporaryEffectCanMatter } from "../effect-worth.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Alice's turn at `step`, with Lathliss and eight untapped Mountains. */
function at(step: GameState["turn"]["step"]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxHandSize: 99, maxLandsPerTurn: 0 },
    controllers: { [A]: new AutomaticController(A), [B]: new AutomaticController(B) },
    decks: [
      { player: A, cards: Array(40).fill("Mountain") },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === step && s.priority.holder === A);
  game.debugSpawn("Lathliss, Dragon Queen", A, "battlefield", { summoningSick: false });
  for (let i = 0; i < 8; i += 1) game.debugSpawn("Mountain", A, "battlefield");
  return game;
}

const viewOf = (game: Game): ControllerView => ({
  state: game.state,
  player: A,
  legalActions: () => game.legalActions(A),
});

const pumps = (game: Game) =>
  game.legalActions(A).filter((l) => l.kind === "activate-ability" && l.cardName === "Lathliss, Dragon Queen");

describe("until-end-of-turn pumps", () => {
  it("are read off the effect: a pump or a keyword grant, not a draw", () => {
    const lathliss = registry.get("Lathliss, Dragon Queen").activated?.[0];
    expect(onlyUntilEndOfTurn(lathliss?.effect)).toBe(true);
    expect(onlyUntilEndOfTurn(registry.get("Giant Growth").effect)).toBe(true);
    expect(onlyUntilEndOfTurn(registry.get("Divination").effect)).toBe(false);
  });

  it("are left alone in the upkeep, by v2 and v1", () => {
    const game = at("upkeep");
    expect(pumps(game)).not.toHaveLength(0);
    expect(temporaryEffectCanMatter(game.state, A)).toBe(false);
    expect(new EvalBotController(A, registry).act(viewOf(game)).type).toBe("pass-priority");
    expect(new HeuristicBotController(A, registry).act(viewOf(game)).type).toBe("pass-priority");
  });

  it("stay on offer in the first main phase and in answer to a spell", () => {
    const main = at("precombat-main");
    expect(temporaryEffectCanMatter(main.state, A)).toBe(true);
    const upkeep = at("upkeep");
    const bolt = upkeep.debugSpawn("Lightning Bolt", B, "hand");
    upkeep.debugSpawn("Mountain", B, "battlefield");
    upkeep.dispatch({ type: "pass-priority", player: A });
    upkeep.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "player", player: A }] });
    upkeep.advanceUntil((s) => s.priority.holder === A);
    expect(temporaryEffectCanMatter(upkeep.state, A)).toBe(true);
  });
});
