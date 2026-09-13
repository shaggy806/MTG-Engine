/**
 * needed-cards P20 — two more cards found while continuing the P18/P19
 * follow-up: Rakdos Charm (a new `"creatures-damage-controllers"` effect for
 * its third mode — its other two were already expressible via `castModal`
 * once P17 added the "artifact" TargetSpec) and Orcish Lumberjack (a new
 * `add-mana` `{ oneOf }` mana form — "any combination" of a small fixed set
 * of colours, distinct from the fully-open "any-color"). Orcish Lumberjack's
 * filtered-sacrifice cost still disqualifies it from `isManaAbility`, so it
 * resolves on the stack rather than instantly — documented in its own file.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "./controller.js";
import { Game } from "./game.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { asPlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

const makeGame = (aCards: readonly string[], bCards: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return { game, a, b };
};

describe("Rakdos Charm", () => {
  it("mode 1: exiles target player's graveyard", () => {
    const { game } = makeGame(["Rakdos Charm"]);
    game.debugSpawn("Mountain", A);
    game.debugSpawn("Swamp", A);
    game.debugSpawn("Grizzly Bears", B, "graveyard");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Rakdos Charm"),
      modes: [0],
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(0);
  });

  it("mode 2: destroys target artifact", () => {
    const { game } = makeGame(["Rakdos Charm"]);
    game.debugSpawn("Mountain", A);
    game.debugSpawn("Swamp", A);
    const treasure = game.debugSpawn("Treasure Token", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Rakdos Charm"),
      modes: [1],
      targets: [{ kind: "object", object: treasure }],
    });
    game.advanceUntil(settled);

    expect(game.state.objects[treasure]?.zone).toBe("graveyard");
  });

  it("mode 3: each creature deals 1 damage to its own controller", () => {
    const { game } = makeGame(["Rakdos Charm"]);
    game.debugSpawn("Mountain", A);
    game.debugSpawn("Swamp", A);
    game.debugSpawn("Grizzly Bears", A);
    game.debugSpawn("Grizzly Bears", B);

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Rakdos Charm"),
      modes: [2],
      targets: [],
    });
    game.advanceUntil(settled);

    expect(game.state.players[A].life).toBe(19);
    expect(game.state.players[B].life).toBe(19);
  });
});

describe("Orcish Lumberjack", () => {
  it("sacrifices a Forest for three mana (defaults to the first listed colour)", () => {
    const { game } = makeGame([]);
    const lumberjack = game.debugSpawn("Orcish Lumberjack", A, "battlefield", {
      summoningSick: false,
    });
    const forest = game.debugSpawn("Forest", A);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: lumberjack,
      abilityIndex: 0,
      sacrifice: forest,
    });
    game.advanceUntil(settled);

    expect(game.state.players[A].manaPool.R).toBe(3);
    expect(game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest")).toHaveLength(0);
  });
});
