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
  ...Array(Math.max(0, 40 - cards.length)).fill("Island"),
];

const mkGame = (
  aCards: readonly string[],
  bCards: readonly string[],
  overrides: Partial<GameConfig> = {},
): Game =>
  Game.create({
    seed: 1,
    shuffle: false,
    ...overrides,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, ...overrides.rules },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad(bCards) },
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

/** Drop `n` untapped lands named `name` straight onto `player`'s battlefield. */
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

/** A casts `spellName`; B responds with `answerName` targeting it. Returns the
 * two object ids. Assumes both have the mana and it's A's precombat main. */
const castAndRespond = (
  game: Game,
  spellName: string,
  answerName: string,
): { spell: ObjectId; answer: ObjectId } => {
  const spell = cardNamed(game, game.state.zones.perPlayer[A].hand, spellName);
  game.dispatch({ type: "cast-spell", player: A, card: spell });
  // A holds priority with the spell on the stack; pass to B.
  game.dispatch({ type: "pass-priority", player: A });
  const answer = cardNamed(game, game.state.zones.perPlayer[B].hand, answerName);
  game.dispatch({
    type: "cast-spell",
    player: B,
    card: answer,
    targets: [{ kind: "object", object: spell }],
  });
  game.advanceUntil(settled);
  return { spell, answer };
};

describe("Counterspell", () => {
  it("counters a creature spell so it never enters the battlefield", () => {
    const game = mkGame(["Island", "Grizzly Bears"], ["Island", "Island", "Counterspell"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, "Forest", 2);
    giveLands(game, B, "Island", 2);

    const { spell, answer } = castAndRespond(game, "Grizzly Bears", "Counterspell");

    expect(game.state.objects[spell].zone).toBe("graveyard");
    expect(game.battlefield).not.toContain(spell);
    expect(game.state.objects[answer].zone).toBe("graveyard");
    expect(game.eventsOfType("spell-countered").some((e) => e.object === spell)).toBe(true);
  });

  it("counters an instant, which then does not resolve", () => {
    const game = mkGame(
      ["Island", "Mountain", "Lightning Bolt"],
      ["Island", "Island", "Counterspell"],
    );
    game.advanceUntil(atFirstMain);
    giveLands(game, A, "Forest", 2);
    giveLands(game, A, "Mountain", 1);
    giveLands(game, B, "Island", 2);

    const bolt = cardNamed(game, game.state.zones.perPlayer[A].hand, "Lightning Bolt");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: bolt,
      targets: [{ kind: "player", player: B }],
    });
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: cardNamed(game, game.state.zones.perPlayer[B].hand, "Counterspell"),
      targets: [{ kind: "object", object: bolt }],
    });
    game.advanceUntil(settled);

    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[bolt].zone).toBe("graveyard");
  });
});

describe("Negate / Essence Scatter targeting restrictions", () => {
  it("Negate cannot target a creature spell", () => {
    const game = mkGame(["Island", "Grizzly Bears"], ["Island", "Island", "Negate"]);
    game.advanceUntil(atFirstMain);
    giveLands(game, A, "Forest", 2);
    giveLands(game, B, "Island", 2);

    const bears = cardNamed(game, game.state.zones.perPlayer[A].hand, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: bears });
    game.dispatch({ type: "pass-priority", player: A });

    expect(() =>
      game.dispatch({
        type: "cast-spell",
        player: B,
        card: cardNamed(game, game.state.zones.perPlayer[B].hand, "Negate"),
        targets: [{ kind: "object", object: bears }],
      }),
    ).toThrow(/illegal target|no legal/);
  });

  it("Essence Scatter counters a creature spell", () => {
    const game = mkGame(
      ["Island", "Grizzly Bears"],
      ["Island", "Island", "Essence Scatter"],
    );
    game.advanceUntil(atFirstMain);
    giveLands(game, A, "Forest", 2);
    giveLands(game, B, "Island", 2);

    const { spell } = castAndRespond(game, "Grizzly Bears", "Essence Scatter");
    expect(game.state.objects[spell].zone).toBe("graveyard");
  });
});
