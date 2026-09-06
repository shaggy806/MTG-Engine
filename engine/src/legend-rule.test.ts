import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "./cards.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const TEST_LEGEND = defineCard({
  name: "Test Legend",
  manaCost: "{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human"],
  power: 1,
  toughness: 1,
});
const registry = createDefaultRegistry().register(TEST_LEGEND);

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

function mkGame(): Game {
  return Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { maxLandsPerTurn: 99 },
    decks: [
      { player: A, cards: pad(["Test Legend", "Test Legend", "Forest", "Forest"]) },
      { player: B, cards: pad([]) },
    ],
  });
}

describe("the legend rule (704.5j)", () => {
  it("lets a single legendary permanent stick around", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Test Legend"),
      targets: [],
    });
    game.advanceUntil(stackEmpty);

    expect(
      game.state.zones.shared.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Test Legend",
      ),
    ).toHaveLength(1);
  });

  it("destroys the newer of two same-named legendaries the same player controls", () => {
    const game = mkGame();
    game.advanceUntil(atFirstMain);

    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Test Legend"),
      targets: [],
    });
    game.advanceUntil(stackEmpty);
    const survivor = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Test Legend",
    )!;

    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Test Legend"),
      targets: [],
    });
    game.advanceUntil(stackEmpty);

    const onBattlefield = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "Test Legend",
    );
    expect(onBattlefield).toEqual([survivor]);

    const inGraveyard = game.state.zones.perPlayer[A].graveyard.filter(
      (id) => game.state.objects[id].cardName === "Test Legend",
    );
    expect(inGraveyard).toHaveLength(1);

    const destroyedEvent = game.events.find(
      (e) => e.type === "permanent-destroyed" && e.object === inGraveyard[0],
    );
    expect(destroyedEvent).toMatchObject({ reason: "legend rule" });
  });

  it("doesn't apply across different players controlling the same-named legendary", () => {
    const game = Game.create({
      seed: 1,
      shuffle: false,
      registry,
      rules: { maxLandsPerTurn: 99 },
      decks: [
        { player: A, cards: pad(["Test Legend", "Forest"]) },
        { player: B, cards: pad(["Test Legend", "Forest"]) },
      ],
    });
    game.advanceUntil(atFirstMain);
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Test Legend"),
      targets: [],
    });
    game.advanceUntil(stackEmpty);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    game.dispatch({
      type: "play-land",
      player: B,
      card: named(game, game.handOf(B), "Forest"),
    });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: named(game, game.handOf(B), "Test Legend"),
      targets: [],
    });
    game.advanceUntil(stackEmpty);

    expect(
      game.state.zones.shared.battlefield.filter(
        (id) => game.state.objects[id].cardName === "Test Legend",
      ),
    ).toHaveLength(2);
  });
});
