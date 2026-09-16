/**
 * Two decisions a live-room bot kept getting wrong, both reported from real
 * games: declining a library search it had just paid for, and (via
 * `AutomaticController`'s conservative defaults) the "each player sacrifices
 * a creature" case where the only creature to give up is the card that
 * asked.
 */

import { describe, expect, it } from "vitest";

import { AutomaticController, HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const onBattlefield = (game: Game, player: string, name: string): ObjectId | undefined =>
  game.state.zones.shared.battlefield.find(
    (id) =>
      game.state.objects[id]?.cardName === name && game.state.objects[id]?.controller === player,
  );

const countOn = (game: Game, player: string, name: string): number =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id]?.cardName === name && game.state.objects[id]?.controller === player,
  ).length;

describe("a bot searching its library", () => {
  it("actually fetches the land when it cracks Evolving Wilds", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Forest") },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Evolving Wilds", A, "battlefield");
    const wilds = onBattlefield(game, A, "Evolving Wilds");
    if (wilds === undefined) throw new Error("no Evolving Wilds");

    const forestsBefore = countOn(game, A, "Forest");
    game.dispatch({ type: "activate-ability", player: A, source: wilds, abilityIndex: 0 });
    game.advanceUntil(quiet);

    expect(onBattlefield(game, A, "Evolving Wilds")).toBeUndefined(); // sacrificed
    expect(countOn(game, A, "Forest")).toBe(forestsBefore + 1); // and replaced
  });

  it("leaves the passive controller's decline-everything default alone", () => {
    // `AutomaticController` is the deliberately do-nothing baseline that
    // scripted tests build on; only the live-room bot is opinionated.
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new AutomaticController(A), [B]: new AutomaticController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Forest") },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Evolving Wilds", A, "battlefield");
    const wilds = onBattlefield(game, A, "Evolving Wilds");
    if (wilds === undefined) throw new Error("no Evolving Wilds");

    const forestsBefore = countOn(game, A, "Forest");
    game.dispatch({ type: "activate-ability", player: A, source: wilds, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(countOn(game, A, "Forest")).toBe(forestsBefore);
  });
});

describe("Fleshbag Marauder", () => {
  it("eats itself when its controller has no other creature", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Swamp") },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const card = game.debugSpawn("Fleshbag Marauder", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(quiet);

    // "Each player sacrifices a creature" — Alice controls only the Marauder,
    // so the Marauder is what she has to give up.
    expect(onBattlefield(game, A, "Fleshbag Marauder")).toBeUndefined();
  });

  it("spares itself when its controller has another creature to give up", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: [
        { player: A, cards: Array(40).fill("Swamp") },
        { player: B, cards: Array(40).fill("Island") },
      ],
    });
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    const card = game.debugSpawn("Fleshbag Marauder", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil(quiet);

    expect(countOn(game, A, "Grizzly Bears") + countOn(game, A, "Fleshbag Marauder")).toBe(1);
  });
});
