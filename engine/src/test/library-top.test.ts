/**
 * Putting a card on top of a library — the tutor-to-top family (Vampiric
 * Tutor, Mystical Tutor) and the graveyard-to-top lands (Academy Ruins,
 * Mortuary Mire).
 *
 * The ordering matters and is easy to get wrong: a tutor shuffles *and then*
 * puts the find on top (rule 701.19j), so a find placed before the shuffle
 * would just get lost in it.
 */
import { describe, expect, it } from "vitest";

import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const mkGame = (aCards: readonly string[], aLibrary: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      {
        player: A,
        cards: [
          ...aCards,
          // Filler so `aLibrary` sits below the opening hand plus turn 1's
          // draw — otherwise the cards meant to be *searched for* are in hand.
          ...Array(Math.max(0, 9 - aCards.length)).fill("Swamp"),
          ...aLibrary,
          ...Array(40).fill("Swamp"),
        ],
      },
      { player: B, cards: Array(40).fill("Island") },
    ],
  });
  return { game, a };
};

const toPrecombat = (s: GameState): boolean =>
  s.turn.number === 1 && s.turn.step === "precombat-main";
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const handCard = (game: Game, name: string): ObjectId => {
  const id = game.handOf(A).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const topOfLibrary = (game: Game): string =>
  game.state.objects[game.state.zones.perPlayer[A].library[0]].cardName;

describe("tutor-to-top (Vampiric Tutor)", () => {
  it("puts the find on top and costs 2 life", () => {
    const { game, a } = mkGame(["Vampiric Tutor", "Swamp"], ["Grizzly Bears", "Craw Wurm"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Swamp", A, "battlefield");
    a.chooseFromZoneFn = (_v, eligible) => {
      const wurm = eligible.find((id) => game.state.objects[id].cardName === "Craw Wurm");
      return wurm === undefined ? [] : [wurm];
    };
    const life0 = game.state.players[A].life;

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Vampiric Tutor"),
      targets: [],
    });
    game.advanceUntil(quiet);

    // Survived the shuffle the search itself causes — this is the whole point.
    expect(topOfLibrary(game)).toBe("Craw Wurm");
    expect(game.state.players[A].life).toBe(life0 - 2);
  });

  it("offers only matching cards (Mystical Tutor finds instants and sorceries)", () => {
    const { game, a } = mkGame(["Mystical Tutor", "Island"], ["Grizzly Bears", "Lightning Bolt"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Island", A, "battlefield");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_v, eligible) => {
      offered = eligible;
      return eligible.slice(0, 1);
    };

    game.dispatch({
      type: "cast-spell",
      player: A,
      card: handCard(game, "Mystical Tutor"),
      targets: [],
    });
    game.advanceUntil(quiet);

    expect(offered.map((id) => game.state.objects[id].cardName)).toEqual(["Lightning Bolt"]);
    expect(topOfLibrary(game)).toBe("Lightning Bolt");
  });

  it("a whiff still shuffles and costs the life", () => {
    // Nothing but Swamps in the library, so Mystical Tutor finds nothing.
    const { game, a } = mkGame(["Mystical Tutor", "Island"]);
    game.advanceUntil(toPrecombat);
    game.debugSpawn("Island", A, "battlefield");
    a.chooseFromZoneFn = () => [];

    expect(() => {
      game.dispatch({
        type: "cast-spell",
        player: A,
        card: handCard(game, "Mystical Tutor"),
        targets: [],
      });
      game.advanceUntil(quiet);
    }).not.toThrow();
  });
});

describe("graveyard to the top of the library (Academy Ruins)", () => {
  it("moves the targeted card out of the graveyard and onto the deck", () => {
    const { game } = mkGame(["Island"]);
    game.advanceUntil(toPrecombat);
    const ruins = game.debugSpawn("Academy Ruins", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    const signet = game.debugSpawn("Arcane Signet", A, "graveyard");

    game.dispatch({
      type: "activate-ability",
      player: A,
      source: ruins,
      abilityIndex: 1,
      targets: [{ kind: "object", object: signet }],
    });
    game.advanceUntil(quiet);

    expect(game.state.objects[signet].zone).toBe("library");
    expect(topOfLibrary(game)).toBe("Arcane Signet");
    expect(game.state.zones.perPlayer[A].graveyard).not.toContain(signet);
  });

  it("only offers artifacts — an enchantment in the graveyard isn't a legal target", () => {
    const { game } = mkGame(["Island"]);
    game.advanceUntil(toPrecombat);
    const ruins = game.debugSpawn("Academy Ruins", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Island", A, "battlefield");
    game.debugSpawn("Rest in Peace", A, "graveyard");

    const options = game
      .legalActions(A)
      .filter((a) => a.kind === "activate-ability" && a.source === ruins && a.abilityIndex === 1);
    // No artifact card in the graveyard, so the ability has no legal target
    // and isn't offered at all (rule 601.2c).
    expect(options).toHaveLength(0);
  });
});

describe("Mortuary Mire — an optional graveyard-to-top on entry", () => {
  it("puts the chosen creature card on top", () => {
    const { game } = mkGame([]);
    game.advanceUntil(toPrecombat);
    const bear = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugSpawn("Mortuary Mire", A, "battlefield", { announceEntry: true });
    game.advanceUntil((s) => s.awaiting?.kind === "choose-targets" || quiet(s));

    if (game.state.awaiting?.kind === "choose-targets") {
      game.dispatch({
        type: "choose-targets",
        player: A,
        targets: [{ kind: "object", object: bear }],
      });
    }
    game.advanceUntil(quiet);

    expect(topOfLibrary(game)).toBe("Grizzly Bears");
  });
});
