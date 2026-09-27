/**
 * v1's answers beyond targeting (`docs/plans/bot-effect-knowledge.md`, step 3,
 * "v1.5's other choices"): a "you may", a punisher's "unless", which
 * permanent to sacrifice, which card to discard and which ability to
 * activate, each read off what the effect does to the bot
 * (`effect-worth.ts`) where v1 used to decline, take the front of the list
 * or activate whatever came first.
 */

import { describe, expect, it } from "vitest";

import { HeuristicBotController } from "../controller.js";
import type { ControllerView } from "../controller.js";
import { effectWorth } from "../effect-worth.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

function newGame(maxLandsPerTurn = 99): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn, maxHandSize: 99 },
    controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
    decks: [
      { player: A, cards: Array(40).fill("Island") },
      { player: B, cards: Array(40).fill("Swamp") },
    ],
  });
  game.advanceUntil(toPrecombat);
  return game;
}

const on = (game: Game, player: PlayerId, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id]?.cardName === name && game.state.objects[id]?.controller === player,
  );

const lands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) game.debugSpawn(name, player, "battlefield");
};

const viewOf = (game: Game, player: PlayerId): ControllerView => ({
  state: game.state,
  player,
  legalActions: () => game.legalActions(player),
});

describe("a v1 bot's \"you may\"", () => {
  it("draws the card Aven Fisher offers as it dies", () => {
    const game = newGame();
    lands(game, A, "Swamp", 3);
    const fisher = game.debugSpawn("Aven Fisher", A, "battlefield");
    const murder = game.debugSpawn("Murder", A, "hand");
    const hand = game.state.zones.perPlayer[A].hand.length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: murder,
      targets: [{ kind: "object", object: fisher }],
    });
    game.advanceUntil(quiet);
    // Murder left the hand, the Fisher's card came in.
    expect(game.state.zones.perPlayer[A].hand.length).toBe(hand);
  });

  it("declines Angler Drake's bounce when the only target was its own creature", () => {
    const game = newGame();
    lands(game, A, "Island", 6);
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const drake = game.debugSpawn("Angler Drake", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: drake, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears]?.zone).toBe("battlefield");
    expect(on(game, A, "Angler Drake")).toHaveLength(1);
  });

  it("bounces an opponent's creature with the same trigger", () => {
    const game = newGame();
    lands(game, A, "Island", 6);
    const theirs = game.debugSpawn("Craw Wurm", B, "battlefield");
    const drake = game.debugSpawn("Angler Drake", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: drake, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs]?.zone).toBe("hand");
  });

  it("pays Rhystic Study's {1} rather than let its owner draw", () => {
    const game = newGame();
    game.debugSpawn("Rhystic Study", B, "battlefield");
    lands(game, A, "Island", 2);
    const divination = game.debugSpawn("Opt", A, "hand");
    const bobHand = game.state.zones.perPlayer[B].hand.length;
    game.dispatch({ type: "cast-spell", player: A, card: divination, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.zones.perPlayer[B].hand.length).toBe(bobHand);
    expect(on(game, A, "Island").every((id) => game.state.objects[id].tapped)).toBe(true);
  });
});

describe("a v1 bot's sacrifices, discards and activations", () => {
  it("gives the edict its cheapest creature, not its oldest", () => {
    const game = newGame();
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    const elves = game.debugSpawn("Llanowar Elves", B, "battlefield");
    lands(game, A, "Swamp", 2);
    const edict = game.debugSpawn("Diabolic Edict", A, "hand");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: edict,
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[wurm]?.zone).toBe("battlefield");
    expect(game.state.objects[elves]?.zone).toBe("graveyard");
  });

  it("discards the eighth land, not the spell the board can cast", () => {
    const game = newGame();
    lands(game, A, "Island", 8);
    const bot = new HeuristicBotController(A);
    const forest = game.debugSpawn("Forest", A, "hand");
    const wurm = game.debugSpawn("Craw Wurm", A, "hand");
    const hand = [wurm, forest].map((id) => game.state.objects[id]);
    expect(bot.chooseDiscards(hand, 1, viewOf(game, A))).toEqual([forest]);
    // Short of lands, the land stays and the spell out of reach goes.
    const early = newGame();
    lands(early, A, "Island", 2);
    const land = early.debugSpawn("Forest", A, "hand");
    const big = early.debugSpawn("Craw Wurm", A, "hand");
    const earlyHand = [land, big].map((id) => early.state.objects[id]);
    expect(bot.chooseDiscards(earlyHand, 1, viewOf(early, A))).toEqual([big]);
  });

  it("never feeds a creature to Viscera Seer for a scry", () => {
    // One land a turn, and it's played: the Seer is all there is to do.
    const game = newGame(0);
    game.debugSpawn("Viscera Seer", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const action = new HeuristicBotController(A).act(viewOf(game, A));
    expect(action.type).toBe("pass-priority");
    expect(game.state.objects[bears]?.zone).toBe("battlefield");
  });
});

describe("effectWorth", () => {
  it("reads a draw as good for its drawer and bad for the rest", () => {
    const game = newGame();
    const draw = { kind: "draw", amount: 1 } as const;
    const ctx = { state: game.state, targets: [] };
    expect(effectWorth(draw, { ...ctx, me: A, controller: A })).toBeGreaterThan(0);
    expect(effectWorth(draw, { ...ctx, me: A, controller: B })).toBeLessThan(0);
  });

  it("prices exiling a card from a graveyard as a nibble, not removal", () => {
    // Scavenging Ooze's exile outranked Vitu-Ghazi's token when `exile`'s
    // decisive weight applied to a graveyard card as to a permanent.
    const game = newGame();
    const card = game.debugSpawn("Grizzly Bears", B, "graveyard");
    const permanent = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const exile = { kind: "exile", target: 0 } as const;
    const worth = (object: ObjectId): number =>
      effectWorth(exile, {
        state: game.state,
        me: A,
        controller: A,
        targets: [{ kind: "object", object }],
      });
    const token = effectWorth(
      { kind: "create-token", token: "Saproling Token", count: 1 },
      { state: game.state, me: A, controller: A, targets: [] },
    );
    expect(worth(card)).toBeGreaterThan(0);
    expect(worth(card)).toBeLessThan(token);
    expect(worth(permanent)).toBeGreaterThan(worth(card));
  });

  it("reads a draw from a library too small as losing", () => {
    const game = newGame();
    const draw = { kind: "draw", amount: 99 } as const;
    expect(
      effectWorth(draw, { state: game.state, targets: [], me: A, controller: A }),
    ).toBeLessThan(-10);
  });
});
