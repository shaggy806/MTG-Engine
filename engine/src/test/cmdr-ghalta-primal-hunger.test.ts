import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

// Ghalta, Primal Hunger: "This spell costs {X} less to cast, where X is the
// total power of creatures you control." Only the generic {10} comes off;
// {G}{G} is always paid. A token stack's power counts once per token.

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};

const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((a) => a.kind === "cast-spell" && a.card === card);

const forests = (game: Game, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn("Forest", A, "battlefield");
};

describe("Ghalta, Primal Hunger", () => {
  it("costs {X} less, X the total power of creatures you control", () => {
    const game = mkGame();
    const ghalta = game.debugSpawn("Ghalta, Primal Hunger", A, "hand");
    forests(game, 4);
    expect(castable(game, ghalta)).toBe(false); // {10}{G}{G} off four Forests

    // Colossal Dreadmaw (6) and Grizzly Bears (2): {10} less 8 is {2}{G}{G}.
    game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    expect(castable(game, ghalta)).toBe(true);

    game.dispatch({ type: "cast-spell", player: A, card: ghalta, targets: [] });
    const lands = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Forest",
    );
    expect(lands.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("never reduces the {G}{G}, however much power there is", () => {
    const game = mkGame();
    const ghalta = game.debugSpawn("Ghalta, Primal Hunger", A, "hand");
    game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    game.debugSpawn("Colossal Dreadmaw", A, "battlefield");
    forests(game, 1);
    expect(castable(game, ghalta)).toBe(false); // 12 power: {G}{G} left, one Forest
    forests(game, 1);
    expect(castable(game, ghalta)).toBe(true);
  });

  it("counts only creatures you control, not an opponent's", () => {
    const game = mkGame();
    const ghalta = game.debugSpawn("Ghalta, Primal Hunger", A, "hand");
    game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    game.debugSpawn("Colossal Dreadmaw", B, "battlefield");
    forests(game, 2);
    expect(castable(game, ghalta)).toBe(false);
  });
});
