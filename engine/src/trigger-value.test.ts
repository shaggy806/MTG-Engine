import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Forest")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

describe("Terror of the Peaks — damage = the entering creature's power", () => {
  it("pings for the ETB creature's power on each creature you play", () => {
    const { game, a } = mkGame(["Grizzly Bears", "Craw Wurm"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Terror of the Peaks", A, "battlefield");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];

    let bLife = game.state.players[B].life;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grizzly Bears"),
    });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(bLife - 2); // Bears is 2/2

    bLife = game.state.players[B].life;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Craw Wurm"),
    });
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(bLife - 6); // Craw Wurm is 6/4
  });
});

describe("Old Gnawbone — create Treasures equal to combat damage dealt", () => {
  it("mints one Treasure per point of combat damage a creature deals a player", () => {
    const { game, a } = mkGame([]);
    game.debugSpawn("Old Gnawbone", A, "battlefield", { summoningSick: false });
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];

    game.advanceUntil(toPrecombat);
    game.advanceUntil(toPostcombat);
    game.advanceUntil(quiet);

    // Craw Wurm (6/4) connected for 6 -> 6 Treasure tokens.
    const treasures = game.battlefield.filter(
      (id) =>
        game.state.objects[id].cardName === "Treasure Token" &&
        game.state.objects[id].controller === A,
    );
    expect(treasures).toHaveLength(6);
    expect(game.state.players[B].life).toBe(game.state.rules.startingLife - 6);
  });
});
