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
    summoningSick: false,
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

    expect(game.legalActions(A)).toEqual([
      { kind: "choose-from-zone", ids: awaiting.ids, min: 0, max: 1 },
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
    ).toThrow(/not a candidate/);
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
