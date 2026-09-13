import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill("Forest"),
];

const mkGame = (
  aCards: readonly string[] = [],
  bCards: readonly string[] = [],
  overrides: Partial<GameConfig> = {},
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
    ],
  });

/** Drop a card straight into a zone, bypassing the normal draw/cast flow. */
const spawnInto = (
  game: Game,
  cardName: string,
  owner: PlayerId,
  zone: "graveyard" | "battlefield",
): ObjectId => {
  const id = asObjectId(`spawn-${game.state.nextObjectSeq}`);
  game.state.nextObjectSeq += 1;
  game.state.timestampSeq += 1;
  game.state.objects[id] = {
    id,
    cardName,
    owner,
    controller: owner,
    zone,
    tapped: false,
    damageMarked: 0,
    markedByDeathtouch: false,
    enteredBattlefieldOnTurn: 0,
    summoningSick: false, loyaltyActivatedThisTurn: false,
    targets: null,
    attacking: null,
    blocking: null,
    blockedBy: [],
    blocked: false,
    kind: "card",
    abilityKind: null,
    sourceObjectId: null,
    abilityIndex: null,
    counters: {},
    modifiers: [],
    timestamp: game.state.timestampSeq,
    isToken: false,
    attachedTo: null,
    isCommander: false,
    xValue: null,
    controlEndsAtCleanup: false,
    copyOf: null,
  };
  if (zone === "battlefield") game.state.zones.shared.battlefield.push(id);
  else game.state.zones.perPlayer[owner].graveyard.push(id);
  return id;
};

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const stackEmpty = (s: GameState): boolean => s.zones.shared.stack.length === 0;
const named = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};

/** Alice's opening hand ends up ["Forest","Forest","Forest","Explorer's
 * Insight","Grizzly Bears","Craw Wurm","Wildwood Sentinel"] (shuffle:false,
 * dealt from the front), leaving the next 4 library cards — in this exact
 * order — as the top 4 Explorer's Insight looks at. */
const EXPLORE_HAND = [
  "Forest",
  "Forest",
  "Forest",
  "Explorer's Insight",
  "Grizzly Bears",
  "Craw Wurm",
  "Wildwood Sentinel",
];
const TOP_FOUR = ["Llanowar Elves", "Rumbling Baloth", "Giant Growth", "Elvish Visionary"];

function castExplorersInsight(game: Game): ObjectId {
  for (let i = 0; i < 3; i += 1) {
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), "Forest"),
    });
  }
  const card = named(game, game.handOf(A), "Explorer's Insight");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  // Both players' (default, automatic) controllers pass, resolving the
  // spell — which stops holding the stack the instant its effect sets
  // `awaiting`, before any controller gets a chance to auto-answer it
  // (advanceUntil's predicate is checked before each further tick).
  game.advanceUntil(stackEmpty);
  return card;
}

describe("look-and-choose: library (Explorer's Insight)", () => {
  it("reveals the top 4 as choose-from-zone candidates for the caster only", () => {
    const game = mkGame([...EXPLORE_HAND, ...TOP_FOUR]);
    game.advanceUntil(atFirstMain);
    castExplorersInsight(game);

    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-from-zone");
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    expect(awaiting.player).toBe(A);
    expect(awaiting.min).toBe(0);
    expect(awaiting.max).toBe(1);
    expect(awaiting.ids.map((id) => game.state.objects[id].cardName)).toEqual(TOP_FOUR);
    // No filter on Explorer's Insight — every revealed card is choosable.
    expect(awaiting.eligible).toEqual(awaiting.ids);

    expect(game.legalActions(A)).toEqual([
      { kind: "choose-from-zone", ids: awaiting.ids, eligible: awaiting.ids, min: 0, max: 1 },
    ]);
    expect(game.legalActions(B)).toEqual([]);
  });

  it("puts the chosen card onto the battlefield and shuffles the rest to the bottom", () => {
    const game = mkGame([...EXPLORE_HAND, ...TOP_FOUR]);
    game.advanceUntil(atFirstMain);
    castExplorersInsight(game);

    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    const baloth = named(game, awaiting.ids, "Rumbling Baloth");
    const librarySizeBefore = game.state.zones.perPlayer[A].library.length;

    game.dispatch({ type: "choose-from-zone", player: A, chosen: [baloth] });

    expect(game.state.awaiting).toBeNull();
    expect(game.state.objects[baloth].zone).toBe("battlefield");
    expect(game.state.objects[baloth].controller).toBe(A);

    const library = game.state.zones.perPlayer[A].library;
    expect(library.length).toBe(librarySizeBefore - 1);
    const leftoverNames = ["Llanowar Elves", "Giant Growth", "Elvish Visionary"];
    const bottomThree = library.slice(-3).map((id) => game.state.objects[id].cardName);
    expect(new Set(bottomThree)).toEqual(new Set(leftoverNames));
    // Everything ahead of those 3 is the Forest padding that used to sit
    // right after the top 4 — never touched by the shuffle.
    expect(game.state.objects[library[0]].cardName).toBe("Forest");
  });

  it("declining (choosing none) leaves all 4 in the library, now at the bottom", () => {
    const game = mkGame([...EXPLORE_HAND, ...TOP_FOUR]);
    game.advanceUntil(atFirstMain);
    castExplorersInsight(game);
    const librarySizeBefore = game.state.zones.perPlayer[A].library.length;

    game.dispatch({ type: "choose-from-zone", player: A, chosen: [] });

    const library = game.state.zones.perPlayer[A].library;
    expect(library.length).toBe(librarySizeBefore);
    const bottomFour = library.slice(-4).map((id) => game.state.objects[id].cardName);
    expect(new Set(bottomFour)).toEqual(new Set(TOP_FOUR));
  });

  it("rejects choosing more than max, a duplicate, a non-candidate, or the wrong player", () => {
    const game = mkGame([...EXPLORE_HAND, ...TOP_FOUR]);
    game.advanceUntil(atFirstMain);
    castExplorersInsight(game);
    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    const [first, second] = awaiting.ids;

    expect(() =>
      game.dispatch({ type: "choose-from-zone", player: A, chosen: [first, second] }),
    ).toThrow(/must choose between/);
    expect(() =>
      game.dispatch({ type: "choose-from-zone", player: A, chosen: [first, first] }),
    ).toThrow(/same card twice/);
    expect(() =>
      game.dispatch({ type: "choose-from-zone", player: A, chosen: [asObjectId("not-a-candidate")] }),
    ).toThrow(/not an eligible candidate/);
    expect(() =>
      game.dispatch({ type: "choose-from-zone", player: B, chosen: [] }),
    ).toThrow(/not being asked/);
  });
});

describe("look-and-choose: graveyard (Grave Recall)", () => {
  it("puts the chosen card into hand and leaves the rest sitting in the graveyard", () => {
    const game = mkGame(["Forest", "Forest", "Forest", "Grave Recall"]);
    game.advanceUntil(atFirstMain);
    const bear = spawnInto(game, "Grizzly Bears", A, "graveyard");
    const wurm = spawnInto(game, "Craw Wurm", A, "graveyard");

    for (let i = 0; i < 3; i += 1) {
      game.dispatch({
        type: "play-land",
        player: A,
        card: named(game, game.handOf(A), "Forest"),
      });
    }
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: named(game, game.handOf(A), "Grave Recall"),
      targets: [],
    });
    game.advanceUntil(stackEmpty);

    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    expect(new Set(awaiting.ids)).toEqual(new Set([bear, wurm]));

    game.dispatch({ type: "choose-from-zone", player: A, chosen: [bear] });

    expect(game.state.objects[bear].zone).toBe("hand");
    expect(game.handOf(A)).toContain(bear);
    expect(game.state.objects[wurm].zone).toBe("graveyard");
    expect(game.state.zones.perPlayer[A].graveyard).toContain(wurm);
  });
});

/** Alice's opening hand: 7 lands (for Ureni's {4}{G}{U}{R} — 5 Forests,
 * covering the {G} pip plus 4 of the generic, plus one each of
 * Island/Mountain for the {U}/{R} pips) + Ureni itself — cast directly from
 * hand here (not via the command zone) since the filter is a property of
 * the effect, independent of commander mechanics, which this file doesn't
 * otherwise touch. */
const URENI_HAND = [
  "Forest",
  "Forest",
  "Forest",
  "Forest",
  "Forest",
  "Island",
  "Mountain",
  "Ureni of the Unwritten",
];

function castUreni(game: Game): void {
  for (const landName of [
    "Forest",
    "Forest",
    "Forest",
    "Forest",
    "Forest",
    "Island",
    "Mountain",
  ]) {
    game.dispatch({
      type: "play-land",
      player: A,
      card: named(game, game.handOf(A), landName),
    });
  }
  const card = named(game, game.handOf(A), "Ureni of the Unwritten");
  game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
  game.advanceUntil(stackEmpty);
}

describe("look-and-choose filter: only a Dragon card (Ureni of the Unwritten)", () => {
  it("still reveals all 8 — the filter only narrows what's eligible to choose", () => {
    const topEight = [
      "Mossback Dragon",
      "Grizzly Bears",
      "Mossback Dragon",
      "Craw Wurm",
      "Elvish Visionary",
      "Giant Growth",
      "Llanowar Elves",
      "Wildwood Sentinel",
    ];
    const game = mkGame([...URENI_HAND, ...topEight], [], { rules: { openingHandSize: 8 } });
    game.advanceUntil(atFirstMain);
    castUreni(game);

    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    expect(awaiting.ids.map((id) => game.state.objects[id].cardName)).toEqual(topEight);
    const dragons = awaiting.ids.filter(
      (id) => game.state.objects[id].cardName === "Mossback Dragon",
    );
    expect(awaiting.eligible).toEqual(dragons);
    expect(awaiting.eligible.length).toBe(2);
    expect(awaiting.min).toBe(0);
    expect(awaiting.max).toBe(1);
  });

  it("rejects choosing a revealed but non-Dragon card", () => {
    const topEight = ["Grizzly Bears", "Craw Wurm", "Mossback Dragon", "Giant Growth"];
    const game = mkGame([...URENI_HAND, ...topEight], [], { rules: { openingHandSize: 8 } });
    game.advanceUntil(atFirstMain);
    castUreni(game);

    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    const bear = named(game, awaiting.ids, "Grizzly Bears");
    expect(() =>
      game.dispatch({ type: "choose-from-zone", player: A, chosen: [bear] }),
    ).toThrow(/not an eligible candidate/);
  });

  it("puts the chosen Dragon onto the battlefield; every other revealed card (Dragon or not) goes to the bottom", () => {
    const topEight = [
      "Grizzly Bears",
      "Craw Wurm",
      "Mossback Dragon",
      "Giant Growth",
      "Elvish Visionary",
      "Llanowar Elves",
      "Wildwood Sentinel",
      "Rumbling Baloth",
    ];
    const game = mkGame([...URENI_HAND, ...topEight], [], { rules: { openingHandSize: 8 } });
    game.advanceUntil(atFirstMain);
    castUreni(game);

    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    const dragon = named(game, awaiting.ids, "Mossback Dragon");

    game.dispatch({ type: "choose-from-zone", player: A, chosen: [dragon] });

    expect(game.state.objects[dragon].zone).toBe("battlefield");
    const library = game.state.zones.perPlayer[A].library;
    const leftoverNames = topEight.filter((name) => name !== "Mossback Dragon");
    const bottomSeven = library.slice(-7).map((id) => game.state.objects[id].cardName);
    expect(new Set(bottomSeven)).toEqual(new Set(leftoverNames));
  });

  it("falls back to putting nothing onto the battlefield when no Dragon is among the 8", () => {
    const topEight = [
      "Grizzly Bears",
      "Craw Wurm",
      "Elvish Visionary",
      "Giant Growth",
      "Llanowar Elves",
      "Wildwood Sentinel",
      "Rumbling Baloth",
      "Forest",
    ];
    const game = mkGame([...URENI_HAND, ...topEight], [], { rules: { openingHandSize: 8 } });
    game.advanceUntil(atFirstMain);
    castUreni(game);

    const awaiting = game.state.awaiting;
    if (awaiting?.kind !== "choose-from-zone") throw new Error("unreachable");
    expect(awaiting.eligible).toEqual([]);
    expect(awaiting.min).toBe(0);
    expect(awaiting.max).toBe(0);

    const librarySizeBefore = game.state.zones.perPlayer[A].library.length;
    // "Put none" is the only legal answer — max was clamped to 0 since
    // nothing here was ever eligible.
    expect(() =>
      game.dispatch({ type: "choose-from-zone", player: A, chosen: [awaiting.ids[0]] }),
    ).toThrow(/must choose between 0 and 0/);
    game.dispatch({ type: "choose-from-zone", player: A, chosen: [] });

    expect(game.state.zones.perPlayer[A].library.length).toBe(librarySizeBefore);
    const bottomEight = game.state.zones.perPlayer[A].library
      .slice(-8)
      .map((id) => game.state.objects[id].cardName);
    expect(new Set(bottomEight)).toEqual(new Set(topEight));
  });
});
