import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import { asPlayerId } from "./primitives.js";
import type { ObjectId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aHand: readonly string[], land = "Forest") => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill(land)] },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each]?.cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const tokensOf = (game: Game, p: typeof A, name: string): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name &&
      game.state.objects[id].controller === p &&
      game.state.objects[id].isToken,
  );

describe("Miirym, Sentinel Wyrm — a haste'd, non-legendary copy exiled at end step", () => {
  it("copies a legendary Dragon that enters, and the legend rule spares the copy", () => {
    const { game } = mkGame(["Lathliss, Dragon Queen"], "Mountain");
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 8; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Miirym, Sentinel Wyrm", A, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Lathliss, Dragon Queen"),
    });
    game.advanceUntil(quiet);

    const copies = tokensOf(game, A, "Lathliss, Dragon Queen");
    expect(copies).toHaveLength(1); // survives — the copy is not legendary
    expect(game.state.objects[copies[0]].notLegendary).toBe(true);
    expect(game.characteristics(copies[0]).keywords.has("haste")).toBe(true);
    expect(
      game.battlefield.filter(
        (id) =>
          game.state.objects[id].cardName === "Lathliss, Dragon Queen" &&
          !game.state.objects[id].isToken,
      ),
    ).toHaveLength(1);
  });

  it("exiles the token copy at the beginning of the next end step", () => {
    const { game, a } = mkGame(["Terror of the Peaks"], "Mountain");
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 6; i += 1) game.debugSpawn("Mountain", A, "battlefield");
    game.debugSpawn("Miirym, Sentinel Wyrm", A, "battlefield");
    a.chooseTargetsFn = () => [{ kind: "player", player: B }];

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Terror of the Peaks"),
    });
    game.advanceUntil(quiet);
    const copy = tokensOf(game, A, "Terror of the Peaks");
    expect(copy).toHaveLength(1);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[copy[0]]).toBeUndefined(); // exiled, then token-cleanup SBA deleted it
  });
});

describe("Saw in Half — two 1/1 copies for the destroyed creature's controller", () => {
  it("destroys the target and mints two 1/1 copies under its controller", () => {
    const { game } = mkGame(["Saw in Half"], "Swamp");
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Saw in Half"),
      targets: [{ kind: "object", object: bear }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[bear].zone).toBe("graveyard");
    const copies = tokensOf(game, B, "Grizzly Bears");
    expect(copies).toHaveLength(2);
    for (const id of copies) {
      expect(game.characteristics(id).power).toBe(1);
      expect(game.characteristics(id).toughness).toBe(1);
    }
    expect(tokensOf(game, A, "Grizzly Bears")).toHaveLength(0);
  });
});

describe("Scute Swarm — landfall copies once you control six lands", () => {
  it("makes a 1/1 Insect below six lands", () => {
    const { game } = mkGame(["Forest", "Forest"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Scute Swarm", A, "battlefield");

    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    }); // 4th land — landfall
    game.advanceUntil(quiet);

    expect(tokensOf(game, A, "Insect Token")).toHaveLength(1);
    expect(tokensOf(game, A, "Scute Swarm")).toHaveLength(0);
  });

  it("makes a copy of Scute Swarm at six or more lands", () => {
    const { game } = mkGame(["Forest"]);
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 5; i += 1) game.debugSpawn("Forest", A, "battlefield");
    game.debugSpawn("Scute Swarm", A, "battlefield");

    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    }); // 6th land — landfall
    game.advanceUntil(quiet);

    const copies = tokensOf(game, A, "Scute Swarm");
    expect(copies).toHaveLength(1);
    expect(game.state.objects[copies[0]].copyOf).toBe("Scute Swarm");
    expect(tokensOf(game, A, "Insect Token")).toHaveLength(0);
  });
});
