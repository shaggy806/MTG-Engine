/**
 * Three engine changes and the cards that needed them.
 *
 * **{X} in a spell's mana value (rule 202.3e).** On the stack a Fireball cast
 * for 3 is a mana value 4 spell, both to a filter and to `{ manaValueOf }`
 * (Kaervek's "damage equal to that spell's mana value"). Once it has left
 * the stack it is read by last-known information *as a spell* (rule 608.2h)
 * — Mana Drain's "that spell's mana value" includes the X of the spell it
 * countered — but only through a target that was a spell: Reanimate, which
 * targets a card in a graveyard, reads a Stonecoil Serpent as its printed
 * mana value 0 whatever X it was once cast for. Mana Drain's "your next main
 * phase" is the next one of yours to begin (its 2020-11-10 ruling): this
 * turn's postcombat main when cast in your precombat main, your next turn's
 * precombat main when cast on someone else's turn.
 *
 * **"That much" life.** Gain- and lose-life triggers carry how much, and a
 * lifelink source dealing damage to several things at once gains life once
 * (the Sanguine Bond / Vito rulings), so their triggers fire once per event.
 *
 * **A CDA works in every zone (rule 604.3)** — Psychosis Crawler's P/T is
 * its owner's hand size in a library, too.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { ScriptedController } from "../controller.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { poolCounts } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = [], bHand: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bHand, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in ${player}'s hand`);
  return id;
};
const lands = (game: Game, player: PlayerId, names: readonly string[]): void => {
  for (const name of names) game.debugSpawn(name, player, "battlefield");
};
const colorless = (game: Game, player: PlayerId): number =>
  poolCounts(game.state.players[player].manaPool).C;
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
/** Cast `name` with `targets`, stopping as soon as it's on the stack with
 * its caster holding priority — so a response can go on top of it. */
const castAndHold = (
  game: Game,
  player: PlayerId,
  name: string,
  targets: readonly ({ kind: "object"; object: ObjectId } | { kind: "player"; player: PlayerId })[],
  xValue?: number,
): ObjectId => {
  const card = inHand(game, player, name);
  game.dispatch({ type: "cast-spell", player, card, targets: [...targets], ...(xValue !== undefined ? { xValue } : {}) });
  return card;
};

describe("Mana Drain", () => {
  it("counters an X spell and later adds {C} equal to its mana value with X", () => {
    const { game } = setUp(["Fireball", "Mana Drain"]);
    lands(game, A, ["Mountain", "Mountain", "Mountain", "Mountain", "Island", "Island"]);
    const fireball = castAndHold(game, A, "Fireball", [{ kind: "player", player: B }], 3);
    // Fireball for 3 on the stack is a mana value 4 spell to a filter too.
    expect(matchesFilter(game.state, registry, fireball, { manaValue: { op: "eq", n: 4 } }, { you: A })).toBe(true);
    castAndHold(game, A, "Mana Drain", [{ kind: "object", object: fireball }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[fireball].zone).toBe("graveyard");
    expect(life(game, B)).toBe(20);

    // Cast in Alice's precombat main: the next main phase is this turn's
    // postcombat main.
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.turn.number).toBe(1);
    expect(colorless(game, A)).toBe(4);
  });

  it("pays out a spell's printed mana value when it has no X", () => {
    const { game } = setUp(["Grizzly Bears", "Mana Drain"]);
    lands(game, A, ["Forest", "Forest", "Island", "Island"]);
    const bears = castAndHold(game, A, "Grizzly Bears", []);
    castAndHold(game, A, "Mana Drain", [{ kind: "object", object: bears }]);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(colorless(game, A)).toBe(2);
  });

  it("still pays out when the spell can't be countered", () => {
    const { game } = setUp(["Carnage Tyrant", "Mana Drain"]);
    lands(game, A, ["Forest", "Forest", "Forest", "Forest", "Forest", "Forest", "Island", "Island"]);
    const tyrant = castAndHold(game, A, "Carnage Tyrant", []);
    castAndHold(game, A, "Mana Drain", [{ kind: "object", object: tyrant }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[tyrant].zone).toBe("battlefield");
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(colorless(game, A)).toBe(6);
  });

  it("cast on an opponent's turn, pays out at your next precombat main", () => {
    const { game, a } = setUp(["Mana Drain"], ["Grizzly Bears"]);
    lands(game, A, ["Island", "Island"]);
    lands(game, B, ["Forest", "Forest"]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    const bears = inHand(game, B, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: B, card: bears });
    // Bob passes with Bears on the stack; Alice answers with Mana Drain.
    game.dispatch({ type: "pass-priority", player: B });
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Mana Drain"),
      targets: [{ kind: "object", object: bears }],
    });
    void a;
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    // Nothing during Bob's turn, including his postcombat main.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main");
    expect(colorless(game, A)).toBe(0);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    expect(colorless(game, A)).toBe(2);
  });
});

describe("mana value with X, read as last known", () => {
  it("a card targeted in a graveyard is read as printed, whatever X it was cast for", () => {
    const { game } = setUp(["Stonecoil Serpent", "Mana Drain", "Reanimate"]);
    lands(game, A, [...Array<string>(4).fill("Forest"), "Island", "Island", "Swamp"]);
    const serpent = castAndHold(game, A, "Stonecoil Serpent", [], 4);
    castAndHold(game, A, "Mana Drain", [{ kind: "object", object: serpent }]);
    game.advanceUntil(quiet);
    expect(game.state.objects[serpent].zone).toBe("graveyard");
    const before = life(game, A);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, A, "Reanimate"),
      targets: [{ kind: "object", object: serpent }],
    });
    const entries = () =>
      game.state.eventLog.filter((e) => e.type === "permanent-entered-battlefield" && e.object === serpent)
        .length;
    const enteredBefore = entries();
    game.advanceUntil(quiet);
    // Reanimated (it then dies at once: X is 0 now, so it's a 0/0).
    expect(entries()).toBe(enteredBefore + 1);
    // Stonecoil Serpent's printed mana value is 0 ({X}): Reanimate costs
    // no life, not the 4 it was once cast for.
    expect(life(game, A)).toBe(before);
  });

  it("a cast trigger reading the spell's mana value sees its X", () => {
    const { game } = setUp([], ["Fireball"]);
    game.debugSpawn("Kaervek the Merciless", A, "battlefield");
    lands(game, B, ["Mountain", "Mountain", "Mountain"]);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: inHand(game, B, "Fireball"),
      targets: [{ kind: "player", player: A }],
      xValue: 2,
    });
    game.advanceUntil(quiet);
    // Kaervek deals 3 (Fireball for 2 is mana value 3) to whatever it
    // targets; the default chooser picks the first legal target. Either way,
    // 3 damage went somewhere, not 1.
    const kaervekDamage = game.state.eventLog.filter(
      (e) => e.type === "damage-dealt" && game.state.objects[e.source]?.cardName === "Kaervek the Merciless",
    );
    expect(kaervekDamage.map((e) => (e.type === "damage-dealt" ? e.amount : 0))).toEqual([3]);
  });
});

describe("life-change amounts", () => {
  it("Sanguine Bond drains as much as you gained", () => {
    const { game } = setUp();
    game.debugSpawn("Sanguine Bond", A, "battlefield");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
  });

  it("a trampling lifelinker hitting a blocker and the player gains once, so it triggers once", () => {
    const { game, a, b } = setUp();
    const bond = game.debugSpawn("Sanguine Bond", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield", { summoningSick: false });
    for (const keyword of ["lifelink", "trample"] as const) {
      game.debugApplyEffect(A, { kind: "grant-keyword", target: 0, keyword, duration: "end-of-turn" }, [
        { kind: "object", object: bears },
      ]);
    }
    const blocker = game.debugSpawn("Llanowar Elves", B, "battlefield", { summoningSick: false });
    a.declareAttackersFn = () => [{ attacker: bears, defender: B }];
    b.declareBlockersFn = () => [{ blocker, attacker: bears }];
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    // 1 to the Elves, 1 tramples over: one gain of 2, one trigger.
    const gains = game.state.eventLog.filter(
      (e) => e.type === "life-changed" && e.player === A && e.delta > 0,
    );
    expect(gains.map((e) => (e.type === "life-changed" ? e.delta : 0))).toEqual([2]);
    const triggers = game.state.eventLog.filter((e) => e.type === "ability-triggered" && e.source === bond);
    expect(triggers).toHaveLength(1);
    expect(life(game, B)).toBe(20 - 1 - 2);
  });

  it("Exquisite Blood gains as much as an opponent lost", () => {
    const { game } = setUp();
    game.debugSpawn("Exquisite Blood", A, "battlefield");
    game.debugApplyEffect(A, { kind: "lose-life", amount: 4, who: "each-opponent" });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(24);
    // Your own life loss doesn't count.
    game.debugApplyEffect(A, { kind: "lose-life", amount: 2 });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(22);
  });

  it("Vito drains on life gain and gives your creatures lifelink", () => {
    const { game } = setUp();
    const vito = game.debugSpawn("Vito, Thorn of the Dusk Rose", A, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    lands(game, A, ["Swamp", "Swamp", "Island", "Island", "Island"]);
    game.debugApplyEffect(A, { kind: "gain-life", amount: 2 });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(18);
    game.dispatch({ type: "activate-ability", player: A, source: vito, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(game.characteristics(bears).keywords.has("lifelink")).toBe(true);
    expect(game.characteristics(vito).keywords.has("lifelink")).toBe(true);
    expect(game.characteristics(theirs).keywords.has("lifelink")).toBe(false);
  });
});

describe("Psychosis Crawler", () => {
  it("is as big as your hand, in play and in the library", () => {
    const { game } = setUp();
    const crawler = game.debugSpawn("Psychosis Crawler", A, "battlefield");
    const hand = game.handOf(A).length;
    const c = computeCharacteristics(game.state, registry, crawler);
    expect([c.power, c.toughness]).toEqual([hand, hand]);
    const inLibrary = game.debugSpawn("Psychosis Crawler", A, "library");
    expect(computeCharacteristics(game.state, registry, inLibrary).power).toBe(hand);
  });

  it("each card you draw costs each opponent 1 life; an opponent's draw doesn't", () => {
    const { game } = setUp();
    game.debugSpawn("Psychosis Crawler", A, "battlefield");
    game.debugApplyEffect(A, { kind: "draw", amount: 3 });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
    game.debugApplyEffect(B, { kind: "draw", amount: 1 });
    game.advanceUntil(quiet);
    expect(life(game, B)).toBe(17);
  });
});
