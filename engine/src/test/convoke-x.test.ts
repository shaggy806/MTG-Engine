import { describe, expect, it } from "vitest";

import { convokeProofFor } from "../actions.js";
import type { LegalAction } from "../actions.js";
import { candidateActions } from "../bot/candidates.js";
import { createDefaultRegistry } from "../cards.js";
import { HeuristicBotController, RandomController } from "../controller.js";
import type { ControllerView } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId, createRng } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";

/**
 * Convoke paying for {X} (rule 702.51a: each creature tapped pays {1} or one
 * mana of its colour, and X is part of the total cost once chosen, rule
 * 601.2f). Chord of Calling is {X}{G}{G}{G}: "Search your library for a
 * creature card with mana value X or less, put it onto the battlefield, then
 * shuffle." Serra Angel is white, Grizzly Bears green; Soldier tokens are
 * white.
 */

const A = asPlayerId("alice");
const B = asPlayerId("bob");

function mkGame(): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    decks: [A, B].map((player) => ({ player, cards: Array(60).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

function spawn(game: Game, name: string, player: PlayerId = A): ObjectId {
  return game.debugSpawn(name, player, "battlefield", { summoningSick: false });
}

function forests(game: Game, n: number): ObjectId[] {
  return Array.from({ length: n }, () => spawn(game, "Forest"));
}

function soldiers(game: Game, count: number): ObjectId {
  game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count });
  const stack = game.state.zones.shared.battlefield.find(
    (id) => game.state.objects[id].cardName === "Soldier Token",
  );
  if (stack === undefined || (game.state.objects[stack].stackCount ?? 1) !== count) {
    throw new Error(`expected one stack of ${count} Soldier Tokens`);
  }
  return stack;
}

type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;

function castOffer(game: Game, card: ObjectId): CastOffer | undefined {
  return game
    .legalActions(A)
    .find((a): a is CastOffer => a.kind === "cast-spell" && a.card === card);
}

/** Pass until Chord resolves into its search, then take `pick`. */
function resolveSearch(game: Game, pick: ObjectId): readonly ObjectId[] {
  game.advanceUntil((s) => s.awaiting?.kind === "choose-from-zone");
  const awaiting = game.state.awaiting;
  if (awaiting?.kind !== "choose-from-zone") throw new Error("expected the search");
  const eligible = awaiting.eligible;
  game.dispatch({ type: "choose-from-zone", player: A, chosen: [pick] });
  return eligible;
}

describe("convoke paying for X — Chord of Calling", () => {
  it("casts for X=3 on GGG from lands and three convoking creatures", () => {
    const game = mkGame();
    const lands = forests(game, 3);
    const angels = [spawn(game, "Serra Angel"), spawn(game, "Serra Angel"), spawn(game, "Serra Angel")];
    const giant = game.debugSpawn("Hill Giant", A, "library"); // mana value 4
    const bears = game.debugSpawn("Grizzly Bears", A, "library"); // 2
    const wall = game.debugSpawn("Wall of Wood", A, "library"); // 1
    const craw = game.debugSpawn("Craw Wurm", A, "library"); // 6
    const chord = game.debugSpawn("Chord of Calling", A, "hand");

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: chord,
      targets: [],
      xValue: 3,
      convoke: angels.map((creature) => ({ creature })),
    });
    for (const id of [...lands, ...angels]) expect(game.state.objects[id].tapped).toBe(true);
    expect(game.state.objects[chord].zone).toBe("stack");
    expect(game.state.objects[chord].xValue).toBe(3);

    const eligible = resolveSearch(game, bears);
    // "Mana value X or less": the X the spell was cast for, not 0.
    expect(eligible).toContain(bears);
    expect(eligible).toContain(wall);
    expect(eligible).not.toContain(giant);
    expect(eligible).not.toContain(craw);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  it("offers X as far as the creatures that could convoke reach", () => {
    const game = mkGame();
    forests(game, 3);
    const chord = game.debugSpawn("Chord of Calling", A, "hand");
    expect(castOffer(game, chord)?.xCost?.maxX).toBe(0);

    spawn(game, "Serra Angel");
    spawn(game, "Serra Angel");
    spawn(game, "Grizzly Bears");
    const offer = castOffer(game, chord);
    expect(offer?.xCost?.maxX).toBe(3);
    expect(offer?.convoke?.maxCreatures).toBe(6);
    expect(offer?.convoke?.xProof?.atX).toBe(3);
  });

  it("counts every token of a stack towards X", () => {
    const game = mkGame();
    forests(game, 5);
    const stack = soldiers(game, 9);
    const chord = game.debugSpawn("Chord of Calling", A, "hand");
    const offer = castOffer(game, chord);
    // GGG and 2 more from the Forests, 9 more from the Soldiers.
    expect(offer?.xCost?.maxX).toBe(11);

    const convoke = offer?.convoke;
    if (convoke === undefined) throw new Error("expected a convoke offer");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: chord,
      targets: [],
      xValue: 11,
      convoke: convokeProofFor(convoke, 11),
    });
    expect(game.state.objects[chord].zone).toBe("stack");
    const tapped = game.state.zones.shared.battlefield
      .map((id) => game.state.objects[id])
      .filter((o) => o.cardName === "Soldier Token" && o.tapped)
      .reduce((n, o) => n + (o.stackCount ?? 1), 0);
    expect(tapped).toBe(9);
    expect(game.state.objects[stack]).toBeDefined();
  });

  it("proves a payment for every X on offer, not just the largest", () => {
    for (let x = 0; x <= 5; x += 1) {
      const game = mkGame();
      forests(game, 4);
      spawn(game, "Grizzly Bears");
      soldiers(game, 9);
      spawn(game, "Llanowar Elves");
      const chord = game.debugSpawn("Chord of Calling", A, "hand");
      const offer = castOffer(game, chord);
      expect(offer?.xCost?.maxX).toBe(12);
      const convoke = offer?.convoke;
      if (convoke === undefined) throw new Error("expected a convoke offer");
      const payment = convokeProofFor(convoke, x * 2);
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: chord,
        targets: [],
        xValue: x * 2,
        ...(payment.length > 0 ? { convoke: payment } : {}),
      });
      expect(game.state.objects[chord].zone).toBe("stack");
    }
  });

  it("rejects an X the lands and creatures can't reach, changing nothing", () => {
    const game = mkGame();
    const lands = forests(game, 3);
    const angels = [spawn(game, "Serra Angel"), spawn(game, "Serra Angel"), spawn(game, "Serra Angel")];
    const chord = game.debugSpawn("Chord of Calling", A, "hand");

    const cast = (xValue: number) =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: chord,
        targets: [],
        xValue,
        convoke: angels.map((creature) => ({ creature })),
      });
    // Refused on the cost at X=4, not because the creatures overpay X=0.
    expect(() => cast(4)).toThrow(/cannot pay the cost/);
    expect(game.state.objects[chord].zone).toBe("hand");
    for (const id of [...lands, ...angels]) expect(game.state.objects[id].tapped).toBe(false);
    // Three creatures can't all convoke for X=2 either: one would have
    // nothing left to pay.
    expect(() => cast(2)).toThrow(/nothing left to pay/);
  });

  it("lets a green creature pay a {G} pip while another pays for X", () => {
    const game = mkGame();
    const lands = forests(game, 2);
    const bears = spawn(game, "Grizzly Bears");
    const angel = spawn(game, "Serra Angel");
    const chord = game.debugSpawn("Chord of Calling", A, "hand");
    expect(castOffer(game, chord)?.xCost?.maxX).toBe(1);

    // A white creature can't pay green.
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: chord,
        targets: [],
        xValue: 1,
        convoke: [
          { creature: angel, pays: "G" },
          { creature: bears, pays: "generic" },
        ],
      }),
    ).toThrow();

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: chord,
      targets: [],
      xValue: 1,
      convoke: [
        { creature: bears, pays: "G" },
        { creature: angel, pays: "generic" },
      ],
    });
    for (const id of [...lands, bears, angel]) expect(game.state.objects[id].tapped).toBe(true);
    expect(game.state.objects[chord].xValue).toBe(1);
  });

  describe("every driver builds a cast the engine accepts", () => {
    // X above 0 is affordable only by convoking the Angels.
    function board(): { game: Game; chord: ObjectId } {
      const game = mkGame();
      forests(game, 3);
      for (let i = 0; i < 3; i += 1) spawn(game, "Serra Angel");
      return { game, chord: game.debugSpawn("Chord of Calling", A, "hand") };
    }
    const chordOnly = (game: Game, chord: ObjectId): ControllerView => ({
      state: game.state,
      player: A,
      legalActions: () => [castOffer(game, chord)].filter((a) => a !== undefined),
    });

    it("the fuzzer, at whatever X it draws", () => {
      const xs = new Set<number>();
      for (let seed = 1; seed <= 24; seed += 1) {
        const { game, chord } = board();
        const rng = createRng(seed);
        const action = new RandomController(A, () => rng.next()).act(chordOnly(game, chord));
        if (action.type !== "cast-spell") throw new Error("expected a cast");
        xs.add(action.xValue ?? 0);
        game.dispatch(action);
        expect(game.state.objects[chord].zone).toBe("stack");
      }
      expect(xs).toContain(3);
    });

    it("v1, at the largest X", () => {
      const { game, chord } = board();
      const action = new HeuristicBotController(A, createDefaultRegistry()).act(chordOnly(game, chord));
      expect(action).toMatchObject({ type: "cast-spell", card: chord, xValue: 3 });
      game.dispatch(action);
      expect(game.state.objects[chord].zone).toBe("stack");
    });

    it("the searching bots' candidates", () => {
      const first = board();
      const offer = castOffer(first.game, first.chord);
      if (offer === undefined) throw new Error("expected an offer");
      const actions = candidateActions(offer, A);
      expect(actions.length).toBeGreaterThan(0);
      for (const action of actions) {
        const { game, chord } = board();
        // Each fresh board mints the same ids, so the action fits it.
        game.dispatch({ ...action, card: chord } as typeof action);
        expect(game.state.objects[chord].zone).toBe("stack");
      }
    });
  });
});
