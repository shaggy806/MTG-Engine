/**
 * Eshki Dragonclaw — {1}{G}{U}{R} legendary 4/4 Human Warrior.
 *
 *   Vigilance, trample, ward {1}
 *   At the beginning of combat on your turn, if you've cast both a creature
 *   spell and a noncreature spell this turn, draw a card and put two +1/+1
 *   counters on Eshki Dragonclaw.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  const eshki = game.debugSpawn("Eshki Dragonclaw", A, "battlefield", { summoningSick: false });
  for (let i = 0; i < 5; i += 1) game.debugSpawn("Forest", A, "battlefield");
  game.debugSpawn("Island", A, "battlefield");
  return { game, eshki };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const cast = (game: Game, name: string, face?: number): void => {
  const card = game.debugSpawn(name, A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, ...(face === undefined ? {} : { face }) });
  game.advanceUntil(quiet);
};
/** On to combat: how many cards Alice drew there and Eshki's counters after. */
const atCombat = (game: Game, eshki: ReturnType<typeof setUp>["eshki"]) => {
  const hand = game.handOf(A).length;
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "begin-combat" && quiet(s));
  return { drew: game.handOf(A).length - hand, counters: game.state.objects[eshki].counters["+1/+1"] ?? 0 };
};

describe("Eshki Dragonclaw", () => {
  it("with a creature spell and a noncreature spell cast, draws a card and grows at combat", () => {
    const { game, eshki } = setUp();
    cast(game, "Grizzly Bears");
    cast(game, "Opt");
    expect(atCombat(game, eshki)).toEqual({ drew: 1, counters: 2 });
  });

  it("with only one kind cast, does nothing", () => {
    const { game, eshki } = setUp();
    cast(game, "Grizzly Bears");
    expect(atCombat(game, eshki)).toEqual({ drew: 0, counters: 0 });
  });

  it("an Adventure cast as its sorcery was a noncreature spell, though a creature card is in exile after", () => {
    const { game, eshki } = setUp();
    cast(game, "Beanstalk Giant", 1); // Fertile Footsteps
    const giant = game.state.zones.shared.exile.find((id) => game.state.objects[id].cardName === "Beanstalk Giant");
    expect(giant).toBeDefined();
    cast(game, "Grizzly Bears");
    expect(atCombat(game, eshki)).toEqual({ drew: 1, counters: 2 });
  });

  it("only on your own turn's combat", () => {
    const { game, eshki } = setUp();
    // Both kinds cast on Bob's turn, at instant speed: a flash creature and
    // an instant.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === A);
    cast(game, "Ambush Viper");
    game.advanceUntil((s) => s.turn.number === 2 && s.priority.holder === A);
    cast(game, "Opt");
    expect(game.state.players[A].spellsCastThisTurnAs).toHaveLength(2);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "end" && quiet(s));
    expect(game.state.objects[eshki].counters["+1/+1"] ?? 0).toBe(0);
  });
});
