/**
 * What damaged a permanent this turn (`DamageHistory`): each source as it was
 * when it dealt the damage, and whether any of it was excess damage (rule
 * 120.4a — more than the lethal damage it needed: toughness less damage
 * already marked, or 1 from a deathtouch source; a planeswalker's loyalty) —
 * read by the `damagedThisTurnBy` and `excessDamageThisTurn` filter clauses,
 * and by a snapshot of one that has died. And the two commanders built on it.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { CardFilter } from "../filter.js";
import { matchesFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => {
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
  game.advanceUntil(quiet);
};
/** `by` deals damage equal to its power to `to` (a one-sided fight). */
const bite = (game: Game, by: ObjectId, to: ObjectId): void => {
  game.debugApplyEffect(game.state.objects[by].controller, { kind: "fight", a: 0, b: 1, oneSided: true }, [
    { kind: "object", object: by },
    { kind: "object", object: to },
  ]);
};
const is = (game: Game, id: ObjectId, filter: CardFilter, you: PlayerId = A): boolean =>
  matchesFilter(game.state, registry, id, filter, { you });
const tokens = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].isToken === true);

describe("damage history", () => {
  it("excess damage: more than toughness less what's marked", () => {
    const { game } = setUp();
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    // Craw Wurm deals 6 to a 3/3: 3 of it is excess.
    bite(game, wurm, giant);
    expect(is(game, giant, { excessDamageThisTurn: true })).toBe(true);
    // Exactly lethal isn't: Hill Giant deals 3 to another 3/3.
    const other = game.debugSpawn("Hill Giant", A, "battlefield");
    bite(game, giant, other);
    expect(is(game, other, { excessDamageThisTurn: true })).toBe(false);
  });

  it("from a deathtouch source, anything past 1", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "grant-keyword", target: 0, keyword: "deathtouch", duration: "end-of-turn" }, [
      { kind: "object", object: bears },
    ]);
    // 2 from a deathtouch source to a 6/4: 1 is lethal, 1 is excess.
    const big = game.debugSpawn("Craw Wurm", B, "battlefield");
    bite(game, bears, big);
    expect(is(game, big, { excessDamageThisTurn: true })).toBe(true);
    // 1 is exactly lethal.
    game.debugApplyEffect(A, { kind: "modify-pt", target: 0, power: -1, toughness: 0, duration: "end-of-turn" }, [
      { kind: "object", object: bears },
    ]);
    const other = game.debugSpawn("Craw Wurm", B, "battlefield");
    bite(game, bears, other);
    expect(is(game, other, { excessDamageThisTurn: true })).toBe(false);
  });

  it("counts what's already marked, and once it has lethal damage all of it is excess", () => {
    const { game } = setUp();
    // Maarika, indestructible on alice's turn, survives lethal damage.
    const maarika = game.debugSpawn("Maarika, Brutal Gladiator", A, "battlefield");
    bite(game, game.debugSpawn("Serra Angel", B, "battlefield"), maarika);
    expect(game.state.objects[maarika].damageMarked).toBe(4);
    expect(is(game, maarika, { excessDamageThisTurn: true })).toBe(false);
    bite(game, game.debugSpawn("Llanowar Elves", B, "battlefield"), maarika);
    expect(is(game, maarika, { excessDamageThisTurn: true })).toBe(true);
  });

  it("remembers each source as it was, and lasts only the turn", () => {
    const { game } = setUp();
    const spider = game.debugSpawn("Ancient Spider", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    bite(game, spider, wurm);
    expect(is(game, wurm, { damagedThisTurnBy: { subtype: "Spider", controlledBy: "you" } })).toBe(true);
    expect(is(game, wurm, { damagedThisTurnBy: { subtype: "Spider", controlledBy: "opponent" } })).toBe(false);
    expect(is(game, wurm, { damagedThisTurnBy: { subtype: "Goblin" } })).toBe(false);
    // The source dealt damage to another creature; the Wurm didn't.
    expect(is(game, spider, { dealtDamageToCreatureThisTurn: true })).toBe(true);
    expect(is(game, wurm, { dealtDamageToCreatureThisTurn: true })).toBe(false);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(is(game, wurm, { damagedThisTurnBy: { subtype: "Spider" } })).toBe(false);
    expect(is(game, spider, { dealtDamageToCreatureThisTurn: true })).toBe(false);
  });

  it("a permanent that left and came back is a new object with none (rule 400.7)", () => {
    const { game } = setUp();
    const spider = game.debugSpawn("Ancient Spider", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", B, "battlefield");
    bite(game, spider, wurm);
    game.debugApplyEffect(A, { kind: "flicker", target: 0 }, [{ kind: "object", object: wurm }]);
    expect(game.state.objects[wurm].zone).toBe("battlefield");
    expect(is(game, wurm, { damagedThisTurnBy: { subtype: "Spider" } })).toBe(false);
  });

  it("a planeswalker: more than its loyalty", () => {
    const { game } = setUp();
    const garruk = game.debugSpawn("Garruk Wildspeaker", B, "battlefield");
    const loyalty = game.state.objects[garruk].counters.loyalty ?? 0;
    game.debugApplyEffect(A, { kind: "damage", amount: loyalty, target: 0 }, [{ kind: "object", object: garruk }]);
    expect(game.state.objects[garruk].damageThisTurn?.excess).toBeUndefined();
    const other = game.debugSpawn("Garruk Wildspeaker", B, "battlefield");
    game.debugApplyEffect(A, { kind: "damage", amount: loyalty + 1, target: 0 }, [{ kind: "object", object: other }]);
    expect(game.state.objects[other].damageThisTurn?.excess).toBe(true);
  });
});

describe("Shelob, Child of Ungoliant", () => {
  it("a creature a Spider of yours damaged this turn dies: a Food copy of it", () => {
    const { game } = setUp();
    const shelob = game.debugSpawn("Shelob, Child of Ungoliant", A, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    bite(game, shelob, giant);
    settle(game);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    const [food] = tokens(game);
    expect(food).toBeDefined();
    expect(game.state.objects[food].controller).toBe(A);
    expect(nameOf(game.state.objects[food])).toBe("Hill Giant");
    const c = game.characteristics(food);
    expect(c.types).toEqual(["artifact"]);
    expect(c.subtypes).toEqual(["Food"]);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");
    expect(
      game
        .legalActions(A)
        .some((action) => action.kind === "activate-ability" && action.source === food && action.text.includes("gain 3 life")),
    ).toBe(true);
  });

  it("the copy loses its other subtypes too — a Goldhound's is no Treasure", () => {
    const { game } = setUp();
    const shelob = game.debugSpawn("Shelob, Child of Ungoliant", A, "battlefield");
    bite(game, shelob, game.debugSpawn("Goldhound", B, "battlefield"));
    settle(game);
    const [food] = tokens(game);
    expect(game.characteristics(food).subtypes).toEqual(["Food"]);
  });

  it("not for a creature damaged only by a non-Spider, or by an opponent's Spider", () => {
    const { game } = setUp();
    game.debugSpawn("Shelob, Child of Ungoliant", A, "battlefield");
    const wurm = game.debugSpawn("Craw Wurm", A, "battlefield");
    bite(game, wurm, game.debugSpawn("Hill Giant", B, "battlefield"));
    const theirs = game.debugSpawn("Ancient Spider", B, "battlefield");
    bite(game, theirs, game.debugSpawn("Grizzly Bears", A, "battlefield"));
    settle(game);
    expect(tokens(game)).toEqual([]);
  });

  it("gives other Spiders deathtouch and ward {2}", () => {
    const { game } = setUp();
    game.debugSpawn("Shelob, Child of Ungoliant", A, "battlefield");
    const spider = game.debugSpawn("Ancient Spider", A, "battlefield");
    const theirs = game.debugSpawn("Ancient Spider", B, "battlefield");
    expect(game.characteristics(spider).keywords.has("deathtouch")).toBe(true);
    expect(game.characteristics(theirs).keywords.has("deathtouch")).toBe(false);
    // Bob's Spider has no ward from it: alice's Bolt at it resolves.
    game.debugSpawn("Mountain", A, "battlefield");
    const mine = game.debugSpawn("Lightning Bolt", A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card: mine, targets: [{ kind: "object", object: theirs }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs].damageMarked).toBe(3);
    // Ward {2}: bob's Lightning Bolt at hers, with no mana left to pay, is
    // countered.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && s.priority.holder === B);
    game.debugSpawn("Mountain", B, "battlefield");
    const bolt = game.debugSpawn("Lightning Bolt", B, "hand");
    game.dispatch({ type: "cast-spell", player: B, card: bolt, targets: [{ kind: "object", object: spider }] });
    game.advanceUntil(quiet);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
    expect(game.state.objects[spider].damageMarked).toBe(0);
  });
});

describe("Maarika, Brutal Gladiator", () => {
  it("damage that's more than lethal: that creature's controller sacrifices a noncreature, nonland permanent", () => {
    const { game } = setUp();
    const maarika = game.debugSpawn("Maarika, Brutal Gladiator", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", B, "battlefield");
    const giant = game.debugSpawn("Hill Giant", B, "battlefield");
    bite(game, maarika, giant);
    settle(game);
    expect(game.state.objects[giant].zone).toBe("graveyard");
    expect(game.state.objects[ring].zone).toBe("graveyard");
  });

  it("damage that isn't: nothing", () => {
    const { game } = setUp();
    const maarika = game.debugSpawn("Maarika, Brutal Gladiator", A, "battlefield");
    const ring = game.debugSpawn("Sol Ring", B, "battlefield");
    const shelob = game.debugSpawn("Shelob, Child of Ungoliant", B, "battlefield");
    bite(game, maarika, shelob);
    settle(game);
    expect(game.state.objects[shelob].zone).toBe("battlefield");
    expect(game.state.objects[ring].zone).toBe("battlefield");
  });

  it("indestructible on your own turn only; must be blocked if able", () => {
    const { game } = setUp();
    const maarika = game.debugSpawn("Maarika, Brutal Gladiator", A, "battlefield");
    expect(game.characteristics(maarika).keywords.has("indestructible")).toBe(true);
    expect(game.characteristics(maarika).restrictions).toContain("must-be-blocked-if-able");
    game.advanceUntil((s) => s.turn.number === 2);
    expect(game.characteristics(maarika).keywords.has("indestructible")).toBe(false);
  });
});
