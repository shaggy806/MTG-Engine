import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Command Tower"),
];

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;

const commanderNamed = (game: Game, name: string): ObjectId => {
  const id = game.state.zones.shared.command.find(
    (i) => game.state.objects[i].owner === A && game.state.objects[i].cardName === name,
  );
  if (id === undefined) throw new Error(`no ${name} in the command zone`);
  return id;
};

describe("Partner — two commanders", () => {
  const mkGame = (): Game =>
    Game.create({
      seed: 1,
      shuffle: false,
      rules: { maxLandsPerTurn: 99, skipFirstDraw: false },
      decks: [
        {
          player: A,
          cards: pad([]),
          commanders: ["Tana, the Bloodsower", "Bruse Tarl, Boorish Herder"],
        },
        { player: B, cards: pad([]) },
      ],
    });

  it("both start in the command zone and are castable from there", () => {
    const game = mkGame();
    const bram = commanderNamed(game, "Tana, the Bloodsower");
    const corv = commanderNamed(game, "Bruse Tarl, Boorish Herder");
    expect(game.state.objects[bram].isCommander).toBe(true);
    expect(game.state.objects[corv].isCommander).toBe(true);

    game.advanceUntil(atFirstMain);
    // Command Towers are the whole deck — play four, cast Tana ({2}{R}{G}).
    for (let i = 0; i < 4; i += 1) {
      const land = game.handOf(A).find((id) => game.state.objects[id].cardName === "Command Tower")!;
      game.dispatch({ type: "play-land", player: A, card: land });
    }
    game.dispatch({ type: "cast-spell", player: A, card: bram, targets: [] });
    game.advanceUntil(stackEmpty);
    expect(game.state.objects[bram].zone).toBe("battlefield");
  });

  it("taxes each commander separately (rule 903.8)", () => {
    const game = mkGame();
    const bram = commanderNamed(game, "Tana, the Bloodsower");
    const corv = commanderNamed(game, "Bruse Tarl, Boorish Herder");
    game.advanceUntil(atFirstMain);
    for (let i = 0; i < 6; i += 1) {
      const land = game.handOf(A).find((id) => game.state.objects[id].cardName === "Command Tower")!;
      game.dispatch({ type: "play-land", player: A, card: land });
    }

    game.dispatch({ type: "cast-spell", player: A, card: bram, targets: [] });
    game.advanceUntil(stackEmpty);
    // Send Tana back to the command zone.
    game.state.objects[bram].zone = "command";
    game.state.zones.shared.battlefield = game.state.zones.shared.battlefield.filter((i) => i !== bram);
    game.state.zones.shared.command.push(bram);

    expect(game.state.players[A].commanderCastCounts["Tana, the Bloodsower"]).toBe(1);
    expect(game.state.players[A].commanderCastCounts["Bruse Tarl, Boorish Herder"] ?? 0).toBe(0);

    // Recasting Tana now costs {2}{R}{G} + {2} tax; Bruse Tarl is still untaxed.
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main");
    const untapped = () =>
      game.state.zones.shared.battlefield.filter(
        (id) =>
          game.state.objects[id].cardName === "Command Tower" && !game.state.objects[id].tapped,
      ).length;
    const before = untapped();
    game.dispatch({ type: "cast-spell", player: A, card: bram, targets: [] });
    game.advanceUntil(stackEmpty);
    expect(before - untapped()).toBe(6); // {2}{R}{G} + {2}
    void corv;
  });
});
