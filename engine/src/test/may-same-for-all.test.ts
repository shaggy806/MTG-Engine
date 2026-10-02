/**
 * "The same for all of them": several identical triggers on the stack each
 * asking the same "you may" can be answered once, for all of them
 * (`choose-modes`' `forAll`, `GameState.standingModeAnswers`) — a shortcut
 * (rule 732.2a) that anything new on the stack ends (732.2b).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  // Every "you may" the controller is asked itself, rather than answered by
  // a standing answer: their prompts, in order.
  const asked: string[] = [];
  a.chooseModesFn = (_view, _min, _max, texts) => {
    asked.push(texts[0]);
    return [0];
  };
  return { game, asked };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const asking = (s: GameState): boolean => s.awaiting?.kind === "choose-modes";
const enters = (game: Game, name: string): void => {
  game.debugSpawn(name, A, "battlefield", { summoningSick: false, announceEntry: true });
};

/** Three Grazing Gladeharts and a Lifegift, then a land: four triggers, three
 * of them the same. */
const landfall = (game: Game): void => {
  for (let i = 0; i < 3; i += 1) enters(game, "Grazing Gladehart");
  enters(game, "Lifegift");
  enters(game, "Forest");
  game.advanceUntil(asking);
};

const firstGladehart = (game: Game): void => {
  // Lifegift's went on the stack last, so it's asked first.
  const awaiting = game.state.awaiting;
  if (awaiting?.kind === "choose-modes" && awaiting.modes[0].text === "Gain 1 life?") {
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(asking);
  }
};

describe("answering identical may triggers together", () => {
  it("offers it with how many more are under this one", () => {
    const { game } = setUp();
    landfall(game);
    firstGladehart(game);
    const offer = game.legalActions(A).find((a) => a.kind === "choose-modes");
    expect(offer).toMatchObject({ modeTexts: ["Gain 2 life?"], sameForAll: 2 });
  });

  it("doesn't offer it for the last one, or a trigger with no twin", () => {
    const { game } = setUp();
    enters(game, "Grazing Gladehart");
    enters(game, "Forest");
    game.advanceUntil(asking);
    const offer = game.legalActions(A).find((a) => a.kind === "choose-modes");
    expect(offer).toBeDefined();
    expect(offer).not.toHaveProperty("sameForAll");
  });

  it("yes for all: each identical trigger gains the life without asking", () => {
    const { game, asked } = setUp();
    const life = game.state.players[A].life;
    landfall(game);
    firstGladehart(game);
    game.dispatch({ type: "choose-modes", player: A, modes: [0], forAll: true });
    game.advanceUntil(quiet);
    expect(asked).toEqual([]);
    expect(game.state.players[A].life).toBe(life + 1 + 2 * 3);
    expect(game.state.standingModeAnswers).toBeUndefined();
  });

  it("no for all: none of them gains", () => {
    const { game, asked } = setUp();
    const life = game.state.players[A].life;
    landfall(game);
    firstGladehart(game);
    game.dispatch({ type: "choose-modes", player: A, modes: [], forAll: true });
    game.advanceUntil(quiet);
    expect(asked).toEqual([]);
    expect(game.state.players[A].life).toBe(life + 1);
  });

  it("without it, each one is asked", () => {
    const { game, asked } = setUp();
    landfall(game);
    firstGladehart(game);
    game.dispatch({ type: "choose-modes", player: A, modes: [0] });
    game.advanceUntil(quiet);
    expect(asked).toEqual(["Gain 2 life?", "Gain 2 life?"]);
  });

  it("ends once something new goes on the stack", () => {
    const { game, asked } = setUp();
    landfall(game);
    firstGladehart(game);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-modes" || awaiting.trigger === undefined) {
      throw new Error("expected a Gladehart's may");
    }
    const [bottom, next] = awaiting.trigger.alike;
    game.dispatch({ type: "choose-modes", player: A, modes: [0], forAll: true });
    // A second land. Its triggers go on the stack as Alice next gets
    // priority, after the Gladehart trigger on top has resolved with her
    // answer; then three new Gladehart triggers and a Lifegift trigger sit
    // over the last old one. Something new on the stack ends the shortcut
    // (rule 732.2b): every new one is asked, and so is the old one under
    // them.
    enters(game, "Forest");
    const whose: string[] = [];
    game.advanceUntil((s) => {
      if (s.awaiting?.kind === "choose-modes" && s.awaiting.trigger !== undefined) {
        const object = s.awaiting.trigger.object;
        if (whose.at(-1) !== object) whose.push(object);
      }
      return quiet(s);
    });
    expect(whose).not.toContain(next);
    expect(whose.at(-1)).toBe(bottom);
    expect(asked.filter((text) => text === "Gain 2 life?")).toHaveLength(3 + 1);
    expect(game.state.standingModeAnswers).toBeUndefined();
  });
});
