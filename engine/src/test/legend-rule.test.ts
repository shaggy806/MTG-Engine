import { describe, expect, it } from "vitest";

import { createDefaultRegistry, defineCard } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import { printedCardName } from "../state.js";
import type { GameState } from "../state.js";

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
const OTHER_LEGEND = defineCard({
  name: "Other Legend",
  manaCost: "{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf"],
  power: 2,
  toughness: 2,
});
const registry = createDefaultRegistry().register(TEST_LEGEND).register(OTHER_LEGEND);

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

  describe("a copy has the name of what it copies (rule 707.2)", () => {
    /** Alice holds Clones and four Islands to cast each with; `copyChoices`
     * are what each Clone copies, in cast order. */
    function cloneGame(copyChoices: ObjectId[]): { game: Game; cast: () => ObjectId } {
      const alice = new ScriptedController(A);
      alice.chooseCopyFn = () => copyChoices.shift() ?? null;
      const game = Game.create({
        seed: 1,
        shuffle: false,
        registry,
        controllers: { [A]: alice, [B]: new ScriptedController(B) },
        decks: [
          { player: A, cards: pad([]) },
          { player: B, cards: pad([]) },
        ],
      });
      game.advanceUntil(atFirstMain);
      const cast = (): ObjectId => {
        for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A);
        const clone = game.debugSpawn("Clone", A, "hand");
        game.dispatch({ type: "cast-spell", player: A, card: clone, targets: [] });
        game.advanceUntil((s) => stackEmpty(s) && s.awaiting === null);
        return clone;
      };
      return { game, cast };
    }
    const legendsOf = (game: Game, name: string): ObjectId[] =>
      game.state.zones.shared.battlefield.filter(
        (id) =>
          game.state.objects[id].controller === A &&
          printedCardName(game.state.objects[id]) === name,
      );

    it("a Clone of your own legend is put into the graveyard by the legend rule", () => {
      const copies: ObjectId[] = [];
      const { game, cast } = cloneGame(copies);
      const original = game.debugSpawn("Test Legend", A);
      copies.push(original);

      const clone = cast();

      expect(legendsOf(game, "Test Legend")).toEqual([original]);
      expect(game.state.objects[clone].zone).toBe("graveyard");
      expect(
        game.events.find((e) => e.type === "permanent-destroyed" && e.object === clone),
      ).toMatchObject({ reason: "legend rule" });
    });

    it("Clones of two different legends both stay", () => {
      const copies: ObjectId[] = [];
      const { game, cast } = cloneGame(copies);
      copies.push(game.debugSpawn("Test Legend", B), game.debugSpawn("Other Legend", B));

      const first = cast();
      const second = cast();

      expect(legendsOf(game, "Test Legend")).toEqual([first]);
      expect(legendsOf(game, "Other Legend")).toEqual([second]);
    });
  });
});
