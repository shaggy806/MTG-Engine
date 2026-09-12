/**
 * Extra land drops per turn (needed-cards P16 — Princess Sarah / Icetill
 * Explorer). New: `StaticAbility.extraLandsPerTurn`, folded into
 * `Game.maxLandsFor` on top of the global `GameRules.maxLandsPerTurn`.
 */
import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const mkGame = (aHand: readonly string[]) =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });

const spawn = (game: Game, cardName: string, controller: PlayerId): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id, cardName, owner: controller, controller, zone: "battlefield",
    tapped: false, damageMarked: 0, markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0, summoningSick: false, loyaltyActivatedThisTurn: false, targets: null,
    attacking: null, blocking: null, blockedBy: [], blocked: false,
    kind: "card", abilityKind: null, sourceObjectId: null, abilityIndex: null,
    counters: {}, modifiers: [], timestamp: game.state.timestampSeq,
    isToken: false, attachedTo: null, isCommander: false, xValue: null,
    controlEndsAtCleanup: false, copyOf: null,
  };
  game.state.zones.shared.battlefield.push(id);
  return id;
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";

describe("Princess Sarah — two additional land drops", () => {
  it("allows three lands in one turn instead of one", () => {
    const game = mkGame(["Forest", "Forest", "Forest"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Princess Sarah", A);
    const forests = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Forest");

    for (const id of forests) {
      game.dispatch({ type: "play-land", player: A, card: id });
    }

    expect(
      game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest").length,
    ).toBe(3);
    expect(
      game.canDispatch({
        type: "play-land",
        player: A,
        card: game.handOf(A).find((id) => game.state.objects[id].cardName === "Forest")!,
      }),
    ).not.toBeNull(); // a 4th is still refused
  });
});

describe("Icetill Explorer — one additional land drop, graveyard lands, landfall mill", () => {
  it("plays one from hand plus one from the graveyard (its full allowance), milling on each", () => {
    const game = mkGame(["Forest"]);
    game.advanceUntil(toPrecombat);
    spawn(game, "Icetill Explorer", A);
    const graveyardForest = game.debugSpawn("Forest", A, "graveyard");
    const before = game.libraryOf(A).length;

    const settled = (s: GameState): boolean =>
      s.zones.shared.stack.length === 0 && s.awaiting === null;
    game.dispatch({
      type: "play-land",
      player: A,
      card: game.handOf(A).find((i) => game.state.objects[i].cardName === "Forest")!,
    });
    game.advanceUntil(settled);
    game.dispatch({ type: "play-land", player: A, card: graveyardForest });
    game.advanceUntil(settled);

    expect(game.state.objects[graveyardForest].zone).toBe("battlefield");
    expect(game.libraryOf(A).length).toBe(before - 2); // one mill per land drop
    expect(
      game.canDispatch({
        type: "play-land",
        player: A,
        card: game.handOf(A).find((i) => game.state.objects[i].cardName === "Forest")!,
      }),
    ).not.toBeNull(); // base 1 + extra 1 = 2, no third
  });
});
