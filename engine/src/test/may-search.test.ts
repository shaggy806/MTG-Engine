/**
 * "You may search your library for …": the search is optional as a whole,
 * not just its find. Saying no searches nothing and shuffles nothing, so a
 * library order the player set up (a scry, a Brainstorm) survives — which a
 * bare `search-library` with `min: 0` can't give, since it always searches
 * and shuffles. Each such card wraps the search in a `may` (Fierce Empath's
 * shape), and a pool audit holds every card to it.
 */

import { describe, expect, it } from "vitest";

import { POOL_CARDS } from "../cards/generated.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      // Seven in the opening hand and the turn-1 draw leave the Craw Wurm on top.
      { player: A, cards: [...Array<string>(8).fill("Swamp"), "Craw Wurm", ...Array<string>(15).fill("Forest"), ...Array<string>(15).fill("Grizzly Bears")] },
      { player: B, cards: Array<string>(40).fill("Forest") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;

const shufflesOf = (game: Game): number =>
  game.eventsOfType("library-shuffled").filter((e) => e.player === A).length;

describe("\"you may search\" is optional — Primal Druid", () => {
  const killDruid = (game: Game): void => {
    const druid = game.debugSpawn("Primal Druid", A, "battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: druid }]);
  };

  it("declining leaves the library exactly as it was, unshuffled", () => {
    const { game, a } = setUp();
    const library = [...game.state.zones.perPlayer[A].library];
    expect(game.state.objects[library[0]].cardName).toBe("Craw Wurm");
    const shuffles = shufflesOf(game);
    let asked = false;
    a.chooseModesFn = () => {
      asked = true;
      return [];
    };

    killDruid(game);
    game.advanceUntil(quiet);

    expect(asked).toBe(true);
    expect(game.state.zones.perPlayer[A].library).toEqual(library);
    expect(shufflesOf(game)).toBe(shuffles);
  });

  it("saying yes searches, puts the land in tapped, and shuffles", () => {
    const { game, a } = setUp();
    const shuffles = shufflesOf(game);
    a.chooseModesFn = () => [0];
    a.chooseFromZoneFn = (_view, eligible) => eligible.slice(0, 1);
    const forestsBefore = game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest").length;

    killDruid(game);
    game.advanceUntil(quiet);

    const forests = game.battlefield.filter((id) => game.state.objects[id].cardName === "Forest");
    expect(forests).toHaveLength(forestsBefore + 1);
    expect(forests.every((id) => game.state.objects[id].tapped)).toBe(true);
    expect(shufflesOf(game)).toBe(shuffles + 1);
  });
});

describe("\"you may search\" — the pool", () => {
  // Every search of a card whose text says "you may search" sits inside a
  // `may`, but for one another player is asked to make ("its controller may
  // search" — Path to Exile, Demolition Field's first), which a `may` can't
  // put to them: `min: 0` is all that has.
  it("every \"you may search\" search is wrapped in a may", () => {
    type Found = { inMay: boolean };
    const searches = (node: unknown, inMay: boolean, out: Found[]): void => {
      if (Array.isArray(node)) for (const each of node) searches(each, inMay, out);
      else if (node !== null && typeof node === "object") {
        const kind = (node as { kind?: unknown }).kind;
        if (kind === "search-library") out.push({ inMay });
        for (const value of Object.values(node)) searches(value, inMay || kind === "may", out);
      }
    };
    const cards = POOL_CARDS.filter((card) => /you may search/i.test(card.text ?? ""));
    expect(cards.length).toBeGreaterThanOrEqual(60);
    const wrong = cards.filter((card) => {
      const found: Found[] = [];
      searches(card, false, found);
      // "That land's controller may search", "its controller may search" …
      const othersMay = ((card.text ?? "").match(/may search/gi) ?? []).length -
        ((card.text ?? "").match(/you may search/gi) ?? []).length;
      return found.filter((each) => !each.inMay).length > othersMay;
    });
    expect(wrong.map((card) => card.name)).toEqual([]);
  });
});
