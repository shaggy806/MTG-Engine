/**
 * Ways out of the legend rule (704.5j): a static "the 'legend rule' doesn't
 * apply to permanents you control" (Sakashima of a Thousand Faces) and the
 * same ability carried by a copy exception; "isn't legendary if it's a
 * token" (Aeve, Progenitor Ooze); and a copy "except it isn't legendary"
 * (Spark Double).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { supertypesOf } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => {
  game.advanceUntil(quiet);
};
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield", { summoningSick: false });
  game.state.objects[id].tapped = false;
  return id;
};
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
/** Let the state-based check look at the board (it does as a player would
 * receive priority — rule 704.3): on to the next step A has priority in. */
const checkBoard = (game: Game): void => {
  const step = game.state.turn.step;
  game.advanceUntil((st) => st.turn.step !== step && st.priority.holder === A && quiet(st));
};
const cast = (game: Game, name: string, player: PlayerId = A): ObjectId => {
  const card = game.debugSpawn(name, player, "hand");
  game.dispatch({ type: "cast-spell", player, card, targets: [] });
  settle(game);
  return card;
};
const onField = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name || game.state.objects[id].copyOf === name);
const legendary = (game: Game, id: ObjectId): boolean =>
  supertypesOf(registry, game.state.objects[id]).includes("legendary");

describe("'the legend rule doesn't apply to permanents you control' (Sakashima of a Thousand Faces)", () => {
  it("keeps any number of same-named legends of its controller's, and only its controller's", () => {
    const { game } = setUp();
    spawn(game, "Sakashima of a Thousand Faces");
    spawn(game, "Krenko, Mob Boss");
    spawn(game, "Krenko, Mob Boss");
    spawn(game, "Krenko, Mob Boss", B);
    spawn(game, "Krenko, Mob Boss", B);
    checkBoard(game);
    const krenkos = onField(game, "Krenko, Mob Boss");
    expect(krenkos.filter((id) => game.state.objects[id].controller === A)).toHaveLength(2);
    expect(krenkos.filter((id) => game.state.objects[id].controller === B)).toHaveLength(1);
  });

  it("applies again the moment Sakashima leaves, or loses its abilities", () => {
    const { game } = setUp();
    const sakashima = spawn(game, "Sakashima of a Thousand Faces");
    spawn(game, "Krenko, Mob Boss");
    spawn(game, "Krenko, Mob Boss");
    checkBoard(game);
    expect(onField(game, "Krenko, Mob Boss")).toHaveLength(2);
    game.state.objects[sakashima].modifiers.push({
      power: 0,
      toughness: 0,
      keywords: [],
      loseAbilities: true,
      untilEndOfTurn: true,
      timestamp: game.state.timestampSeq + 1,
    });
    checkBoard(game);
    expect(onField(game, "Krenko, Mob Boss")).toHaveLength(1);
  });

  it("enters as a copy of another creature you control and keeps the ability, so both stay", () => {
    const { game, a } = setUp();
    lands(game, "Island", 4);
    const krenko = spawn(game, "Krenko, Mob Boss");
    spawn(game, "Grizzly Bears", B);
    const offered: ObjectId[][] = [];
    a.chooseCopyFn = (_v, _s, options) => {
      offered.push([...options]);
      return krenko;
    };
    const sakashima = cast(game, "Sakashima of a Thousand Faces");
    // "Another creature you control": not the opponent's Bears.
    expect(offered).toEqual([[krenko]]);
    expect(game.state.objects[sakashima].copyOf).toBe("Krenko, Mob Boss");
    expect(legendary(game, sakashima)).toBe(true);
    expect(game.state.objects[krenko].zone).toBe("battlefield");
    expect(game.state.objects[sakashima].zone).toBe("battlefield");
    // Its exception is copiable: a Clone of it has the ability too.
    lands(game, "Island", 4);
    a.chooseCopyFn = () => sakashima;
    const clone = cast(game, "Clone");
    expect(game.state.objects[clone].copyOf).toBe("Krenko, Mob Boss");
    expect(onField(game, "Krenko, Mob Boss")).toHaveLength(3);
  });
});

describe("'isn't legendary if it's a token' (Aeve, Progenitor Ooze)", () => {
  it("storm copies are nonlegendary tokens, each counting the Oozes already there", () => {
    const { game } = setUp();
    lands(game, "Forest", 6);
    lands(game, "Mountain", 1);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: bolt, targets: [{ kind: "player", player: B }] });
    settle(game);
    // One spell before it: one storm copy, which resolves first with no Ooze
    // to count; the original then counts the copy.
    game.dispatch({ type: "cast-spell", player: A, card: game.debugSpawn("Aeve, Progenitor Ooze", A, "hand"), targets: [] });
    settle(game);
    const aeves = onField(game, "Aeve, Progenitor Ooze");
    expect(aeves).toHaveLength(2);
    const token = aeves.find((id) => game.state.objects[id].isToken)!;
    const card = aeves.find((id) => !game.state.objects[id].isToken)!;
    expect(legendary(game, token)).toBe(false);
    expect(legendary(game, card)).toBe(true);
    expect(game.state.objects[token].counters["+1/+1"] ?? 0).toBe(0);
    expect(game.state.objects[card].counters["+1/+1"]).toBe(1);
    expect(computeCharacteristics(game.state, registry, card).power).toBe(3);
  });

  it("a nontoken copy of it is legendary, and the legend rule sees it", () => {
    const { game, a } = setUp();
    lands(game, "Island", 4);
    const aeve = spawn(game, "Aeve, Progenitor Ooze");
    a.chooseCopyFn = () => aeve;
    const clone = cast(game, "Clone");
    // Two legendary Aeves: the one controlled longest is kept by default.
    expect(onField(game, "Aeve, Progenitor Ooze")).toEqual([aeve]);
    expect(game.state.objects[clone].zone).toBe("graveyard");
  });
});

describe("a copy 'except it isn't legendary' (Spark Double)", () => {
  it("stays beside the legend it copied, and so does a copy of it", () => {
    const { game, a } = setUp();
    lands(game, "Island", 8);
    const krenko = spawn(game, "Krenko, Mob Boss");
    const double = cast(game, "Spark Double");
    expect(game.state.objects[double].copyOf).toBe("Krenko, Mob Boss");
    expect(legendary(game, double)).toBe(false);
    a.chooseCopyFn = () => double;
    const clone = cast(game, "Clone");
    expect(legendary(game, clone)).toBe(false);
    expect([krenko, double, clone].map((id) => game.state.objects[id].zone)).toEqual([
      "battlefield",
      "battlefield",
      "battlefield",
    ]);
  });
});
