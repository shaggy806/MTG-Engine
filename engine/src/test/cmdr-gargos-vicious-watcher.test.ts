/**
 * Gargos, Vicious Watcher, and the two `becomes-target` fixes it needed:
 * `spellOnly` ("becomes the target of a **spell**"), and `object-targeted`
 * emitted once per targeted *object* rather than once per target slot.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { Game } from "../game.js";
import { asPlayerId, type ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Two separate "target" words, so the same creature may fill both slots
 * (rule 115.3). */
const twinPump = defineCard({
  name: "Test Twin Pump",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Target creature gets +1/+1 until end of turn. Target creature gets +1/+1 until end of turn.",
  targets: ["creature", "creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      { kind: "modify-pt", target: 1, power: 1, toughness: 1, duration: "end-of-turn" },
    ],
  },
});

const makeGame = () =>
  Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry().register(twinPump),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });

const toMain = (game: Game) =>
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");

const readyLands = (game: Game, n: number, player = A) => {
  for (let i = 0; i < n; i += 1) {
    const id = game.debugSpawn("Forest", player, "battlefield");
    game.state.objects[id].tapped = false;
  }
};

const creature = (game: Game, name: string, player = A): ObjectId => {
  const id = game.debugSpawn(name, player, "battlefield");
  game.state.objects[id].summoningSick = false;
  return id;
};

const obj = (object: ObjectId) => ({ kind: "object" as const, object });

/** Decline each Gargos trigger's fight as it asks, and count them — a
 * trigger is only placed (and logged) once its target is chosen. */
const gargosTriggers = (game: Game, gargos: ObjectId) => {
  for (let i = 0; i < 8 && game.state.awaiting?.kind === "choose-targets"; i += 1) {
    game.dispatch({ type: "choose-targets", player: A, targets: [null] });
  }
  return game.state.eventLog.filter((e) => e.type === "ability-triggered" && e.source === gargos)
    .length;
};

const castPump = (game: Game, first: ObjectId, second: ObjectId) => {
  const card = game.debugSpawn("Test Twin Pump", A, "hand");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(first), obj(second)] });
};

describe("Gargos, Vicious Watcher", () => {
  it("fights a chosen creature when a spell targets a creature you control", () => {
    const game = makeGame();
    toMain(game);
    const gargos = creature(game, "Gargos, Vicious Watcher");
    const bears = creature(game, "Grizzly Bears");
    const theirs = creature(game, "Grizzly Bears", B);
    readyLands(game, 1);

    castPump(game, bears, bears);
    expect(game.state.awaiting?.kind).toBe("choose-targets");
    game.dispatch({ type: "choose-targets", player: A, targets: [obj(theirs)] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    expect(game.state.objects[theirs].zone).toBe("graveyard");
    expect(game.state.objects[gargos].damageMarked).toBe(2);
  });

  it("triggers once for one creature named in both slots", () => {
    const game = makeGame();
    toMain(game);
    const gargos = creature(game, "Gargos, Vicious Watcher");
    const bears = creature(game, "Grizzly Bears");
    creature(game, "Grizzly Bears", B);
    readyLands(game, 1);

    castPump(game, bears, bears);
    expect(
      game.state.eventLog.filter((e) => e.type === "object-targeted" && e.object === bears),
    ).toHaveLength(1);
    expect(gargosTriggers(game, gargos)).toBe(1);
  });

  it("triggers once per creature when a spell targets two of them", () => {
    const game = makeGame();
    toMain(game);
    const gargos = creature(game, "Gargos, Vicious Watcher");
    const bears = creature(game, "Grizzly Bears");
    creature(game, "Grizzly Bears", B);
    readyLands(game, 1);

    // Gargos itself is a creature you control, so it counts too.
    castPump(game, bears, gargos);
    expect(gargosTriggers(game, gargos)).toBe(2);
  });

  it("ignores an ability targeting your creature", () => {
    const game = makeGame();
    toMain(game);
    const gargos = creature(game, "Gargos, Vicious Watcher");
    const bears = creature(game, "Grizzly Bears");
    creature(game, "Grizzly Bears", B);
    const sorcerer = creature(game, "Prodigal Sorcerer");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: sorcerer,
      abilityIndex: 0,
      targets: [obj(bears)],
    });
    expect(game.state.eventLog.some((e) => e.type === "object-targeted" && e.object === bears)).toBe(true);
    expect(gargosTriggers(game, gargos)).toBe(0);
  });

  it("triggers again for a copy of the spell, which targets the creature too", () => {
    const game = makeGame();
    toMain(game);
    const gargos = creature(game, "Gargos, Vicious Watcher");
    const bears = creature(game, "Grizzly Bears");
    creature(game, "Grizzly Bears", B);
    readyLands(game, 1);
    const islands = ["Island", "Island"].map((n) => {
      const id = game.debugSpawn(n, A, "battlefield");
      game.state.objects[id].tapped = false;
      return id;
    });
    expect(islands).toHaveLength(2);

    const growth = game.debugSpawn("Giant Growth", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: growth, targets: [obj(bears)] });
    expect(gargosTriggers(game, gargos)).toBe(1);
    // Twincast goes on the stack above Gargos's trigger and the Growth.
    const twincast = game.debugSpawn("Twincast", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: twincast, targets: [obj(growth)] });
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({ type: "pass-priority", player: B });
    // Twincast resolved: the copy of Giant Growth targets the Bears.
    expect(
      game.state.eventLog.filter((e) => e.type === "object-targeted" && e.object === bears),
    ).toHaveLength(2);
    expect(gargosTriggers(game, gargos)).toBe(2);
  });

  it("may decline the fight — up to one target", () => {
    const game = makeGame();
    toMain(game);
    const gargos = creature(game, "Gargos, Vicious Watcher");
    const bears = creature(game, "Grizzly Bears");
    const theirs = creature(game, "Grizzly Bears", B);
    readyLands(game, 1);

    castPump(game, bears, bears);
    game.dispatch({ type: "choose-targets", player: A, targets: [null] });
    game.advanceUntil((s) => s.zones.shared.stack.length === 0 || s.result.over);

    expect(game.state.objects[theirs].zone).toBe("battlefield");
    expect(game.state.objects[theirs].damageMarked).toBe(0);
    expect(game.state.objects[gargos].damageMarked).toBe(0);
  });

  it("offers only creatures you don't control", () => {
    const game = makeGame();
    toMain(game);
    creature(game, "Gargos, Vicious Watcher");
    const bears = creature(game, "Grizzly Bears");
    const theirs = creature(game, "Grizzly Bears", B);
    readyLands(game, 1);

    castPump(game, bears, bears);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-targets") throw new Error("expected a target choice");
    const options = awaiting.options[0].map((t) => (t.kind === "object" ? t.object : null));
    expect(options).toEqual([theirs]);
  });

  it("makes Hydra spells you cast cost {4} less", () => {
    const castable = (withGargos: boolean) => {
      const game = makeGame();
      toMain(game);
      if (withGargos) creature(game, "Gargos, Vicious Watcher");
      readyLands(game, 2);
      game.debugSpawn("Kalonian Hydra", A, "hand");
      return game
        .legalActions(A)
        .some((a) => a.kind === "cast-spell" && a.cardName === "Kalonian Hydra");
    };
    // {3}{G}{G} with {4} off the generic part is {G}{G}.
    expect(castable(true)).toBe(true);
    expect(castable(false)).toBe(false);
  });
});

describe("Tectonic Giant — spell only", () => {
  it("ignores an opponent's ability but not an opponent's spell", () => {
    const game = makeGame();
    toMain(game);
    const giant = creature(game, "Tectonic Giant");
    const sorcerer = creature(game, "Prodigal Sorcerer", B);
    const triggered = () =>
      game.state.eventLog.filter((e) => e.type === "ability-triggered" && e.source === giant).length;

    game.dispatch({ type: "pass-priority", player: A });
    for (let i = 0; i < 4 && game.state.priority.holder !== B; i += 1) {
      const holder = game.state.priority.holder;
      if (holder === null) break;
      game.dispatch({ type: "pass-priority", player: holder });
    }
    expect(game.state.priority.holder).toBe(B);
    game.dispatch({
      type: "activate-ability",
      player: B,
      source: sorcerer,
      abilityIndex: 0,
      targets: [obj(giant)],
    });
    expect(triggered()).toBe(0);

    readyLands(game, 1, B);
    const card = game.debugSpawn("Test Twin Pump", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card, targets: [obj(giant), obj(giant)] });
    expect(triggered()).toBe(1);
  });
});
