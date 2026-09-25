/**
 * "This way": what a resolving spell or ability has made players discard,
 * draw, mill or sacrifice so far — Lord Windgrace's "discard a card, then draw
 * a card. If a land card is discarded this way, draw an additional card",
 * Kefka, Court Mage's "draw a card for each card type among cards discarded
 * this way", Mr. Foxglove's "if you didn't draw cards this way". Read off the
 * resolution's own events (`GameState.resolutionSince`), so a step that waited
 * on a player's choice still counts.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import * as filterModule from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Lord Windgrace's +2. */
const windgrace: EffectSpec = {
  kind: "sequence",
  effects: [
    { kind: "discard", target: "you", amount: 1 },
    { kind: "draw", amount: 1 },
    {
      kind: "conditional",
      condition: { kind: "this-way", what: "discarded", filter: { type: "land" } },
      then: { kind: "draw", amount: 1 },
    },
  ],
};

const RUMMAGE = "Test Rummage";
const registry = createDefaultRegistry().register(
  defineCard({
    name: RUMMAGE,
    manaCost: "{0}",
    types: ["sorcery"],
    text: "Discard a card, then draw a card. If a land card is discarded this way, draw an additional card.",
    effect: windgrace,
  }),
);

const islands = (n = 40): string[] => Array<string>(n).fill("Island");
/** Opening hands are the top of the library, and a scripted player discards
 * from the front of their hand — so a deck's first card is what they give up. */
const setUp = (
  aDeck: readonly string[] = islands(),
  bDeck: readonly string[] = islands(),
  choose?: ScriptedController["chooseFromZoneFn"],
) => {
  const a = new ScriptedController(A);
  if (choose !== undefined) a.chooseFromZoneFn = choose;
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...aDeck] },
      { player: B, cards: [...bDeck] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.suspendedResolutions.length === 0 &&
  s.priority.holder !== null;
const run = (game: Game, effect: EffectSpec, x?: number): void => {
  game.debugApplyEffect(A, effect, [], x === undefined ? {} : { x });
  game.advanceUntil(quiet);
};
const hand = (game: Game, player: PlayerId = A): number => game.handOf(player).length;

describe("discarded this way", () => {
  it("Lord Windgrace: a land discarded draws an extra card", () => {
    const game = setUp();
    const before = hand(game);
    run(game, windgrace);
    expect(hand(game)).toBe(before + 1);
  });

  it("…and a nonland doesn't", () => {
    const game = setUp(["Grizzly Bears", ...islands(39)]);
    const before = hand(game);
    run(game, windgrace);
    expect(hand(game)).toBe(before);
    expect(game.state.zones.perPlayer[A].graveyard.map((id) => game.state.objects[id].cardName)).toEqual([
      "Grizzly Bears",
    ]);
  });

  it("works the same resolving from the stack", () => {
    const game = setUp();
    const rummage = game.debugSpawn(RUMMAGE, A, "hand");
    const before = hand(game);
    game.dispatch({ type: "cast-spell", player: A, card: rummage, targets: [] });
    game.advanceUntil(quiet);
    // The Rummage left the hand; then -1 +2.
    expect(hand(game)).toBe(before - 1 + 1);
    expect(game.state.resolutionSince).toBeUndefined();
  });

  it("Kefka: a card for each card type among cards every player discarded", () => {
    const game = setUp(["Darksteel Myr", ...islands(39)], islands());
    const before = hand(game);
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "discard", target: "each-player", amount: 1 },
        { kind: "draw", amount: { thisWay: "discarded", cardTypes: true } },
      ],
    });
    // Artifact, creature (the Myr) and land (Bob's Island): three.
    expect(hand(game)).toBe(before - 1 + 3);
  });

  it("`who` counts only the scope's cards", () => {
    const game = setUp();
    const before = hand(game);
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "discard", target: "each-player", amount: 1 },
        { kind: "draw", amount: { thisWay: "discarded", who: "each-opponent" } },
      ],
    });
    expect(hand(game)).toBe(before - 1 + 1);
  });
});

describe("drawn, milled and sacrificed this way", () => {
  /** Mr. Foxglove's shape: "draw X. If you didn't draw cards this way, …". */
  const foxglove: EffectSpec = {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: "x" },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "drawn", who: "you", atMost: 0 },
        then: { kind: "gain-life", amount: 5 },
      },
    ],
  };

  it("'if you didn't draw cards this way'", () => {
    const game = setUp();
    run(game, foxglove, 0);
    expect(game.state.players[A].life).toBe(25);
    run(game, foxglove, 2);
    expect(game.state.players[A].life).toBe(25);
  });

  it("a draw earlier in the turn isn't this resolution's", () => {
    const game = setUp();
    run(game, { kind: "draw", amount: 3 });
    run(game, foxglove, 0);
    expect(game.state.players[A].life).toBe(25);
  });

  it("milled: a card for each land milled this way", () => {
    const game = setUp([...islands(10), "Grizzly Bears", "Grizzly Bears", ...islands(28)]);
    const before = hand(game);
    // Alice's library now starts with two Islands, then the Bears.
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "mill", target: "you", amount: 4 },
        { kind: "draw", amount: { thisWay: "milled", filter: { type: "land" } } },
      ],
    });
    expect(hand(game)).toBe(before + 2);
  });

  it("sacrificed: read as it last existed", () => {
    const game = setUp();
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
        { kind: "gain-life", amount: { thisWay: "sacrificed", filter: { type: "creature" } } },
      ],
    });
    expect(game.state.players[A].life).toBe(21);
  });
});

const namesIn = (game: Game, ids: readonly string[]): string[] =>
  ids.map((id) => game.state.objects[id as keyof typeof game.state.objects].cardName);
const battlefieldOf = (game: Game, player: PlayerId): string[] =>
  namesIn(
    game,
    game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].controller === player),
  );
const life = (game: Game, player: PlayerId = A): number => game.state.players[player].life;

describe("destroyed, exiled, returned and put into a graveyard this way", () => {
  it("exiled: permanents and a token stack, each token counted", () => {
    const game = setUp();
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    run(game, { kind: "create-token", token: "Goblin Token", count: 10 });
    expect(game.state.zones.shared.battlefield.length).toBeLessThan(12);
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "exile-all", filter: { type: "creature" } },
        { kind: "gain-life", amount: { thisWay: "exiled" } },
        { kind: "gain-life", amount: { thisWay: "exiled", who: "each-opponent" }, who: "each-opponent" },
      ],
    });
    // Two Bears and ten Goblins; Bob's Bears alone for Bob.
    expect(life(game)).toBe(32);
    expect(life(game, B)).toBe(21);
  });

  it("exiled: cards from a graveyard, asked about as they are now", () => {
    const game = setUp();
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Grizzly Bears", B, "graveyard");
    game.debugSpawn("Island", B, "graveyard");
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "exile-graveyard", target: "each-player" },
        { kind: "gain-life", amount: { thisWay: "exiled", filter: { type: "creature" } } },
      ],
    });
    expect(life(game)).toBe(22);
  });

  it("destroyed: each controller gets a token per creature of theirs destroyed", () => {
    const game = setUp();
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Darksteel Myr", B, "battlefield");
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "destroy-all", filter: { type: "creature" } },
        {
          kind: "create-token",
          token: "3/3 Beast Token",
          count: { thisWay: "destroyed", who: "each" },
          who: "each-player",
        },
      ],
    });
    // The indestructible Myr wasn't destroyed.
    expect(battlefieldOf(game, A)).toEqual(["3/3 Beast Token"]);
    expect(battlefieldOf(game, B).sort()).toEqual(["3/3 Beast Token", "3/3 Beast Token", "Darksteel Myr"]);
  });

  it("destroyed: a creature dying of damage isn't", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    // Damage needs a source to come from.
    const source = game.debugSpawn("Island", A, "battlefield");
    game.debugApplyEffect(
      A,
      {
        kind: "sequence",
        effects: [
          { kind: "damage-all", filter: { type: "creature" }, amount: 5 },
          { kind: "gain-life", amount: { thisWay: "destroyed" } },
        ],
      },
      [],
      { source },
    );
    // Dealt lethal damage — it dies to the next state-based check, which is
    // no destroy effect's doing.
    expect(game.state.objects[bears].damageMarked).toBe(5);
    expect(life(game)).toBe(20);
  });

  it("returned to hand: read as it last existed", () => {
    const game = setUp();
    game.debugSpawn("Grizzly Bears", B, "battlefield");
    game.debugSpawn("Island", B, "battlefield");
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "return-to-hand-all", filter: { controlledBy: "opponent" } },
        { kind: "gain-life", amount: { thisWay: "returned-to-hand", filter: { type: "creature" } } },
      ],
    });
    expect(life(game)).toBe(21);
  });

  it("put into a graveyard: the rest of what was looked at", () => {
    // Dihada's −3 shape: "Reveal the top four cards of your library. You may
    // put any number of legendary cards from among them into your hand. Put
    // the rest into your graveyard. You gain 1 life for each card put into
    // your graveyard this way."
    const game = setUp(
      [...islands(8), "Grizzly Bears", "Island", "Grizzly Bears", "Island", ...islands(28)],
      islands(),
      (_view, eligible) => eligible.slice(0, 1),
    );
    run(game, {
      kind: "sequence",
      effects: [
        {
          kind: "look-and-choose",
          zone: "library",
          count: 4,
          reveal: true,
          min: 0,
          max: 4,
          destination: "hand",
          leftover: "graveyard",
          filter: { type: "creature" },
        },
        { kind: "gain-life", amount: { thisWay: "put-into-graveyard", who: "you" } },
      ],
    });
    expect(life(game)).toBe(23);
  });
});

describe("put onto the battlefield this way", () => {
  /** Hakbal's shape: "you may put a land card from your hand onto the
   * battlefield. If you don't, draw a card." */
  const hakbal: EffectSpec = {
    kind: "sequence",
    effects: [
      {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "land" },
      },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "put-onto-battlefield", atMost: 0 },
        then: { kind: "draw", amount: 1 },
      },
    ],
  };

  it("'if you don't': putting a land in draws nothing", () => {
    const game = setUp(islands(), islands(), (_view, eligible) => eligible.slice(0, 1));
    const before = hand(game);
    run(game, hakbal);
    expect(hand(game)).toBe(before - 1);
    expect(battlefieldOf(game, A)).toEqual(["Island"]);
  });

  it("…and declining draws a card", () => {
    const game = setUp(islands(), islands(), () => []);
    const before = hand(game);
    run(game, hakbal);
    expect(hand(game)).toBe(before + 1);
    expect(battlefieldOf(game, A)).toEqual([]);
  });

  it("a token created isn't put onto the battlefield", () => {
    const game = setUp();
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "create-token", token: "Goblin Token", count: 1 },
        {
          kind: "conditional",
          condition: { kind: "this-way", what: "put-onto-battlefield", atMost: 0 },
          then: { kind: "gain-life", amount: 1 },
        },
      ],
    });
    expect(life(game)).toBe(21);
  });
});

describe("choosing among the cards moved this way", () => {
  it("a creature card milled this way — not one already in the graveyard", () => {
    // "Mill three cards. You may put a creature card milled this way into
    // your hand."
    const game = setUp([...islands(7), "Island", "Grizzly Bears", "Island", ...islands(30)]);
    const old = game.debugSpawn("Darksteel Myr", A, "graveyard");
    const before = hand(game);
    run(game, {
      kind: "sequence",
      effects: [
        { kind: "mill", target: "you", amount: 3 },
        {
          kind: "return-from-graveyard",
          filter: { type: "creature", thisWay: "milled" },
          destination: "hand",
          count: 1,
        },
      ],
    });
    expect(hand(game)).toBe(before + 1);
    expect(namesIn(game, game.handOf(A))).toContain("Grizzly Bears");
    expect(game.state.objects[old].zone).toBe("graveyard");
  });

  it("between resolutions the clause matches nothing", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    run(game, { kind: "mill", target: "you", amount: 3 });
    expect(game.state.resolutionSince).toBeUndefined();
    const { matchesFilter } = filterModule;
    expect(
      matchesFilter(game.state, registry, bears, { thisWay: "milled" }, { you: A }),
    ).toBe(false);
  });
});
