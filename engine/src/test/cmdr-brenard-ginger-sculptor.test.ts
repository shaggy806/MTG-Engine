/**
 * Brenard, Ginger Sculptor — {1}{G}{W}{U} legendary 3/3 Human Artificer.
 *
 *   Each creature you control that's a Food or a Golem gets +2/+2 and has
 *   trample.
 *   Whenever another nontoken creature you control dies, you may exile it. If
 *   you do, create a token that's a copy of that creature, except it's a 1/1
 *   Food Golem artifact creature in addition to its other types and it has
 *   "{2}, {T}, Sacrifice this token: You gain 3 life."
 *
 * "It" is the card in the graveyard, while it's still that card (rule 400.7);
 * "that creature" is copied as it last existed on the battlefield (rule
 * 608.2h), and the exceptions are copiable values (rule 707.9b).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { nameOf } from "../state.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (answer: "yes" | "no" = "yes") => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => (answer === "yes" ? [0] : []);
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
  const brenard = game.debugSpawn("Brenard, Ginger Sculptor", A, "battlefield");
  return { game, a, brenard };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const kill = (game: Game, id: ObjectId): void => {
  game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: id }]);
  game.advanceUntil(quiet);
};
const tokens = (game: Game, player: PlayerId = A): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) => game.state.objects[id].isToken === true && game.state.objects[id].controller === player,
  );
const FOOD_TEXT = "{2}, {T}, Sacrifice this token: You gain 3 life.";

describe("Brenard, Ginger Sculptor", () => {
  it("exiles a creature card of yours that died and makes a Food Golem copy of it, 3/3 with trample", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    kill(game, bears);
    expect(game.state.objects[bears].zone).toBe("exile");
    const [token] = tokens(game);
    expect(token).toBeDefined();
    expect(nameOf(game.state.objects[token])).toBe("Grizzly Bears");
    const c = game.characteristics(token);
    expect([...c.types].sort()).toEqual(["artifact", "creature"]);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Bear", "Food", "Golem"]));
    // A 1/1 base, and Brenard's +2/+2 and trample over it.
    expect([c.power, c.toughness]).toEqual([3, 3]);
    expect(c.keywords.has("trample")).toBe(true);
    // Its Food ability shows on it.
    expect(game.viewFor(A).objects[token]?.text).toContain(FOOD_TEXT);
  });

  it("the token's Food ability: {2}, {T}, sacrifice it, gain 3 life", () => {
    const { game } = setUp();
    kill(game, game.debugSpawn("Grizzly Bears", A, "battlefield"));
    const [token] = tokens(game);
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");
    // A creature's {T} ability waits out summoning sickness (rule 302.6).
    const offered = () =>
      game.legalActions(A).filter((action) => action.kind === "activate-ability" && action.source === token);
    expect(offered()).toEqual([]);
    game.state.objects[token].summoningSick = false;
    const [food] = offered();
    expect(food).toMatchObject({ kind: "activate-ability", text: FOOD_TEXT });
    const life = game.state.players[A].life;
    if (food?.kind !== "activate-ability") throw new Error("no Food ability");
    game.dispatch({ type: "activate-ability", player: A, source: token, abilityIndex: food.abilityIndex });
    game.advanceUntil(quiet);
    expect(game.state.objects[token]).toBeUndefined();
    expect(game.state.players[A].life).toBe(life + 3);
  });

  it("a copy of the token is a Food Golem with the ability too", () => {
    const { game } = setUp();
    kill(game, game.debugSpawn("Grizzly Bears", A, "battlefield"));
    const [token] = tokens(game);
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1, who: "you" }, [
      { kind: "object", object: token },
    ]);
    const copy = tokens(game).find((id) => id !== token)!;
    const c = game.characteristics(copy);
    expect(c.subtypes).toEqual(expect.arrayContaining(["Bear", "Food", "Golem"]));
    expect([c.power, c.toughness]).toEqual([3, 3]);
    game.state.objects[copy].summoningSick = false;
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", A, "battlefield");
    expect(
      game.legalActions(A).some((action) => action.kind === "activate-ability" && action.source === copy),
    ).toBe(true);
  });

  it("copies the creature as it last existed: a transformed Bloodline Keeper is a Lord of Lineage", () => {
    const { game } = setUp();
    const keeper = game.debugSpawn("Bloodline Keeper", A, "battlefield");
    game.debugApplyEffect(A, { kind: "transform", target: 0 }, [{ kind: "object", object: keeper }]);
    expect(nameOf(game.state.objects[keeper])).toBe("Lord of Lineage");
    kill(game, keeper);
    const [token] = tokens(game);
    expect(nameOf(game.state.objects[token])).toBe("Lord of Lineage");
  });

  it("declining leaves the card where it is and makes nothing", () => {
    const { game } = setUp("no");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    kill(game, bears);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(tokens(game)).toEqual([]);
  });

  it("a card that has moved on is a new object: nothing to exile, no token (rule 400.7)", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    // The trigger waits on the stack; the card is reanimated in response.
    (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
    expect(game.state.zones.shared.stack).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [{ kind: "object", object: bears }]);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    game.advanceUntil(quiet);
    // The new permanent isn't "it": it stays, and nothing is made.
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(tokens(game)).toEqual([]);
  });

  it("not for a token, an opponent's creature, or itself", () => {
    const { game, brenard } = setUp();
    game.debugApplyEffect(A, { kind: "create-token", token: "Vampire Token", count: 1 }, []);
    const [vampire] = tokens(game);
    kill(game, vampire);
    kill(game, game.debugSpawn("Grizzly Bears", B, "battlefield"));
    kill(game, brenard);
    expect(tokens(game)).toEqual([]);
    expect(tokens(game, B)).toEqual([]);
    expect(game.state.objects[brenard].zone).toBe("graveyard");
  });

  it("pumps your Food and Golem creatures only: not an opponent's, not another creature", () => {
    const { game } = setUp();
    const golem = game.debugSpawn("Chronomaton", A, "battlefield");
    const theirs = game.debugSpawn("Chronomaton", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const pt = (id: ObjectId) => {
      const c = game.characteristics(id);
      return [c.power, c.toughness, c.keywords.has("trample")];
    };
    expect(pt(golem)).toEqual([3, 3, true]);
    expect(pt(theirs)).toEqual([1, 1, false]);
    expect(pt(bears)).toEqual([2, 2, false]);
  });
});
