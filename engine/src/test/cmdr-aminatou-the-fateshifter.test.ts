/**
 * Aminatou, the Fateshifter — {W}{U}{B} legendary planeswalker, loyalty 3:
 *   +1: Draw a card, then put a card from your hand on top of your library.
 *   −1: Exile another target permanent you own, then return it to the
 *   battlefield under your control.
 *   −6: Choose left or right. Each player gains control of all nonland
 *   permanents other than Aminatou controlled by the next player in the
 *   chosen direction.
 *   Aminatou, the Fateshifter can be your commander.
 *
 * - the +1 puts back a card of the player's choosing;
 * - the −1 reaches a permanent you own that someone else controls, and what
 *   comes back is a new object; a token doesn't come back;
 * - the −6's direction is chosen as it resolves; the change is lasting and
 *   simultaneous, lands and Aminatou stay put, and a player who leaves gives
 *   back what they got (rulings).
 */

import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { createDefaultRegistry } from "../cards.js";
import { canCommandAlone } from "../deck-validation.js";
import { Game } from "../game.js";
import { colorIdentityOf, identityString } from "../identity.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { TargetRef } from "../target.js";

const [A, B, C] = ["alice", "bob", "carol"].map(asPlayerId);
const AMINATOU = "Aminatou, the Fateshifter";
const registry = createDefaultRegistry();

function table(players: readonly PlayerId[] = [A, B, C]): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    registry,
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Plains") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const spawn = (game: Game, name: string, owner: PlayerId): ObjectId =>
  game.debugSpawn(name, owner, "battlefield", { summoningSick: false });
const controllerOf = (game: Game, id: ObjectId): PlayerId => game.state.objects[id].controller;

function check(game: Game): void {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(
    game.state.priority.holder ?? A,
  );
}

function knockOut(game: Game, p: PlayerId): void {
  game.state.players[p].life = 0;
  check(game);
  expect(game.state.players[p].hasLost).toBe(true);
}

/** Everyone passes until the top of the stack has resolved (or stopped to
 * ask something). */
function resolveTop(game: Game): void {
  const depth = game.state.zones.shared.stack.length;
  for (let i = 0; i < 12 && game.state.zones.shared.stack.length >= depth; i += 1) {
    const holder = game.state.priority.holder;
    if (holder === null || game.state.awaiting !== null) break;
    game.dispatch({ type: "pass-priority", player: holder });
  }
}

type AbilityOffer = Extract<LegalAction, { kind: "activate-ability" }>;
const offers = (game: Game, aminatou: ObjectId, index: number): AbilityOffer[] =>
  game
    .legalActions(A)
    .filter(
      (o): o is AbilityOffer => o.kind === "activate-ability" && o.source === aminatou && o.abilityIndex === index,
    );

function activate(game: Game, aminatou: ObjectId, index: number, targets: readonly TargetRef[] = []): void {
  game.dispatch({ type: "activate-ability", player: A, source: aminatou, abilityIndex: index, targets });
  resolveTop(game);
}

describe("Aminatou, the Fateshifter", () => {
  it("is a {W}{U}{B} legendary planeswalker with loyalty 3 that can be your commander", () => {
    const def = registry.get(AMINATOU);
    expect(def.manaCost).toBe("{W}{U}{B}");
    expect(def.supertypes).toEqual(["legendary"]);
    expect(def.types).toEqual(["planeswalker"]);
    expect(def.subtypes).toEqual(["Aminatou"]);
    expect(def.loyalty).toBe(3);
    expect(canCommandAlone(def)).toBe(true);
    expect(identityString(colorIdentityOf(def))).toBe("WUB");
  });

  it("+1: draws a card, then puts the card of your choice back on top", () => {
    const game = table();
    const aminatou = spawn(game, AMINATOU, A);
    expect(game.state.objects[aminatou].counters.loyalty).toBe(3);
    const bolt = game.debugSpawn("Lightning Bolt", A, "hand");
    const hand = game.handOf(A).length;
    activate(game, aminatou, 0);
    expect(game.state.objects[aminatou].counters.loyalty).toBe(4);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    expect(game.state.awaiting).toMatchObject({ kind: "choose-from-zone", player: A, min: 1, max: 1 });
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bolt] });
    expect(game.handOf(A)).toHaveLength(hand);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(bolt);
  });

  it("−1: blinks a permanent you own, even one someone else controls, back under your control", () => {
    const game = table();
    const aminatou = spawn(game, AMINATOU, A);
    const bears = spawn(game, "Grizzly Bears", A);
    const theirs = spawn(game, "Hill Giant", B);
    game.state.objects[bears].counters["+1/+1"] = 2;
    game.debugApplyEffect(B, { kind: "gain-control", target: 0, untilEndOfTurn: false }, [obj(bears)]);
    check(game);
    expect(controllerOf(game, bears)).toBe(B);

    const options = offers(game, aminatou, 1)[0]?.targetOptions?.[0] ?? [];
    expect(options).toContainEqual(obj(bears));
    expect(options).not.toContainEqual(obj(theirs));
    expect(options).not.toContainEqual(obj(aminatou));

    const stint = game.state.objects[bears].zoneChangeCount ?? 0;
    activate(game, aminatou, 1, [obj(bears)]);
    expect(game.state.objects[aminatou].counters.loyalty).toBe(2);
    expect(game.state.objects[bears]).toMatchObject({ zone: "battlefield", controller: A });
    // A new object: two zone changes on, its counters gone.
    expect(game.state.objects[bears].zoneChangeCount).toBe(stint + 2);
    expect(game.state.objects[bears].counters["+1/+1"]).toBeUndefined();
  });

  it("−1: a token exiled this way doesn't come back", () => {
    const game = table();
    const aminatou = spawn(game, AMINATOU, A);
    game.debugApplyEffect(A, { kind: "create-token", token: "Goblin Token", count: 1 });
    check(game);
    const goblin = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].cardName === "Goblin Token",
    )!;
    activate(game, aminatou, 1, [obj(goblin)]);
    check(game);
    expect(game.state.objects[goblin]).toBeUndefined();
  });

  describe("−6", () => {
    function ultimate(game: Game, aminatou: ObjectId, mode: number): void {
      game.state.objects[aminatou].counters.loyalty = 7;
      activate(game, aminatou, 2);
      expect(game.state.awaiting).toMatchObject({ kind: "choose-modes", player: A, minModes: 1, maxModes: 1 });
      game.dispatch({ type: "choose-modes", player: A, modes: [mode] });
      check(game);
    }

    const boards = (game: Game) => ({
      a: spawn(game, "Grizzly Bears", A),
      aLand: spawn(game, "Forest", A),
      b: spawn(game, "Hill Giant", B),
      bLand: spawn(game, "Mountain", B),
      c: spawn(game, "Mind Stone", C),
    });

    it("left: each player takes the next player's nonland permanents", () => {
      const game = table();
      const aminatou = spawn(game, AMINATOU, A);
      const had = boards(game);
      ultimate(game, aminatou, 0);
      expect(controllerOf(game, had.b)).toBe(A);
      expect(controllerOf(game, had.c)).toBe(B);
      expect(controllerOf(game, had.a)).toBe(C);
      expect(controllerOf(game, aminatou)).toBe(A);
      expect([controllerOf(game, had.aLand), controllerOf(game, had.bLand)]).toEqual([A, B]);
      expect(game.state.objects[aminatou].counters.loyalty).toBe(1);
    });

    it("right: each player takes the previous player's", () => {
      const game = table();
      const aminatou = spawn(game, AMINATOU, A);
      const had = boards(game);
      ultimate(game, aminatou, 1);
      expect(controllerOf(game, had.c)).toBe(A);
      expect(controllerOf(game, had.a)).toBe(B);
      expect(controllerOf(game, had.b)).toBe(C);
    });

    it("in a two-player game swaps everything but Aminatou and the lands", () => {
      const game = table([A, B]);
      const aminatou = spawn(game, AMINATOU, A);
      const mine = spawn(game, "Grizzly Bears", A);
      const theirs = spawn(game, "Hill Giant", B);
      ultimate(game, aminatou, 1);
      expect(controllerOf(game, mine)).toBe(B);
      expect(controllerOf(game, theirs)).toBe(A);
      expect(controllerOf(game, aminatou)).toBe(A);
    });

    it("lasts after Aminatou's controller leaves, bar what they'd been given", () => {
      const game = table();
      const aminatou = spawn(game, AMINATOU, A);
      const had = boards(game);
      ultimate(game, aminatou, 0);
      game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
      expect(controllerOf(game, had.c)).toBe(B);
      knockOut(game, A);
      // Bob keeps Carol's Mind Stone; Alice's hold on Bob's Giant ends.
      expect(controllerOf(game, had.c)).toBe(B);
      expect(controllerOf(game, had.b)).toBe(B);
    });
  });
});
