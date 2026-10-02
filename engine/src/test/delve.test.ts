/**
 * Delve (rule 702.66): "For each generic mana in this spell's total cost, you
 * may exile a card from your graveyard rather than pay that mana." A payment
 * choice made as the spell is cast — `CardDefinition.delve`, `Action.delve` —
 * offered on the cast as `delve: { choices, minCards, maxCards }`. Shipped
 * against Treasure Cruise.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A;

/** Alice with Treasure Cruise in hand, `islands` untapped Islands and
 * `graveyard` cards in her graveyard. */
const setUp = (islands: number, graveyard: number) => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 20 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Swamp") },
      { player: B, cards: Array<string>(40).fill("Swamp") },
    ],
  });
  game.advanceUntil(toPrecombat);
  const cruise = game.debugSpawn("Treasure Cruise", A, "hand");
  for (let i = 0; i < islands; i += 1) {
    game.debugSpawn("Island", A, "battlefield", { summoningSick: false });
  }
  const yard: ObjectId[] = [];
  for (let i = 0; i < graveyard; i += 1) yard.push(game.debugSpawn("Grizzly Bears", A, "graveyard"));
  // The hand after the cast: Treasure Cruise gone, three cards drawn.
  const handAfter = game.handOf(A).length - 1 + 3;
  return { game, cruise, yard, handAfter };
};

type Cast = Extract<LegalAction, { kind: "cast-spell" }>;
const offer = (game: Game, card: ObjectId): Cast | undefined =>
  game.legalActions(A).find((a): a is Cast => a.kind === "cast-spell" && a.card === card);

const settle = (game: Game): void =>
  game.advanceUntil((s) => s.zones.shared.stack.length === 0 && s.awaiting === null);

describe("delve", () => {
  it("isn't castable when mana and the graveyard together fall short", () => {
    // {7}{U}: one Island pays {U}, six cards pay six of the seven generic.
    const { game, cruise } = setUp(1, 6);
    expect(offer(game, cruise)).toBeUndefined();
  });

  it("is offered with the fewest and most cards it may exile", () => {
    const { game, cruise, yard } = setUp(3, 9);
    expect(offer(game, cruise)?.delve).toEqual({ choices: yard, minCards: 5, maxCards: 7 });
  });

  it("needs nothing exiled when mana pays it all", () => {
    const { game, cruise, handAfter } = setUp(8, 2);
    expect(offer(game, cruise)?.delve).toMatchObject({ minCards: 0, maxCards: 2 });
    game.dispatch({ type: "cast-spell", player: A, card: cruise, targets: [] });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handAfter);
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(2 + 1);
  });

  it("exiles the chosen cards and pays the rest with mana", () => {
    const { game, cruise, yard, handAfter } = setUp(3, 9);
    const exiled = yard.slice(2, 7);
    game.dispatch({ type: "cast-spell", player: A, card: cruise, targets: [], delve: exiled });
    // The mana value is still 8; three mana was spent.
    expect(game.state.objects[cruise].manaSpent).toBe(3);
    settle(game);
    expect(game.handOf(A)).toHaveLength(handAfter);
    for (const id of exiled) expect(game.state.objects[id].zone).toBe("exile");
    expect(game.state.zones.perPlayer[A].graveyard).toEqual([...yard.slice(0, 2), ...yard.slice(7), cruise]);
    const lands = game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].controller === A);
    expect(lands.every((id) => game.state.objects[id].tapped)).toBe(true);
  });

  it("exiles every card for the whole generic cost", () => {
    const { game, cruise, yard, handAfter } = setUp(1, 7);
    game.dispatch({ type: "cast-spell", player: A, card: cruise, targets: [], delve: yard });
    settle(game);
    expect(game.handOf(A)).toHaveLength(handAfter);
  });

  it("refuses more cards than the generic mana, too few, a repeat, or one not there", () => {
    const { game, cruise, yard } = setUp(3, 9);
    const cast = (delve: ObjectId[]) => () =>
      game.dispatch({ type: "cast-spell", player: A, card: cruise, targets: [], delve });
    expect(cast(yard.slice(0, 8))).toThrow(/at most 7/);
    expect(cast(yard.slice(0, 4))).toThrow(/cannot pay/);
    expect(cast([yard[0], yard[0], yard[1], yard[2], yard[3]])).toThrow(/same card twice/);
    const elsewhere = game.debugSpawn("Grizzly Bears", A, "hand");
    expect(cast([elsewhere, ...yard.slice(0, 4)])).toThrow(/not in alice's graveyard/);
    expect(game.state.objects[cruise].zone).toBe("hand");
  });

  it("isn't for a spell without it", () => {
    const { game, yard } = setUp(4, 3);
    const concentrate = game.debugSpawn("Concentrate", A, "hand");
    expect(offer(game, concentrate)?.delve).toBeUndefined();
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: concentrate, targets: [], delve: yard.slice(0, 1) }),
    ).toThrow(/does not have delve/);
  });
});
