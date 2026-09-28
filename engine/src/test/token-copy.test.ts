import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

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

// `create-token-copy`'s `gainsHaste`/`exileAtEndStep` flags (a temporary,
// hasty copy — Reflection of Kiki-Jiki's shape) remain implemented but are
// currently unexercised by any pool card: Miirym's real Oracle text (checked
// against Scryfall — needed-cards verification pass) makes a permanent,
// ordinary copy with neither haste nor an expiry, unlike what an earlier
// pass here had guessed.
describe("Miirym, Sentinel Wyrm — a permanent, non-legendary copy", () => {
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
    expect(
      game.battlefield.filter(
        (id) =>
          game.state.objects[id].cardName === "Lathliss, Dragon Queen" &&
          !game.state.objects[id].isToken,
      ),
    ).toHaveLength(1);
  });

  it("does not exile the copy at the next end step — it's permanent", () => {
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
    const copy = tokensOf(game, A, "Lathliss, Dragon Queen");
    expect(copy).toHaveLength(1);

    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.state.objects[copy[0]]).toBeDefined();
    expect(game.state.objects[copy[0]]?.zone).toBe("battlefield");
  });
});

describe("Saw in Half — two half-size copies, if the creature died", () => {
  const sawIn = (target: (game: Game) => ObjectId, extra: readonly string[] = []) => {
    const { game } = mkGame(["Saw in Half"], "Swamp");
    game.advanceUntil(toPrecombat);
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Swamp", A, "battlefield");
    for (const name of extra) game.debugSpawn(name, A, "battlefield");
    const victim = target(game);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Saw in Half"),
      targets: [{ kind: "object", object: victim }],
    });
    game.advanceUntil(quiet);
    return { game, victim };
  };

  it("halves the power and toughness it died with, rounding up, under its controller", () => {
    // A 6/4 Craw Wurm with a +1/+1 counter died a 7/5: the copies are 4/3,
    // and don't copy the counter.
    const { game, victim } = sawIn((g) => {
      const wurm = g.debugSpawn("Craw Wurm", B, "battlefield");
      g.state.objects[wurm].counters["+1/+1"] = 1;
      return wurm;
    });
    expect(game.state.objects[victim].zone).toBe("graveyard");
    const copies = tokensOf(game, B, "Craw Wurm");
    expect(copies).toHaveLength(2);
    for (const id of copies) {
      expect(game.characteristics(id)).toMatchObject({ power: 4, toughness: 3 });
      expect(game.state.objects[id].counters["+1/+1"] ?? 0).toBe(0);
    }
    expect(tokensOf(game, A, "Craw Wurm")).toHaveLength(0);
  });

  it("makes nothing when the creature isn't destroyed", () => {
    const { game, victim } = sawIn((g) => g.debugSpawn("Darksteel Myr", B, "battlefield"));
    expect(game.state.objects[victim].zone).toBe("battlefield");
    expect(tokensOf(game, B, "Darksteel Myr")).toHaveLength(0);
  });

  it("makes nothing when the creature is exiled instead of dying", () => {
    const { game, victim } = sawIn((g) => g.debugSpawn("Craw Wurm", B, "battlefield"), ["Rest in Peace"]);
    expect(game.state.objects[victim].zone).toBe("exile");
    expect(tokensOf(game, B, "Craw Wurm")).toHaveLength(0);
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
