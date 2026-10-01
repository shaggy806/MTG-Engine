/**
 * Damage divided as you choose among any number of targets (rule 601.2d) —
 * Magma Opus. The division is announced as the spell is cast, at least 1 to
 * each target; a copy keeps it; a target that has become illegal is dealt
 * nothing and its share isn't moved (rule 608.2b).
 */

import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: Array<string>(60).fill("Island") },
      { player: B, cards: Array<string>(60).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.priority.holder === A && s.turn.step === "precombat-main");
  for (const [land, n] of [["Mountain", 8], ["Island", 8]] as const) {
    for (let i = 0; i < n; i += 1) {
      const id = game.debugSpawn(land, A, "battlefield");
      game.state.objects[id].tapped = false;
    }
  }
  // Two permanents to tap, and two creatures to hit.
  const tapped = [game.debugSpawn("Plains", B, "battlefield"), game.debugSpawn("Plains", B, "battlefield")];
  const [bear, giant] = [game.debugSpawn("Grizzly Bears", B, "battlefield"), game.debugSpawn("Hill Giant", B, "battlefield")];
  const opus = game.debugSpawn("Magma Opus", A, "hand");
  return { game, tapped, bear, giant, opus };
};

const castOpus = (
  game: Game,
  opus: ObjectId,
  tapped: readonly ObjectId[],
  hit: readonly TargetRef[],
  division?: readonly number[],
) =>
  game.dispatch({
    type: "cast-spell",
    player: A,
    card: opus,
    targets: [obj(tapped[0]), obj(tapped[1]), ...hit],
    ...(division !== undefined ? { division } : {}),
  });

describe("Magma Opus", () => {
  it("deals 4 divided as the caster chose, and does the rest", () => {
    const { game, tapped, bear, giant, opus } = setUp();
    const hand = game.state.zones.perPlayer[A].hand.length;
    // Not the even split ([2, 1, 1]), so the choice is what's dealt.
    castOpus(game, opus, tapped, [obj(bear), obj(giant), player(B)], [1, 2, 1]);
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].damageMarked).toBe(1);
    expect(game.state.objects[giant].damageMarked).toBe(2);
    expect(game.state.players[B].life).toBe(19);
    expect(tapped.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand - 1 + 2);
    const elementals = game.state.zones.shared.battlefield.filter(
      (id) => game.state.objects[id].cardName === "4/4 Blue Red Elemental Token",
    );
    expect(elementals).toHaveLength(1);
  });

  it("splits as evenly as it goes when the caster doesn't say", () => {
    const { game, tapped, bear, opus } = setUp();
    castOpus(game, opus, tapped, [obj(bear), player(B)]);
    expect(game.state.objects[opus].division).toEqual([2, 2]);
    game.advanceUntil(quiet);
    expect(game.state.players[B].life).toBe(18);
  });

  it("refuses a division that isn't at least 1 each, all of 4", () => {
    const { game, tapped, bear, opus } = setUp();
    expect(() => castOpus(game, opus, tapped, [obj(bear), player(B)], [4, 0])).toThrow(/at least 1/);
    expect(() => castOpus(game, opus, tapped, [obj(bear), player(B)], [2, 1])).toThrow(/total 4/);
    expect(() => castOpus(game, opus, tapped, [obj(bear)], [2, 2])).toThrow(/2 shares for 1/);
  });

  it("takes at most four damage targets", () => {
    const { game, tapped, bear, giant, opus } = setUp();
    const more = game.debugSpawn("Grizzly Bears", B, "battlefield");
    expect(() =>
      castOpus(game, opus, tapped, [obj(bear), obj(giant), obj(more), player(B), player(A)]),
    ).toThrow(/at most 4/);
  });

  it("loses a target's share if it has become illegal, not moves it", () => {
    const { game, tapped, bear, opus } = setUp();
    castOpus(game, opus, tapped, [obj(bear), player(B)], [3, 1]);
    // The Bears die in response; their 3 goes nowhere.
    const shock = game.debugSpawn("Shock", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: shock, targets: [obj(bear)] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.players[B].life).toBe(19);
  });

  it("is copied with the same division", () => {
    const { game, tapped, bear, opus } = setUp();
    castOpus(game, opus, tapped, [obj(bear), player(B)], [1, 3]);
    const twincast = game.debugSpawn("Twincast", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: twincast, targets: [obj(opus)] });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));
    const awaiting = game.state.awaiting;
    if (awaiting?.kind === "choose-targets" && awaiting.current !== undefined) {
      game.dispatch({ type: "choose-targets", player: A, targets: [...awaiting.current] });
    }
    game.advanceUntil(quiet);
    // 3 from the copy and 3 from the original.
    expect(game.state.players[B].life).toBe(14);
  });

  it("can be discarded from hand for a Treasure", () => {
    const { game, opus } = setUp();
    game.dispatch({ type: "activate-ability", player: A, source: opus, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[opus].zone).toBe("graveyard");
    expect(
      game.state.zones.shared.battlefield.some((id) => game.state.objects[id].cardName === "Treasure Token"),
    ).toBe(true);
  });
});
