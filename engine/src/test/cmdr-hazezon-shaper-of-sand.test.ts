/**
 * Hazezon, Shaper of Sand — {R}{G}{W} legendary 3/3 Human Warrior.
 *
 *   Desertwalk
 *   You may play Desert lands from your graveyard.
 *   Whenever a Desert you control enters, create two 1/1 red, green, and white
 *   Sand Warrior creature tokens.
 *
 * Nothing new in the engine: the `desertwalk` landwalk keyword, Ramunap
 * Excavator's `playFromGraveyard` narrowed to Deserts, and a filtered
 * enters-the-battlefield trigger. Scavenger Grounds, the pool's first Desert,
 * was authored alongside him and is covered at the bottom.
 */

import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const HAZEZON = "Hazezon, Shaper of Sand";
const DESERT = "Scavenger Grounds";

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Swamp"),
];

/** A real land drop of one a turn, since the graveyard permission has to use
 * it. `aHand` goes at the top of Alice's deck, so it's her opening hand. */
const makeGame = (aHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: pad(aHand) },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil(toPrecombat);
  return { game, a, b };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const toPostcombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "postcombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const onBoard = (game: Game, name: string, who: PlayerId): ObjectId =>
  game.debugSpawn(name, who, "battlefield", { summoningSick: false });

const inHand = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((i) => game.state.objects[i].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};

const sandWarriors = (game: Game, who: PlayerId = A): ObjectId[] =>
  game.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === "Sand Warrior Token" &&
      game.state.objects[id].controller === who,
  );
/** Counting a token stack as every token in it, though two never make one. */
const sandWarriorCount = (game: Game, who: PlayerId = A): number =>
  sandWarriors(game, who).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);

const offersPlay = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((l) => l.kind === "play-land" && l.card === card);

describe("Hazezon, Shaper of Sand — desertwalk", () => {
  it("can't be blocked while the defending player controls a Desert", () => {
    const { game, a, b } = makeGame();
    const hazezon = onBoard(game, HAZEZON, A);
    onBoard(game, DESERT, B);
    const bears = onBoard(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: hazezon, defender: B }];
    // Bob would block if asked; with no creature able to, he isn't.
    b.declareBlockersFn = () => [{ blocker: bears, attacker: hazezon }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.characteristics(hazezon).keywords.has("desertwalk")).toBe(true);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.objects[bears].zone).toBe("battlefield");
  });

  // NEGATIVE: it's the *defending* player's Desert that matters.
  it("is blocked as usual when only Hazezon's controller has a Desert", () => {
    const { game, a, b } = makeGame();
    const hazezon = onBoard(game, HAZEZON, A);
    onBoard(game, DESERT, A);
    const bears = onBoard(game, "Grizzly Bears", B);
    a.declareAttackersFn = () => [{ attacker: hazezon, defender: B }];
    b.declareBlockersFn = () => [{ blocker: bears, attacker: hazezon }];

    game.advanceUntil(toPostcombat);
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[bears].zone).toBe("graveyard");
  });
});

describe("Hazezon, Shaper of Sand — play Desert lands from your graveyard", () => {
  it("offers a Desert in your graveyard as a land play, which uses the land drop", () => {
    const { game } = makeGame(["Forest"]);
    onBoard(game, HAZEZON, A);
    const desert = game.debugSpawn(DESERT, A, "graveyard");
    expect(offersPlay(game, desert)).toBe(true);

    game.dispatch({ type: "play-land", player: A, card: desert });
    game.advanceUntil(settled);

    expect(game.state.objects[desert].zone).toBe("battlefield");
    expect(game.state.players[A].landsPlayedThisTurn).toBe(1);
    expect(game.eventsOfType("land-played").some((e) => e.object === desert)).toBe(true);
    // The land drop is spent: the Forest in hand is no longer playable.
    expect(offersPlay(game, inHand(game, "Forest"))).toBe(false);
  });

  // The card's ruling: it doesn't change when you may play lands.
  it("isn't offered once the turn's land drop is used", () => {
    const { game } = makeGame(["Forest"]);
    onBoard(game, HAZEZON, A);
    const desert = game.debugSpawn(DESERT, A, "graveyard");
    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
    game.advanceUntil(settled);

    expect(offersPlay(game, desert)).toBe(false);
    expect(() => game.dispatch({ type: "play-land", player: A, card: desert })).toThrow();
  });

  it("isn't offered outside your own main phase", () => {
    const { game } = makeGame();
    onBoard(game, HAZEZON, A);
    const desert = game.debugSpawn(DESERT, A, "graveyard");
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");

    expect(game.activePlayer).toBe(B);
    expect(offersPlay(game, desert)).toBe(false);
  });

  // NEGATIVE: Deserts only.
  it("doesn't let you play a land that isn't a Desert from your graveyard", () => {
    const { game } = makeGame();
    onBoard(game, HAZEZON, A);
    const forest = game.debugSpawn("Forest", A, "graveyard");

    expect(offersPlay(game, forest)).toBe(false);
    expect(() => game.dispatch({ type: "play-land", player: A, card: forest })).toThrow();
  });

  // NEGATIVE: the permission is Hazezon's, so it goes when he does.
  it("isn't offered without Hazezon on the battlefield", () => {
    const { game } = makeGame();
    const desert = game.debugSpawn(DESERT, A, "graveyard");
    expect(offersPlay(game, desert)).toBe(false);
  });
});

describe("Hazezon, Shaper of Sand — Sand Warriors", () => {
  it("makes two 1/1 red, green and white Sand Warriors when you play a Desert", () => {
    const { game } = makeGame([DESERT]);
    onBoard(game, HAZEZON, A);

    game.dispatch({ type: "play-land", player: A, card: inHand(game, DESERT) });
    game.advanceUntil(settled);

    const tokens = sandWarriors(game);
    expect(sandWarriorCount(game)).toBe(2);
    for (const id of tokens) {
      const c = game.characteristics(id);
      expect([c.power, c.toughness]).toEqual([1, 1]);
      expect([...c.colors].sort()).toEqual(["G", "R", "W"]);
      expect(c.subtypes).toEqual(expect.arrayContaining(["Sand", "Warrior"]));
      expect(c.types).toEqual(["creature"]);
      expect(game.state.objects[id].isToken).toBe(true);
    }
  });

  it("makes them for a Desert replayed from the graveyard too", () => {
    const { game } = makeGame();
    onBoard(game, HAZEZON, A);
    const desert = game.debugSpawn(DESERT, A, "graveyard");

    game.dispatch({ type: "play-land", player: A, card: desert });
    game.advanceUntil(settled);

    expect(sandWarriorCount(game)).toBe(2);
  });

  // "Enters", not "is played": an effect putting a Desert onto the
  // battlefield counts too.
  it("makes them for a Desert put onto the battlefield by an effect", () => {
    const { game } = makeGame();
    onBoard(game, HAZEZON, A);
    game.debugSpawn(DESERT, A, "battlefield", { announceEntry: true });
    game.advanceUntil(settled);

    expect(sandWarriorCount(game)).toBe(2);
  });

  // NEGATIVE: another land entering.
  it("makes none for a land that isn't a Desert", () => {
    const { game } = makeGame(["Forest"]);
    onBoard(game, HAZEZON, A);

    game.dispatch({ type: "play-land", player: A, card: inHand(game, "Forest") });
    game.advanceUntil(settled);

    expect(sandWarriorCount(game)).toBe(0);
  });

  // NEGATIVE: "a Desert **you control**".
  it("makes none for a Desert entering under an opponent's control", () => {
    const { game } = makeGame();
    onBoard(game, HAZEZON, A);
    game.debugSpawn(DESERT, B, "battlefield", { announceEntry: true });
    game.advanceUntil(settled);

    expect(sandWarriorCount(game, A)).toBe(0);
    expect(sandWarriorCount(game, B)).toBe(0);
  });
});

describe("Scavenger Grounds", () => {
  const abilityOffers = (game: Game, grounds: ObjectId) =>
    game
      .legalActions(A)
      .filter((l) => l.kind === "activate-ability" && l.source === grounds);

  it("is a Desert land that taps for {C}", () => {
    const { game } = makeGame();
    const grounds = onBoard(game, DESERT, A);
    const c = game.characteristics(grounds);
    expect(c.types).toEqual(["land"]);
    expect(c.subtypes).toEqual(["Desert"]);

    const mana = abilityOffers(game, grounds).find(
      (l) => l.kind === "activate-ability" && l.abilityIndex === 0,
    );
    expect(mana).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: grounds, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["C"]);
  });

  it("exiles every graveyard, paying with any Desert you control — itself included", () => {
    const { game } = makeGame();
    const grounds = onBoard(game, DESERT, A);
    const otherDesert = onBoard(game, DESERT, A);
    const forest = onBoard(game, "Forest", A);
    onBoard(game, "Forest", A);
    onBoard(game, "Forest", A);
    const mine = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const theirs = game.debugSpawn("Lightning Bolt", B, "graveyard");

    const offer = abilityOffers(game, grounds).find(
      (l) => l.kind === "activate-ability" && l.abilityIndex === 1,
    );
    if (offer === undefined || offer.kind !== "activate-ability") {
      throw new Error("no exile ability offered");
    }
    // Both Deserts, and never the Forest.
    expect([...(offer.sacrifice?.choices ?? [])].sort()).toEqual([grounds, otherDesert].sort());
    expect(offer.sacrifice?.choices).not.toContain(forest);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: grounds,
      abilityIndex: 1,
      sacrifice: grounds,
    });
    game.advanceUntil(settled);

    expect(game.state.objects[mine].zone).toBe("exile");
    expect(game.state.objects[theirs].zone).toBe("exile");
    // The sacrificed Grounds hit the graveyard as a cost, so it went too.
    expect(game.state.objects[grounds].zone).toBe("exile");
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(0);
    expect(game.state.zones.perPlayer[B].graveyard).toHaveLength(0);
    expect(game.state.objects[otherDesert].zone).toBe("battlefield");
  });

  it("can sacrifice another Desert and stay on the battlefield", () => {
    const { game } = makeGame();
    const grounds = onBoard(game, DESERT, A);
    const otherDesert = onBoard(game, DESERT, A);
    onBoard(game, "Forest", A);
    onBoard(game, "Forest", A);

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: grounds,
      abilityIndex: 1,
      sacrifice: otherDesert,
    });
    game.advanceUntil(settled);

    expect(game.state.objects[grounds].zone).toBe("battlefield");
    expect(game.state.objects[grounds].tapped).toBe(true);
    expect(game.state.objects[otherDesert].zone).toBe("exile");
  });
});
