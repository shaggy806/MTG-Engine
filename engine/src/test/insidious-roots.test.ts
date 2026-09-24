/**
 * Insidious Roots (EDHREC rank 1441): creature tokens you control tap for
 * any colour, and "whenever one or more creature cards leave your
 * graveyard, create a 0/1 green Plant creature token, then put a +1/+1
 * counter on each Plant you control" — the batched `leaves-graveyard`
 * trigger with a creature filter, once for creature cards that leave
 * together (its ruling).
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const ROOTS = "Insidious Roots";

const registry = createDefaultRegistry();

const makeGame = (): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(40).fill("Forest") },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  return game;
};

const settled = (s: GameState): boolean =>
  s.pendingTriggers.length === 0 && s.zones.shared.stack.length === 0 && s.awaiting === null;

const plants = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].cardName === "Plant Token",
  );
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, game.registry, id);
  return [c.power, c.toughness];
};
const exileMyGraveyard = (game: Game): void => {
  game.debugApplyEffect(B, { kind: "exile-graveyard", target: 0 }, [
    { kind: "player", player: A },
  ]);
  game.advanceUntil(settled);
};
const activatable = (game: Game, id: ObjectId): boolean =>
  game.legalActions(A).some((a) => a.kind === "activate-ability" && a.source === id);

describe("Insidious Roots — the graveyard trigger", () => {
  it("creature cards leaving together make one Plant, then every Plant grows", () => {
    const game = makeGame();
    game.debugSpawn(ROOTS, A);
    for (const name of ["Grizzly Bears", "Craw Wurm", "Forest", "Lightning Bolt"]) {
      game.debugSpawn(name, A, "graveyard");
    }
    exileMyGraveyard(game);
    const [first] = plants(game);
    expect(plants(game)).toHaveLength(1);
    expect(pt(game, first)).toEqual([1, 2]);

    // A second move: a second Plant, and a counter on each of them.
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "return-to-hand", target: 0, from: "graveyard" }, [
      { kind: "object", object: bears },
    ]);
    game.advanceUntil(settled);
    const all = plants(game);
    expect(all).toHaveLength(2);
    const second = all.find((id) => id !== first);
    if (second === undefined) throw new Error("no second Plant");
    expect(pt(game, first)).toEqual([2, 3]);
    expect(pt(game, second)).toEqual([1, 2]);
  });

  it("noncreature cards leaving don't trigger it", () => {
    const game = makeGame();
    game.debugSpawn(ROOTS, A);
    for (const name of ["Forest", "Lightning Bolt", "Sol Ring"]) {
      game.debugSpawn(name, A, "graveyard");
    }
    exileMyGraveyard(game);
    expect(plants(game)).toHaveLength(0);
  });

  it("only your graveyard", () => {
    const game = makeGame();
    game.debugSpawn(ROOTS, A);
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugApplyEffect(A, { kind: "exile-graveyard", target: 0 }, [
      { kind: "player", player: B },
    ]);
    game.advanceUntil(settled);
    expect(plants(game)).toHaveLength(0);
  });
});

describe("Insidious Roots — creature tokens tap for mana", () => {
  it("gives your creature tokens the mana ability, not your nontoken creatures or theirs", () => {
    const game = makeGame();
    game.debugSpawn(ROOTS, A);
    game.debugSpawn("Grizzly Bears", A, "graveyard");
    exileMyGraveyard(game);
    const [plant] = plants(game);
    game.state.objects[plant].summoningSick = false;
    const bears = game.debugSpawn("Grizzly Bears", A);
    game.state.objects[bears].summoningSick = false;
    expect(activatable(game, plant)).toBe(true);
    expect(activatable(game, bears)).toBe(false);

    game.dispatch({ type: "activate-ability", player: A, source: plant, abilityIndex: 0 });
    expect(game.state.objects[plant].tapped).toBe(true);
    expect(game.state.players[A].manaPool).toHaveLength(1);
  });
});
