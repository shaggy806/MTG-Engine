import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asObjectId, asPlayerId } from "./primitives.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const fill = (cards: readonly string[], filler: string): string[] => [
  ...cards,
  ...Array(Math.max(0, 40 - cards.length)).fill(filler),
];

const mkGame = (
  aCards: readonly string[],
  bCards: readonly string[] = [],
  overrides: Partial<GameConfig> = {},
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    ...overrides,
    decks: [
      { player: A, cards: fill(aCards, "Mountain") },
      { player: B, cards: fill(bCards, "Forest") },
    ],
  });

const atFirstMain = (s: GameState): boolean => s.turn.step === "precombat-main";
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null;

const cardNamed = (game: Game, ids: readonly ObjectId[], name: string): ObjectId => {
  const id = ids.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} found`);
  return id;
};

const giveLands = (game: Game, player: PlayerId, name: string, n: number): void => {
  for (let i = 0; i < n; i += 1) {
    const id = asObjectId(`land-${game.state.nextObjectSeq}`);
    game.state.nextObjectSeq += 1;
    game.state.objects[id] = {
      id,
      cardName: name,
      owner: player,
      controller: player,
      zone: "battlefield",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: 0,
      summoningSick: false,
      loyaltyActivatedThisTurn: false,
      targets: null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      timestamp: 0,
      isToken: false,
      attachedTo: null,
      isCommander: false,
      xValue: null,
      controlEndsAtCleanup: false,
      copyOf: null,
      counters: {},
      modifiers: [],
    };
    game.state.zones.shared.battlefield.push(id);
  }
};

describe("Storm — Grapeshot (rule 702.40a: every player's spells)", () => {
  it("copies once per spell cast before it this turn, by anyone", () => {
    const game = mkGame(["Grapeshot", "Opt", "Opt"], ["Opt"]);
    giveLands(game, A, "Mountain", 6);
    giveLands(game, A, "Island", 3);
    giveLands(game, B, "Island", 3);
    game.advanceUntil(atFirstMain);

    const [opt1, opt2] = [...game.handOf(A)].filter(
      (i) => game.state.objects[i].cardName === "Opt",
    );
    game.dispatch({ type: "cast-spell", player: A, card: opt1, targets: [] });
    game.advanceUntil(settled);
    // Bob casts an instant during Alice's turn — it still counts for Storm.
    game.advanceUntil((s) => s.priority.holder === B || s.turn.step === "postcombat-main");
    const bobOpt = cardNamed(game, game.handOf(B), "Opt");
    game.dispatch({ type: "cast-spell", player: B, card: bobOpt, targets: [] });
    game.advanceUntil(settled);
    game.dispatch({ type: "cast-spell", player: A, card: opt2, targets: [] });
    game.advanceUntil(settled);

    // 3 spells cast this turn; Grapeshot is the 4th → 3 copies.
    const before = game.state.players[B].life;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardNamed(game, game.handOf(A), "Grapeshot"),
      targets: [{ kind: "player", player: B }],
    });
    game.advanceUntil(settled);

    expect(game.eventsOfType("spell-copied")).toHaveLength(3);
    expect(game.state.players[B].life).toBe(before - 4); // original + 3 copies
  });
});

describe("Cascade — Bloodbraid Elf", () => {
  it("exiles to a lesser-mana-value nonland card, casts it free, bottoms the rest", () => {
    const game = mkGame([
      "Bloodbraid Elf",
      "Forest", "Forest", "Forest", "Forest", "Mountain", "Mountain", // opening hand
      "Forest", // turn-1 draw
      "Island", // cascade exiles this (a land)
      "Deliberate Course", // ...then this — MV 2 < 4, nonland → the cascade hit
    ]);
    giveLands(game, A, "Forest", 3);
    giveLands(game, A, "Mountain", 3);
    game.advanceUntil(atFirstMain);

    const bbe = cardNamed(game, game.handOf(A), "Bloodbraid Elf");
    game.dispatch({ type: "cast-spell", player: A, card: bbe, targets: [] });
    game.advanceUntil(settled);

    const revealed = game.eventsOfType("cascade-revealed")[0];
    expect(revealed).toBeDefined();
    expect(revealed.exiled).toHaveLength(2);
    expect(game.state.objects[revealed.cast!].cardName).toBe("Deliberate Course");
    expect(game.eventsOfType("spell-cast").some((e) => e.via === "cascade")).toBe(true);

    // Bloodbraid Elf resolved onto the battlefield.
    expect(game.state.objects[bbe].zone).toBe("battlefield");
    // The Island went to the bottom of the library (not exile, not hand).
    const island = revealed.exiled.find((id) => game.state.objects[id].cardName === "Island")!;
    expect(game.state.objects[island].zone).toBe("library");
    expect(game.state.zones.perPlayer[A].library.at(-1)).toBe(island);
  });
});

describe("Twincast — copy a spell", () => {
  it("copies the target instant, keeping its target; the copy resolves then ceases to exist", () => {
    const game = mkGame(["Lightning Bolt", "Twincast"]);
    giveLands(game, A, "Mountain", 1);
    giveLands(game, A, "Island", 2);
    game.advanceUntil(atFirstMain);

    const bolt = cardNamed(game, game.handOf(A), "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    const twincast = cardNamed(game, game.handOf(A), "Twincast");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: twincast,
      targets: [{ kind: "object", object: bolt }],
    });
    game.advanceUntil(settled);

    const copied = game.eventsOfType("spell-copied")[0];
    expect(copied).toBeDefined();
    expect(game.state.objects[copied.copy]).toBeUndefined(); // ceased to exist
    expect(game.state.players[B].life).toBe(20 - 3 - 3); // bolt + its copy
  });
});
