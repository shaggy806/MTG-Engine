/**
 * Elsha, Threefold Master — {U}{R}{W} 1/1 legendary Djinn Monk:
 *   Trample
 *   Prowess
 *   Whenever Elsha deals combat damage to a player, create that many 1/1 white
 *   Monk creature tokens with prowess.
 *
 * Each clause is checked, plus the negatives that say what the card must *not*
 * do: prowess is noncreature-only, the saboteur trigger is Elsha's own
 * ("self", not "a creature you control"), and it reads damage dealt *to a
 * player*, so a blocked Elsha whose whole power the blocker soaks mints
 * nothing.
 *
 * The batch-prowess case shipped as an `it.fails` naming an engine bug this
 * card's review turned up (one `PtModifier[]` shared by a whole token batch);
 * that bug is fixed and the case is an ordinary test now.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const registry = createDefaultRegistry();

const mkGame = (aHand: readonly string[]) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array(40).fill("Forest")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0;

const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const powerOf = (game: Game, id: ObjectId): number =>
  computeCharacteristics(game.state, registry, id).power;
const monksOf = (game: Game, player: PlayerId): readonly ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === "Monk Token" &&
      game.state.objects[id].controller === player,
  );

/** Elsha on the battlefield, ready to attack, with mana up. */
const setUp = (aHand: readonly string[]) => {
  const { game, a, b } = mkGame(aHand);
  game.advanceUntil(toPrecombat);
  const elsha = game.debugSpawn("Elsha, Threefold Master", A, "battlefield", {
    summoningSick: false,
  });
  for (let i = 0; i < 4; i += 1) game.debugSpawn("Forest", A, "battlefield");
  return { game, a, b, elsha };
};

describe("Elsha, Threefold Master", () => {
  it("has trample and prowess, and mints a Monk per point of combat damage", () => {
    const { game, a, elsha } = setUp(["Sol Ring"]);

    expect(computeCharacteristics(game.state, registry, elsha).keywords).toContain("trample");
    expect(powerOf(game, elsha)).toBe(1);

    // Prowess: a noncreature spell pumps Elsha to 2/2 before combat.
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring") });
    game.advanceUntil(quiet);
    expect(powerOf(game, elsha)).toBe(2);

    a.declareAttackersFn = () => [{ attacker: elsha, defender: B }];
    game.advanceUntil(toPostcombat);
    game.advanceUntil(quiet);

    // 2 combat damage to Bob -> "that many" = two Monk tokens.
    expect(game.state.players[B].life).toBe(game.state.rules.startingLife - 2);
    const monks = monksOf(game, A);
    expect(monks).toHaveLength(2);

    // They are 1/1 white Monk tokens.
    for (const monk of monks) {
      const c = computeCharacteristics(game.state, registry, monk);
      expect(c.power).toBe(1);
      expect(c.toughness).toBe(1);
      expect([...c.colors]).toEqual(["W"]);
      expect(c.subtypes).toContain("Monk");
      expect(game.state.objects[monk].isToken).toBe(true);
    }
  });

  it("a single Monk has prowess of its own", () => {
    // One point of damage -> a batch of exactly one token, which sidesteps the
    // batch-sharing bug the `it.fails` case below pins down.
    const { game, a, elsha } = setUp(["Sol Ring"]);
    a.declareAttackersFn = () => [{ attacker: elsha, defender: B }];
    game.advanceUntil(toPostcombat);
    game.advanceUntil(quiet);

    const monks = monksOf(game, A);
    expect(monks).toHaveLength(1);
    expect(powerOf(game, monks[0])).toBe(1);

    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring") });
    game.advanceUntil(quiet);
    expect(powerOf(game, monks[0])).toBe(2);
  });

  it("each Monk of a batch gets its own +1/+1 from prowess", () => {
    // This was an `it.fails` when the card was authored, pinning an engine bug
    // it had found: `mintFreshTokenObject` stored the `PtModifier[]` it was
    // handed by reference while `createTokens` passed one array to a whole
    // batch, so every token of a batch shared one modifier list and a single
    // prowess trigger pumped all of them. Fixed by copying per object.
    const { game, a, elsha } = setUp(["Sol Ring", "Sol Ring"]);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring") });
    game.advanceUntil(quiet);

    a.declareAttackersFn = () => [{ attacker: elsha, defender: B }];
    game.advanceUntil(toPostcombat);
    game.advanceUntil(quiet);

    const monks = monksOf(game, A);
    expect(monks).toHaveLength(2);

    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Sol Ring") });
    game.advanceUntil(quiet);
    for (const monk of monks) expect(powerOf(game, monk)).toBe(2);
  });

  it("does not trigger prowess on a creature spell", () => {
    const { game, elsha } = setUp(["Grizzly Bears"]);

    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Grizzly Bears") });
    game.advanceUntil(quiet);

    expect(powerOf(game, elsha)).toBe(1);
  });

  it("does not mint Monks for another creature's combat damage", () => {
    const { game, a } = mkGame([]);
    const elsha = game.debugSpawn("Elsha, Threefold Master", A, "battlefield", {
      summoningSick: false,
    });
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield", { summoningSick: false });
    // Only the Wurm attacks; Elsha stays home. The trigger is "self", not
    // "a creature you control", so six damage from the Wurm mints nothing.
    a.declareAttackersFn = () => [{ attacker: wurm, defender: B }];

    game.advanceUntil(toPrecombat);
    game.advanceUntil(toPostcombat);
    game.advanceUntil(quiet);

    expect(game.state.players[B].life).toBe(game.state.rules.startingLife - 6);
    expect(monksOf(game, A)).toHaveLength(0);
    expect(powerOf(game, elsha)).toBe(1);
  });

  it("mints nothing when a blocker soaks all of Elsha's damage", () => {
    const { game, a, b } = mkGame([]);
    const elsha = game.debugSpawn("Elsha, Threefold Master", A, "battlefield", {
      summoningSick: false,
    });
    const bear = game.debugSpawn("Grizzly Bears", B, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: elsha, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bear, attacker: elsha }];

    game.advanceUntil(toPrecombat);
    game.advanceUntil(toPostcombat);
    game.advanceUntil(quiet);

    // A 1/1 trampler assigns all 1 damage as lethal to a 2/2 blocker: nothing
    // tramples through, so no combat damage reaches Bob and no Monk is made.
    expect(game.state.players[B].life).toBe(game.state.rules.startingLife);
    expect(monksOf(game, A)).toHaveLength(0);
  });
});
