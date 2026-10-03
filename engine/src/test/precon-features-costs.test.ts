/**
 * Cost and target-count features for precon cards, and the cards they
 * unblock:
 * - an activated ability's life cost read off the commanders' colour identity
 *   (War Room — `AbilityLifeCost`);
 * - multikicker (rule 702.33c–d — Everflowing Chalice);
 * - escalate (rule 702.120 — Collective Resistance);
 * - a graveyard-cast permission that sacrifices a land as an additional cost
 *   (Exploration Broodship);
 * - a spell's X read by its targets: a target count tied to X (Curse of the
 *   Swine, Pest Infestation) and a target filter reading X (Stolen by the
 *   Fae) — rule 601.2b–c, X is announced before targets are chosen.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

type CastOffer = Extract<LegalAction, { kind: "cast-spell" }>;

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });

const setUp = (
  opts: { hand?: readonly string[]; commanders?: readonly string[] } = {},
): Game => {
  const hand = opts.hand ?? [];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      {
        player: A,
        cards: [...hand, ...Array<string>(8 - hand.length).fill("Wastes"), ...Array<string>(40).fill("Wastes")],
        ...(opts.commanders !== undefined ? { commanders: [...opts.commanders] } : {}),
      },
      { player: B, cards: Array<string>(48).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name);
};
const inHand = (game: Game, name: string): ObjectId =>
  game.handOf(A).find((id) => game.state.objects[id].cardName === name)!;
const castOffers = (game: Game, card: ObjectId): CastOffer[] =>
  game.legalActions(A).filter((a): a is CastOffer => a.kind === "cast-spell" && a.card === card);
const onBattlefield = (game: Game, name: string): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === name);

describe("War Room", () => {
  const drawAbility = (game: Game, room: ObjectId) =>
    game.legalActions(A).find((a) => a.kind === "activate-ability" && a.source === room && a.abilityIndex === 1);

  it("pays life equal to the number of colours in the commander's identity", () => {
    const game = setUp({ commanders: ["Atraxa, Praetors' Voice"] });
    lands(game, "Wastes", 3);
    const room = spawn(game, "War Room");
    const hand = game.handOf(A).length;
    const life = game.state.players[A].life;
    expect(drawAbility(game, room)).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: room, abilityIndex: 1, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life - 4);
    expect(game.handOf(A).length).toBe(hand + 1);
  });

  it("pays no life for a colourless commander", () => {
    const game = setUp({ commanders: ["Ulamog, the Ceaseless Hunger"] });
    expect(game.state.players[A].commanderIdentity).toEqual([]);
    lands(game, "Wastes", 3);
    const room = spawn(game, "War Room");
    const life = game.state.players[A].life;
    game.dispatch({ type: "activate-ability", player: A, source: room, abilityIndex: 1, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.players[A].life).toBe(life);
  });

  it("can't be activated at all without a commander (its ruling)", () => {
    const game = setUp();
    lands(game, "Wastes", 3);
    const room = spawn(game, "War Room");
    expect(drawAbility(game, room)).toBeUndefined();
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: room, abilityIndex: 1, targets: [] }),
    ).toThrow(/commander/);
  });

  it("can't be activated with less life than the colours (rule 118.4)", () => {
    const game = setUp({ commanders: ["Atraxa, Praetors' Voice"] });
    lands(game, "Wastes", 3);
    const room = spawn(game, "War Room");
    game.state.players[A].life = 3;
    expect(drawAbility(game, room)).toBeUndefined();
  });
});

describe("Everflowing Chalice — multikicker", () => {
  it("is offered once per affordable number of kicks, the cost paid that many times", () => {
    const game = setUp({ hand: ["Everflowing Chalice"] });
    lands(game, "Wastes", 5);
    const offers = castOffers(game, inHand(game, "Everflowing Chalice"));
    expect(offers.map((o) => [o.kicked === true, o.kickCount, o.kickerCost])).toEqual([
      [false, undefined, undefined],
      [true, 1, "{2}"],
      [true, 2, "{2}{2}"],
    ]);
  });

  it("enters with a charge counter for each time it was kicked, and taps for that much", () => {
    const game = setUp({ hand: ["Everflowing Chalice"] });
    lands(game, "Wastes", 6);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Everflowing Chalice"),
      targets: [],
      kicked: true,
      kickCount: 3,
    });
    game.advanceUntil(quiet);
    const [chalice] = onBattlefield(game, "Everflowing Chalice");
    expect(game.state.objects[chalice].counters.charge).toBe(3);
    expect(onBattlefield(game, "Wastes").every((id) => game.state.objects[id].tapped)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: chalice, abilityIndex: 0, targets: [] });
    expect(game.state.players[A].manaPool.length).toBe(3);
  });

  it("enters with no counters unkicked", () => {
    const game = setUp({ hand: ["Everflowing Chalice"] });
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Everflowing Chalice"), targets: [] });
    game.advanceUntil(quiet);
    const [chalice] = onBattlefield(game, "Everflowing Chalice");
    expect(game.state.objects[chalice].counters.charge ?? 0).toBe(0);
  });

  it("refuses more kicks than the mana pays for", () => {
    const game = setUp({ hand: ["Everflowing Chalice"] });
    lands(game, "Wastes", 3);
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, "Everflowing Chalice"),
        targets: [],
        kicked: true,
        kickCount: 2,
      }),
    ).toThrow();
  });

  it("an ordinary kicker can't be paid twice", () => {
    const game = setUp({ hand: ["Coruscation Mage"] });
    lands(game, "Wastes", 4);
    game.debugSpawn("Mountain", A, "battlefield", { summoningSick: false });
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: inHand(game, "Coruscation Mage"),
        targets: [],
        kicked: true,
        kickCount: 2,
      }),
    ).toThrow(/only once/);
  });

  it("enters with no counters put onto the battlefield without being cast", () => {
    const game = setUp();
    const chalice = spawn(game, "Everflowing Chalice");
    expect(game.state.objects[chalice].counters.charge ?? 0).toBe(0);
  });
});

describe("Collective Resistance — escalate", () => {
  const board = (forests: number) => {
    const game = setUp({ hand: ["Collective Resistance"] });
    lands(game, "Forest", forests);
    const ring = spawn(game, "Sol Ring", B);
    const study = spawn(game, "Rhystic Study", B);
    const bears = spawn(game, "Grizzly Bears");
    return { game, card: inHand(game, "Collective Resistance"), ring, study, bears };
  };

  it("offers only as many modes as the escalate cost can pay for", () => {
    for (const [forests, most] of [[2, 1], [3, 2], [4, 3], [6, 3]] as const) {
      const { game, card } = board(forests);
      const [offer] = castOffers(game, card);
      expect(offer?.castModal?.maxModes).toBe(most);
    }
  });

  it("pays {G} for each mode beyond the first, and does each mode in order", () => {
    const { game, card, ring, study, bears } = board(5);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      modes: [0, 1, 2],
      targets: [obj(ring), obj(study), obj(bears)],
    });
    expect(onBattlefield(game, "Forest").filter((id) => game.state.objects[id].tapped)).toHaveLength(4);
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("graveyard");
    expect(game.state.objects[study].zone).toBe("graveyard");
    const keywords = computeCharacteristics(game.state, registry, bears).keywords;
    expect(keywords.has("hexproof") && keywords.has("indestructible")).toBe(true);
  });

  it("one mode costs only the mana cost", () => {
    const { game, card, ring } = board(5);
    game.dispatch({ type: "cast-spell", player: A, card, modes: [0], targets: [obj(ring)] });
    expect(onBattlefield(game, "Forest").filter((id) => game.state.objects[id].tapped)).toHaveLength(2);
  });

  it("refuses more modes than the mana pays for", () => {
    const { game, card, ring, study, bears } = board(3);
    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: A,
        card,
        modes: [0, 1, 2],
        targets: [obj(ring), obj(study), obj(bears)],
      }),
    ).toThrow(/cannot pay/);
  });
});

describe("Exploration Broodship — a graveyard cast that sacrifices a land", () => {
  const board = (forests: number) => {
    const game = setUp();
    lands(game, "Forest", forests);
    spawn(game, "Exploration Broodship");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    const bolt = game.debugSpawn("Lightning Bolt", A, "graveyard");
    return { game, bears, bolt };
  };
  const graveyardCasts = (game: Game, card: ObjectId) =>
    castOffers(game, card).filter((a) => a.via === "graveyard-permission");

  it("offers a permanent card, with the lands it may sacrifice", () => {
    const { game, bears, bolt } = board(2);
    const [offer] = graveyardCasts(game, bears);
    expect(offer?.sacrifice?.choices).toEqual(onBattlefield(game, "Forest"));
    expect(graveyardCasts(game, bolt)).toEqual([]);
  });

  it("casts it, paying the mana and sacrificing the land — which may tap for it first", () => {
    const { game, bears } = board(2);
    const [first, second] = onBattlefield(game, "Forest");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bears,
      targets: [],
      via: "graveyard-permission",
      sacrifice: first,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[first].zone).toBe("graveyard");
    expect(game.state.objects[second].zone).toBe("battlefield");
  });

  it("is once each turn", () => {
    const { game, bears } = board(4);
    const other = game.debugSpawn("Grizzly Bears", A, "graveyard");
    expect(graveyardCasts(game, other)).toHaveLength(1);
    game.dispatch({ type: "cast-spell", player: A, card: bears, targets: [], via: "graveyard-permission" });
    game.advanceUntil(quiet);
    expect(graveyardCasts(game, other)).toEqual([]);
  });

  it("isn't offered without a land to sacrifice", () => {
    const game = setUp();
    spawn(game, "Exploration Broodship");
    const thopter = game.debugSpawn("Ornithopter", A, "graveyard");
    expect(graveyardCasts(game, thopter)).toEqual([]);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card: thopter, targets: [], via: "graveyard-permission" }),
    ).toThrow(/sacrifice/);
  });
});

describe("Curse of the Swine — exactly X targets", () => {
  const board = (islands: number) => {
    const game = setUp({ hand: ["Curse of the Swine"] });
    lands(game, "Island", islands);
    const theirs = [spawn(game, "Grizzly Bears", B), spawn(game, "Hill Giant", B)];
    const mine = spawn(game, "Gray Ogre");
    return { game, card: inHand(game, "Curse of the Swine"), theirs, mine };
  };

  it("offers a target count for each X, X equal to it", () => {
    const { game, card } = board(4);
    const [offer] = castOffers(game, card);
    expect(offer?.targetCount).toEqual({ min: 0, max: 2 });
    expect(offer?.xCost).toEqual({ maxX: 2, maxXByTargetCount: [0, 1, 2], minXByTargetCount: [0, 1, 2] });
  });

  it("can't target more creatures than there are, whatever X it could pay", () => {
    const { game, card } = board(9);
    const [offer] = castOffers(game, card);
    expect(offer?.targetCount?.max).toBe(3);
    expect(offer?.xCost?.maxX).toBe(3);
  });

  it("exiles them, and each one's controller creates a Boar", () => {
    const { game, card, theirs, mine } = board(5);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card,
      targets: [obj(theirs[0]), obj(mine)],
      xValue: 2,
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[theirs[0]].zone).toBe("exile");
    expect(game.state.objects[mine].zone).toBe("exile");
    expect(game.state.objects[theirs[1]].zone).toBe("battlefield");
    const boars = onBattlefield(game, "Boar Token");
    expect(boars.map((id) => game.state.objects[id].controller).sort()).toEqual([A, B].sort());
  });

  it("refuses fewer or more targets than X", () => {
    const { game, card, theirs, mine } = board(5);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(theirs[0])], xValue: 2 }),
    ).toThrow(/at least 2/);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(theirs[0]), obj(mine)], xValue: 1 }),
    ).toThrow(/at most 1/);
  });
});

describe("Pest Infestation — up to X targets", () => {
  const board = (forests: number) => {
    const game = setUp({ hand: ["Pest Infestation"] });
    lands(game, "Forest", forests);
    const ring = spawn(game, "Sol Ring", B);
    const study = spawn(game, "Rhystic Study", B);
    return { game, card: inHand(game, "Pest Infestation"), ring, study };
  };

  it("offers each count of targets with X at least that count", () => {
    const { game, card } = board(5);
    const [offer] = castOffers(game, card);
    expect(offer?.targetCount).toEqual({ min: 0, max: 2 });
    expect(offer?.xCost).toEqual({ maxX: 2, maxXByTargetCount: [2, 2, 2], minXByTargetCount: [0, 1, 2] });
  });

  it("destroys the targets and creates twice X Pests, however many it destroyed", () => {
    const { game, card, ring, study } = board(7);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(ring)], xValue: 3 });
    game.advanceUntil(quiet);
    expect(game.state.objects[ring].zone).toBe("graveyard");
    expect(game.state.objects[study].zone).toBe("battlefield");
    const pests = onBattlefield(game, "Pest Token").reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(pests).toBe(6);
  });

  it("with no targets chosen still makes its Pests", () => {
    const { game, card } = board(3);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [], xValue: 1 });
    game.advanceUntil(quiet);
    const pests = onBattlefield(game, "Pest Token").reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(pests).toBe(2);
  });

  it("refuses more targets than X", () => {
    const { game, card, ring, study } = board(5);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(ring), obj(study)], xValue: 1 }),
    ).toThrow(/at most 1/);
  });
});

describe("Stolen by the Fae — a target filter reading X", () => {
  const board = (islands: number) => {
    const game = setUp({ hand: ["Stolen by the Fae"] });
    lands(game, "Island", islands);
    const bears = spawn(game, "Grizzly Bears", B);
    const ogre = spawn(game, "Gray Ogre", B);
    return { game, card: inHand(game, "Stolen by the Fae"), bears, ogre };
  };

  it("is offered once per X with a creature of that mana value, its options at that X", () => {
    const { game, card, bears, ogre } = board(5);
    const offers = castOffers(game, card);
    expect(offers.map((o) => [o.xCost, o.targetOptions])).toEqual([
      [{ maxX: 2, minX: 2 }, [[obj(bears)]]],
      [{ maxX: 3, minX: 3 }, [[obj(ogre)]]],
    ]);
  });

  it("returns the creature and creates X Faeries", () => {
    const { game, card, bears } = board(4);
    game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(bears)], xValue: 2 });
    game.advanceUntil(quiet);
    expect(game.state.objects[bears].zone).toBe("hand");
    const faeries = onBattlefield(game, "Faerie Token").reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(faeries).toBe(2);
  });

  it("refuses a creature whose mana value isn't X", () => {
    const { game, card, bears } = board(5);
    expect(() =>
      game.dispatch({ type: "cast-spell", player: A, card, targets: [obj(bears)], xValue: 3 }),
    ).toThrow(/target/);
  });
});
