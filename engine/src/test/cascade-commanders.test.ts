/**
 * The commanders the whole free cast unblocked: cascade printed twice
 * (Maelstrom Wanderer), granted to spells by a static (The First Sliver,
 * Imoti, Zhulodok — "cascade, cascade"), granted for the rest of the turn by
 * a trigger (Yidris), and Jodah, the Unifier's legendary cascade, whose card
 * stays exiled when it isn't cast.
 */
import { describe, expect, it } from "vitest";

import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

/** A game whose library for alice is `library` (top first) under a hand of
 * Wastes, at her first main phase with `lands` untapped. */
const setUp = (library: readonly string[], lands: readonly string[]): Game => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { maxLandsPerTurn: 99, skipFirstDraw: false, maxHandSize: 99 },
    decks: [
      { player: A, cards: [...Array(8).fill("Wastes"), ...library, ...Array(40).fill("Wastes")] },
      { player: B, cards: Array(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  for (const land of lands) game.debugSpawn(land, A, "battlefield");
  return game;
};

/** Cast `name` from alice's hand and resolve everything, declining every
 * free-cast offer; returns how many cascades revealed cards. */
const castAndCount = (game: Game, name: string, player: PlayerId = A): number => {
  const card = game.debugSpawn(name, player, "hand");
  const before = game.eventsOfType("cascade-revealed").length;
  game.dispatch({ type: "cast-spell", player, card, targets: [] });
  for (let i = 0; i < 200 && !quiet(game.state); i += 1) {
    if (game.state.awaiting?.kind === "cast-now") {
      game.dispatch({ type: "cast-now", player: game.state.awaiting.player, cast: null });
    } else if (game.state.awaiting !== null) {
      throw new Error(`unexpected ${game.state.awaiting.kind}`);
    } else {
      game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
    }
  }
  return game.eventsOfType("cascade-revealed").length - before;
};

const lands = (n: number, name = "Wastes"): string[] => Array<string>(n).fill(name);

describe("Maelstrom Wanderer", () => {
  it("cascades twice", () => {
    const game = setUp(["Grizzly Bears", "Grizzly Bears"], [...lands(5, "Forest"), "Island", "Mountain", "Forest"]);
    expect(castAndCount(game, "Maelstrom Wanderer")).toBe(2);
  });
});

describe("The First Sliver", () => {
  it("gives Sliver spells cascade while it's on the battlefield, not other spells", () => {
    const game = setUp(["Wastes"], lands(4));
    game.debugSpawn("The First Sliver", A, "battlefield");
    expect(castAndCount(game, "Metallic Sliver")).toBe(1);
    expect(castAndCount(game, "Sol Ring")).toBe(0);
  });
});

describe("Imoti, Celebrant of Bounty", () => {
  it("gives spells of mana value 6 or greater cascade", () => {
    const game = setUp(["Grizzly Bears"], lands(10));
    game.debugSpawn("Imoti, Celebrant of Bounty", A, "battlefield");
    expect(castAndCount(game, "Bygone Colossus")).toBe(1);
  });
});

describe("Zhulodok, Void Gorger", () => {
  it("gives a colorless spell of mana value 7 or more cast from hand cascade, cascade", () => {
    const game = setUp(["Grizzly Bears", "Grizzly Bears"], lands(10));
    game.debugSpawn("Zhulodok, Void Gorger", A, "battlefield");
    expect(castAndCount(game, "Bygone Colossus")).toBe(2);
  });

  it("but not a smaller one", () => {
    const game = setUp(["Grizzly Bears"], lands(4));
    game.debugSpawn("Zhulodok, Void Gorger", A, "battlefield");
    expect(castAndCount(game, "Sol Ring")).toBe(0);
  });
});

describe("Yidris, Maelstrom Wielder", () => {
  it("after combat damage to a player, spells cast from hand that turn have cascade; the next turn they don't", () => {
    const game = setUp(["Grizzly Bears", "Grizzly Bears"], lands(4, "Forest"));
    const yidris = game.debugSpawn("Yidris, Maelstrom Wielder", A, "battlefield", { summoningSick: false });
    for (let i = 0; i < 200 && game.state.turn.step !== "postcombat-main"; i += 1) {
      const a = game.state.awaiting;
      if (a?.kind === "attackers") {
        game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: yidris, defender: B }] });
      } else if (a?.kind === "blockers") {
        game.dispatch({ type: "declare-blockers", player: a.player, blockers: [] });
      } else if (a !== null) {
        throw new Error(`unexpected ${a.kind}`);
      } else {
        game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
      }
    }
    expect(game.state.players[B].life).toBe(15);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && s.priority.holder === A && quiet(s));
    expect(castAndCount(game, "Grizzly Bears")).toBe(1);
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && s.priority.holder === A);
    expect(castAndCount(game, "Grizzly Bears")).toBe(0);
  });
});

describe("Jodah, the Unifier", () => {
  /** Alice casts Saruman, the White Hand (legendary, mana value 4) from her
   * hand; under her opening hand and first draw are a Wastes, then Ayula,
   * Queen Among Bears (legendary, mana value 2), then a Grizzly Bears. */
  const castLegend = (accept: boolean): { game: Game; found: ObjectId | undefined; wastes: number } => {
    const game = setUp(["Wastes", "Ayula, Queen Among Bears", "Grizzly Bears"], ["Island", "Swamp", "Mountain", "Wastes"]);
    game.debugSpawn("Jodah, the Unifier", A, "battlefield");
    const saruman = game.debugSpawn("Saruman, the White Hand", A, "hand");
    const libraryBefore = game.state.zones.perPlayer[A].library.length;
    game.dispatch({ type: "cast-spell", player: A, card: saruman, targets: [] });
    let found: ObjectId | undefined;
    for (let i = 0; i < 200 && !quiet(game.state); i += 1) {
      const a = game.state.awaiting;
      if (a?.kind === "cast-now") {
        found = a.cards[0];
        game.dispatch({
          type: "cast-now",
          player: A,
          cast: accept ? { type: "cast-spell", player: A, card: a.cards[0], targets: [], via: "effect", free: true } : null,
        });
      } else if (a !== null) {
        throw new Error(`unexpected ${a.kind}`);
      } else {
        game.dispatch({ type: "pass-priority", player: game.state.priority.holder! });
      }
    }
    return { game, found, wastes: libraryBefore - game.state.zones.perPlayer[A].library.length };
  };

  it("finds a legendary nonland card of lesser mana value and casts it free", () => {
    const { game, found } = castLegend(true);
    expect(found).toBeDefined();
    expect(game.state.objects[found!].cardName).toBe("Ayula, Queen Among Bears");
    expect(game.state.objects[found!].zone).toBe("battlefield");
  });

  it("declined, the card stays in exile, and the rest go to the bottom", () => {
    const { game, found, wastes } = castLegend(false);
    expect(game.state.objects[found!].zone).toBe("exile");
    // Only Ayula left the library for good; the Wastes before it is on the bottom.
    expect(wastes).toBe(1);
    const library = game.state.zones.perPlayer[A].library;
    expect(game.state.objects[library[library.length - 1]].cardName).toBe("Wastes");
  });

  it("doesn't trigger for a nonlegendary spell", () => {
    const game = setUp(["Wastes", "Ayula, Queen Among Bears"], lands(2, "Forest"));
    game.debugSpawn("Jodah, the Unifier", A, "battlefield");
    const before = game.state.zones.shared.exile.length;
    castAndCount(game, "Grizzly Bears");
    expect(game.state.zones.shared.exile.length).toBe(before);
  });
});
